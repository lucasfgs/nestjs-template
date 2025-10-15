const fs = require('fs');
const os = require('os');
const path = require('path');

const AWS = require('aws-sdk');
const sharp = require('sharp');

const { Logger } = require('./logger');

/**
 * File upload service for serverless functions
 * Simplified version of the NestJS MediaService
 */
class MediaService {
  constructor(prismaService) {
    this.prisma = prismaService;
    this.logger = new Logger('MediaService');

    // Initialize configuration from environment variables
    this.defaultDisk = {
      driver: 's3',
      visibility: 'public',
      bucket: process.env.AWS_S3_BUCKET,
      region: process.env.AWS_REGION,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      cloudfrontUrl: process.env.AWS_CLOUDFRONT_MEDIA_URL,
    };

    // Initialize S3 client
    this.s3 = new AWS.S3({
      accessKeyId: this.defaultDisk.accessKeyId,
      secretAccessKey: this.defaultDisk.secretAccessKey,
      region: this.defaultDisk.region,
    });

    // Conversion configurations
    this.conversionConfigs = {
      thumb: { width: 200, height: 200, quality: 80 },
      hero: { width: 1200, height: 800, quality: 85 },
      default: { width: 600, height: 400, quality: 80 },
      hero_mobile: { width: 800, height: 600, quality: 80 },
    };
  }

  /**
   * Find media files with PENDING status older than specified hours
   */
  async findPendingValidationMedia(hoursOld) {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - hoursOld);

    return this.prisma.media.findMany({
      where: {
        created_at: {
          lt: cutoffDate,
        },
        status: 'PENDING',
      },
      select: {
        id: true,
        file_name: true,
        disk: true,
        model_type: true,
        model_id: true,
        collection_name: true,
        status: true,
      },
    });
  }

  /**
   * Get media by ID
   */
  async getMediaById(id) {
    return this.prisma.media.findUnique({
      where: { id },
    });
  }

  /**
   * Delete media file and database record
   */
  async deleteMedia(id) {
    const media = await this.prisma.media.findUnique({
      where: { id },
    });

    if (!media) {
      throw new Error(`Media with ID ${id} not found`);
    }

    // Delete physical file from S3
    await this.deleteFileFromS3(media.file_name, media.disk);

    // Delete database record
    await this.prisma.media.delete({
      where: { id },
    });
  }

  /**
   * Delete file from S3
   */
  async deleteFileFromS3(filename, disk) {
    const key = disk ? `${disk}/${filename}` : filename;

    try {
      await this.s3
        .deleteObject({
          Bucket: this.defaultDisk.bucket,
          Key: key,
        })
        .promise();

      this.logger.log(`Deleted S3 object: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to delete S3 object ${key}:`, error);
      // Don't throw error, as file might not exist
    }
  }

  /**
   * Generate image conversions for uploaded media
   */
  async generateImageConversions(mediaId, originalKey, mimeType) {
    this.logger.log(
      `Starting image conversions for media ${mediaId}, key: ${originalKey}`,
    );

    // Get media record
    const media = await this.prisma.media.findUnique({
      where: { id: mediaId },
    });

    if (!media) {
      this.logger.warn(`Media ${mediaId} not found, skipping conversions`);
      return;
    }

    const fileName = media.file_name;
    const extension = path.extname(fileName) || '.jpg';
    const originalTempPath = path.join(
      os.tmpdir(),
      `media-${mediaId}-${Date.now()}${extension}`,
    );

    try {
      // Check if S3 object exists
      this.logger.log(`Checking S3 object exists: ${originalKey}`);
      try {
        await this.s3
          .headObject({
            Bucket: this.defaultDisk.bucket,
            Key: originalKey,
          })
          .promise();
      } catch (headErr) {
        this.logger.error(
          `S3 object not found for media ${mediaId} at key ${originalKey}:`,
          headErr.message,
        );

        // Update DB to reflect no conversions yet
        const customProps = media.custom_properties || {};
        customProps.generated_conversions = {
          hero: false,
          thumb: false,
          default: false,
          hero_mobile: false,
        };

        await this.prisma.media.update({
          where: { id: mediaId },
          data: { custom_properties: customProps },
        });

        return;
      }

      // Download original file
      this.logger.log(`Downloading original object from S3: ${originalKey}`);
      const getObject = await this.s3
        .getObject({
          Bucket: this.defaultDisk.bucket,
          Key: originalKey,
        })
        .promise();

      if (!getObject.Body) {
        throw new Error('No body in S3 object response');
      }

      // Write to temp file
      fs.writeFileSync(originalTempPath, getObject.Body);

      // Generate conversions
      const generatedConversions = {};

      for (const [conversionName, config] of Object.entries(
        this.conversionConfigs,
      )) {
        try {
          const conversionKey = originalKey.replace(
            fileName,
            `conversions/${conversionName}-${fileName}`,
          );

          // Create conversion using Sharp
          const conversionBuffer = await sharp(originalTempPath)
            .resize(config.width, config.height, {
              fit: 'cover',
              position: 'center',
            })
            .jpeg({ quality: config.quality })
            .toBuffer();

          // Upload conversion to S3
          await this.s3
            .putObject({
              Bucket: this.defaultDisk.bucket,
              Key: conversionKey,
              Body: conversionBuffer,
              ContentType: 'image/jpeg',
              ACL: 'public-read',
            })
            .promise();

          generatedConversions[conversionName] = true;
          this.logger.log(
            `Generated conversion ${conversionName} for media ${mediaId}`,
          );
        } catch (conversionError) {
          this.logger.error(
            `Failed to generate ${conversionName} conversion for media ${mediaId}:`,
            conversionError,
          );
          generatedConversions[conversionName] = false;
        }
      }

      // Update database with conversion status
      const customProps = media.custom_properties || {};
      customProps.generated_conversions = generatedConversions;

      await this.prisma.media.update({
        where: { id: mediaId },
        data: {
          custom_properties: customProps,
          status: 'WAITING_OPTIMIZATION', // or 'DONE' depending on your logic
        },
      });

      this.logger.log(
        `Completed conversions for media ${mediaId}. Generated: ${Object.entries(
          generatedConversions,
        )
          .filter(([, success]) => success)
          .map(([name]) => name)
          .join(', ')}`,
      );
    } catch (error) {
      this.logger.error(
        `Error during generateImageConversions for media ${mediaId}:`,
        error.message,
      );

      // Update media status to reflect the error
      try {
        await this.prisma.media.update({
          where: { id: mediaId },
          data: { status: 'ERROR' },
        });
      } catch (updateError) {
        this.logger.error(
          `Failed to update media status to ERROR for ${mediaId}:`,
          updateError,
        );
      }

      throw error;
    } finally {
      // Clean up temp file
      try {
        if (fs.existsSync(originalTempPath)) {
          fs.unlinkSync(originalTempPath);
        }
      } catch (cleanupError) {
        this.logger.warn(
          `Failed to clean up temp file ${originalTempPath}:`,
          cleanupError,
        );
      }
    }
  }
}

module.exports = { MediaService };
