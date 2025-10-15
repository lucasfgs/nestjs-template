const { FileUploadService } = require('../services/file-upload');
const { Logger } = require('../services/logger');
const { PrismaService } = require('../services/prisma');

/**
 * AWS Lambda handler for S3 ObjectCreated events
 * JavaScript equivalent of the NestJS s3.handler.ts
 */
exports.handler = async (event = {}) => {
  const logger = new Logger('s3.handler');
  let prismaService;

  try {
    logger.log(
      'Starting S3 handler with event:',
      JSON.stringify(event, null, 2),
    );

    // Initialize services
    prismaService = new PrismaService();
    await prismaService.connect();

    const fileUploadService = new FileUploadService(prismaService);

    const records = Array.isArray(event.Records) ? event.Records : [];
    logger.log(`S3 handler: processing ${records.length} records`);

    for (const record of records) {
      try {
        if (!record.s3 || !record.s3.bucket || !record.s3.object) {
          logger.warn('Invalid S3 record format, skipping:', record);
          continue;
        }

        const rawKey = record.s3.object.key || '';
        const key = decodeURIComponent(rawKey.replace(/\+/g, ' '));

        // Skip conversion artifacts to avoid recursion
        if (key.includes('/conversions/')) {
          logger.debug(`Skipping conversion artifact: ${key}`);
          continue;
        }

        const parts = key.split('/');
        const maybeId = parts.length > 1 ? parts[0] : null;

        if (maybeId) {
          const mediaIdNum = Number(maybeId);
          if (Number.isInteger(mediaIdNum) && mediaIdNum > 0) {
            try {
              logger.log(`Processing media ID ${mediaIdNum} with key ${key}`);

              await fileUploadService.generateImageConversions(
                mediaIdNum,
                key,
                record.s3.object.contentType || undefined,
              );

              logger.log(
                `Successfully processed conversions for media ${mediaIdNum}`,
              );
            } catch (conversionError) {
              logger.error(
                `Conversion error for key ${key}:`,
                conversionError.message,
              );
            }
          } else {
            logger.warn(
              `Could not parse mediaId from key segment '${maybeId}', skipping key ${key}`,
            );
          }
        } else {
          logger.warn(`No valid mediaId found in key ${key}, skipping`);
        }
      } catch (recordError) {
        logger.error('S3 record processing error:', recordError.message);
      }
    }

    logger.log('S3 handler finished successfully');
    return {
      statusCode: 200,
      body: JSON.stringify({ status: 'ok', recordsProcessed: records.length }),
    };
  } catch (error) {
    logger.error('S3 handler error:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        status: 'error',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      }),
    };
  } finally {
    // Clean up database connection
    if (prismaService) {
      try {
        await prismaService.disconnect();
      } catch (disconnectError) {
        logger.error('Error disconnecting from database:', disconnectError);
      }
    }
  }
};
