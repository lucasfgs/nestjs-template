import * as crypto from 'crypto';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import * as AWS from 'aws-sdk';

import { PrismaService } from '@modules/shared/prisma/prisma.service';

import { IDiskConfig } from './interfaces/file-upload.interface';
import { IMediaUpdateInput } from './interfaces/media.interface';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const _sharp = require('sharp');
const sharp = _sharp && _sharp.default ? _sharp.default : _sharp;

// Supported model types and collection names for validation and optimization
export const SUPPORTED_MODEL_TYPES = ['profile', 'user'] as const;

export const SUPPORTED_COLLECTION_NAMES = ['photo'] as const;

export const SUPPORTED_CONVERSIONS = [
  'thumb',
  'hero',
  'default',
  'hero_mobile',
] as const;

export type SupportedModelType = (typeof SUPPORTED_MODEL_TYPES)[number];
export type SupportedCollectionName =
  (typeof SUPPORTED_COLLECTION_NAMES)[number];
export type SupportedConversion = (typeof SUPPORTED_CONVERSIONS)[number];

@Injectable()
export class FileUploadService {
  private readonly logger = new Logger(FileUploadService.name);
  private readonly defaultDisk: IDiskConfig;
  private readonly maxFileSize: number;
  private readonly allowedMimeTypes: string[];
  private s3: AWS.S3;

  constructor(private readonly prisma: PrismaService) {
    // Initialize configuration from environment variables
    this.defaultDisk = {
      driver: 's3' as const,
      visibility: 'public',
      // S3 specific config
      bucket: process.env.AWS_S3_BUCKET!,
      region: process.env.AWS_REGION!,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      cloudfrontUrl: process.env.AWS_CLOUDFRONT_MEDIA_URL!,
    };

    this.maxFileSize = parseInt(process.env.MAX_FILE_SIZE || '10485760'); // 10MB default

    this.allowedMimeTypes = process.env.ALLOWED_MIME_TYPES
      ? process.env.ALLOWED_MIME_TYPES.split(',')
      : [
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
          'application/pdf',
          'text/plain',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];

    // Initialize S3 client (required for this service)
    this.s3 = new AWS.S3({
      accessKeyId: this.defaultDisk.accessKeyId,
      secretAccessKey: this.defaultDisk.secretAccessKey,
      region: this.defaultDisk.region,
    });
  }

  /**
   * Get next order column value for proper sorting
   */
  private async getNextOrderColumn(
    model_type: string,
    model_id: bigint,
    collection_name?: string,
  ): Promise<number> {
    const maxOrder = await this.prisma.media.aggregate({
      where: {
        model_type,
        model_id,
        collection_name: collection_name || 'default',
      },
      _max: {
        order_column: true,
      },
    });

    return (maxOrder._max.order_column || 0) + 1;
  }

  /**
   * Get media files for a specific model
   */

  /**
   * Generate URL for a file (supports S3 and CloudFront with proper structure)
   */
  private generateFileUrl(mediaId: number, fileName: string): string {
    const bucket = this.defaultDisk.bucket;
    const region = this.defaultDisk.region || 'us-east-1';
    const cloudfrontUrl = this.defaultDisk.cloudfrontUrl;

    if (!bucket) {
      throw new Error('S3 bucket not configured');
    }

    // Use CloudFront URL if configured, otherwise use S3
    const baseUrl =
      cloudfrontUrl ||
      (region === 'us-east-1'
        ? `https://${bucket}.s3.amazonaws.com`
        : `https://${bucket}.s3.${region}.amazonaws.com`);

    // Return URL with mediaId prefix as per the required structure (consistent with storage)
    return `${baseUrl}/${mediaId}/${fileName}`;
  }

  /**
   * Generate URL for a specific conversion
   */
  private generateConversionUrl(
    mediaId: number,
    fileName: string,
    conversion: string,
  ): string {
    const bucket = this.defaultDisk.bucket;
    const region = this.defaultDisk.region || 'us-east-1';
    const cloudfrontUrl = this.defaultDisk.cloudfrontUrl;

    if (!bucket) {
      throw new Error('S3 bucket not configured');
    }

    // Use CloudFront URL if configured, otherwise use S3
    const baseUrl =
      cloudfrontUrl ||
      (region === 'us-east-1'
        ? `https://${bucket}.s3.amazonaws.com`
        : `https://${bucket}.s3.${region}.amazonaws.com`);

    // Generate conversion filename with original filename included
    const originalNameWithoutExt = fileName.replace(/\.[^/.]+$/, ''); // Remove extension
    const originalExtension = fileName.match(/\.[^/.]+$/)?.[0] || '.jpg'; // Get original extension or default to .jpg
    const conversionFileName = `${originalNameWithoutExt}-${conversion}${originalExtension}`;

    // Return URL with conversions path (consistent with storage structure)
    return `${baseUrl}/${mediaId}/conversions/${conversionFileName}`;
  }

  /**
   * Get the best available conversion or fallback to original
   */
  private getBestConversion(media: any, preferredConversion?: string): string {
    const customProps = media.custom_properties || {};
    const generatedConversions = customProps.generated_conversions || {};

    // If preferred conversion is requested and available, use it
    if (preferredConversion && generatedConversions[preferredConversion]) {
      return preferredConversion;
    }

    // Try conversions in order of preference: hero, thumb, default
    const conversionOrder: SupportedConversion[] = ['hero', 'thumb', 'default'];
    for (const conversion of conversionOrder) {
      if (generatedConversions[conversion]) {
        return conversion;
      }
    }

    // If no conversions available, return null (will use original)
    return null;
  }

  /**
   * Get the best available URL for a media item (checks conversions first)
   */
  private getBestAvailableUrl(
    media: any,
    preferredConversion?: string,
  ): string {
    const mediaId = media.id;
    const fileName = media.file_name;
    const bestConversion = this.getBestConversion(media, preferredConversion);

    return bestConversion
      ? this.generateConversionUrl(mediaId, fileName, bestConversion)
      : this.generateFileUrl(mediaId, fileName);
  }

  /**
   * Generate signed URL for private S3 objects with proper structure
   */
  private generateSignedS3Url(
    mediaId: number,
    fileName: string,
    expiresIn: number = 3600,
  ): string {
    const bucket = this.defaultDisk.bucket;
    const cloudfrontUrl = this.defaultDisk.cloudfrontUrl;

    if (!bucket) {
      throw new Error('S3 bucket not configured');
    }

    // Create the key with mediaId prefix (consistent with final storage structure)
    const key = `${mediaId}/${fileName}`;

    // If CloudFront is configured, we assume it's set up to serve private content
    // In this case, we might need signed CloudFront URLs, but for now we'll use direct S3
    if (cloudfrontUrl) {
      return `${cloudfrontUrl}/${key}`;
    }

    // Generate signed S3 URL for private objects
    const params = {
      Bucket: bucket,
      Key: key,
      Expires: expiresIn, // URL expires in 1 hour by default
    };

    try {
      return this.s3.getSignedUrl('getObject', params);
    } catch (error) {
      // Log error (could be replaced with proper logging service)
      throw new Error('Failed to generate secure file URL');
    }
  }

  /**
   * Generate signed URL for a specific conversion
   */
  private generateSignedConversionUrl(
    mediaId: number,
    fileName: string,
    conversion: string,
    expiresIn: number = 3600,
  ): string {
    const bucket = this.defaultDisk.bucket;
    const cloudfrontUrl = this.defaultDisk.cloudfrontUrl;

    if (!bucket) {
      throw new Error('S3 bucket not configured');
    }

    // Generate conversion filename with original filename included
    const originalNameWithoutExt = fileName.replace(/\.[^/.]+$/, ''); // Remove extension
    const originalExtension = fileName.match(/\.[^/.]+$/)?.[0] || '.jpg'; // Get original extension or default to .jpg
    const conversionFileName = `${originalNameWithoutExt}-${conversion}${originalExtension}`;

    // Create the key with conversions path (consistent with final storage structure)
    const key = `${mediaId}/conversions/${conversionFileName}`;

    // If CloudFront is configured, we assume it's set up to serve private content
    if (cloudfrontUrl) {
      return `${cloudfrontUrl}/${key}`;
    }

    // Generate signed S3 URL for private objects
    const params = {
      Bucket: bucket,
      Key: key,
      Expires: expiresIn, // URL expires in 1 hour by default
    };

    try {
      return this.s3.getSignedUrl('getObject', params);
    } catch (error) {
      // Log error (could be replaced with proper logging service)
      throw new Error('Failed to generate secure file URL');
    }
  }

  /**
   * Get the best available signed URL for a media item (checks conversions first)
   */
  private getBestAvailableSignedUrl(
    media: any,
    preferredConversion?: string,
  ): string {
    const mediaId = media.id;
    const fileName = media.file_name;
    const bestConversion = this.getBestConversion(media, preferredConversion);

    return bestConversion
      ? this.generateSignedConversionUrl(mediaId, fileName, bestConversion)
      : this.generateSignedS3Url(mediaId, fileName);
  }

  async getMediaForModel(
    model_type: string,
    model_id: bigint,
    collection_name?: string,
    conversion?: string,
  ) {
    // Validate conversion type if provided
    if (conversion && !this.validateConversion(conversion)) {
      throw new BadRequestException(
        `Invalid conversion type: ${conversion}. Supported conversions: ${SUPPORTED_CONVERSIONS.join(', ')}`,
      );
    }

    const where: any = {
      model_type,
      model_id,
    };

    if (collection_name) {
      where.collection_name = collection_name;
    }

    const mediaRecords = await this.prisma.media.findMany({
      where,
      orderBy: [
        { collection_name: 'asc' },
        { order_column: 'asc' },
        { created_at: 'asc' },
      ],
    });

    // Add URLs to each media record
    return mediaRecords.map((media) => {
      const url =
        this.defaultDisk.visibility === 'private'
          ? this.getBestAvailableSignedUrl(media, conversion)
          : this.getBestAvailableUrl(media, conversion);

      return {
        ...media,
        url,
        custom_properties: (media.custom_properties as object) || {},
      };
    });
  }

  /**
   * Get media by ID
   */
  async getMediaById(id: number, conversion?: string) {
    // Validate conversion type if provided
    if (conversion && !this.validateConversion(conversion)) {
      throw new BadRequestException(
        `Invalid conversion type: ${conversion}. Supported conversions: ${SUPPORTED_CONVERSIONS.join(', ')}`,
      );
    }

    const media = await this.prisma.media.findUnique({
      where: { id },
    });

    if (!media) {
      throw new NotFoundException(`Media with ID ${id} not found`);
    }

    // Add URL to the media record
    const url =
      this.defaultDisk.visibility === 'private'
        ? this.getBestAvailableSignedUrl(media, conversion)
        : this.getBestAvailableUrl(media, conversion);

    return {
      ...media,
      url,
      custom_properties: (media.custom_properties as object) || {},
    };
  }

  /**
   * Update media information
   */
  async updateMedia(id: number, updateData: IMediaUpdateInput) {
    const media = await this.prisma.media.findUnique({
      where: { id },
    });

    if (!media) {
      throw new NotFoundException(`Media with ID ${id} not found`);
    }

    // Parse custom_properties if it's a string
    if (typeof updateData.custom_properties === 'string') {
      try {
        updateData.custom_properties = JSON.parse(updateData.custom_properties);
      } catch {
        throw new BadRequestException('Invalid custom_properties JSON format');
      }
    }

    const updatedMedia = await this.prisma.media.update({
      where: { id },
      data: updateData,
    });

    // Add URL to the updated media record
    const url =
      this.defaultDisk.visibility === 'private'
        ? this.getBestAvailableSignedUrl(updatedMedia)
        : this.getBestAvailableUrl(updatedMedia);

    return {
      ...updatedMedia,
      url,
      custom_properties: (updatedMedia.custom_properties as object) || {},
    };
  }

  /**
   * Get URL for a specific conversion
   */
  async getConversionUrl(mediaId: number, conversion: string): Promise<string> {
    // Validate conversion type
    if (!this.validateConversion(conversion)) {
      throw new BadRequestException(
        `Invalid conversion type: ${conversion}. Supported conversions: ${SUPPORTED_CONVERSIONS.join(', ')}`,
      );
    }

    const media = await this.prisma.media.findUnique({
      where: { id: mediaId },
    });

    if (!media) {
      throw new NotFoundException(`Media with ID ${mediaId} not found`);
    }

    const customProps = (media.custom_properties as any) || {};
    const generatedConversions = customProps.generated_conversions || {};

    if (!generatedConversions[conversion]) {
      throw new NotFoundException(
        `Conversion '${conversion}' not available for media ${mediaId}`,
      );
    }

    return this.defaultDisk.visibility === 'private'
      ? this.generateSignedConversionUrl(mediaId, media.file_name, conversion)
      : this.generateConversionUrl(mediaId, media.file_name, conversion);
  }

  /**
   * Get all available conversions for a media item
   */
  async getAvailableConversions(
    mediaId: number,
  ): Promise<{ [key: string]: string }> {
    const media = await this.prisma.media.findUnique({
      where: { id: mediaId },
    });

    if (!media) {
      throw new NotFoundException(`Media with ID ${mediaId} not found`);
    }

    const customProps = (media.custom_properties as any) || {};
    const generatedConversions = customProps.generated_conversions || {};
    const isPrivate = this.defaultDisk.visibility === 'private';

    const conversions: { [key: string]: string } = {};

    // Add original image
    conversions.original = isPrivate
      ? this.generateSignedS3Url(mediaId, media.file_name)
      : this.generateFileUrl(mediaId, media.file_name);

    // Add available conversions using optimized approach
    for (const conversion of SUPPORTED_CONVERSIONS) {
      if (generatedConversions[conversion]) {
        conversions[conversion] = isPrivate
          ? this.generateSignedConversionUrl(
              mediaId,
              media.file_name,
              conversion,
            )
          : this.generateConversionUrl(mediaId, media.file_name, conversion);
      }
    }

    return conversions;
  }

  /**
   * Delete media and associated file
   */
  async deleteMedia(id: number): Promise<void> {
    const media = await this.prisma.media.findUnique({
      where: { id },
    });

    if (!media) {
      throw new NotFoundException(`Media with ID ${id} not found`);
    }

    // Delete physical file from S3
    await this.deleteFileFromS3(media.file_name, media.disk);

    // Delete database record
    await this.prisma.media.delete({
      where: { id },
    });
  }

  /**
   * Find media files with PENDING status older than specified hours
   */
  async findPendingValidationMedia(hoursOld: number) {
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
   * Update media status from PENDING to DONE for a specific media item
   */
  async removePendingValidationFlag(mediaId: number): Promise<void>;
  async removePendingValidationFlag(
    modelType: string,
    modelId: number,
  ): Promise<void>;
  async removePendingValidationFlag(
    mediaIdOrModelType: number | string,
    modelId?: number,
  ): Promise<void> {
    // Check if it's a media ID (number) or model type (string)
    if (typeof mediaIdOrModelType === 'number') {
      // Handle single media ID
      const mediaId = mediaIdOrModelType;

      const media = await this.prisma.media.findUnique({
        where: { id: mediaId },
      });

      if (!media) {
        throw new NotFoundException(`Media with ID ${mediaId} not found`);
      }

      // Check if it has PENDING status
      if (media.status === 'PENDING') {
        await this.prisma.media.update({
          where: { id: mediaId },
          data: {
            status: 'DONE',
          },
        });
      }
    } else if (
      typeof mediaIdOrModelType === 'string' &&
      modelId !== undefined
    ) {
      // Handle legacy model-based approach
      const modelType = mediaIdOrModelType;

      // Find all media for this model that has PENDING status
      const mediaWithFlag = await this.prisma.media.findMany({
        where: {
          model_type: modelType,
          model_id: modelId,
          status: 'PENDING',
        },
      });

      // Update each media item to DONE status
      for (const media of mediaWithFlag) {
        await this.prisma.media.update({
          where: { id: media.id },
          data: {
            status: 'DONE',
          },
        });
      }
    }
  }

  /**
   * Validate model type
   */
  private validateModelType(modelType: string): boolean {
    return SUPPORTED_MODEL_TYPES.includes(modelType as SupportedModelType);
  }

  /**
   * Validate collection name
   */
  private validateCollectionName(collectionName: string): boolean {
    return SUPPORTED_COLLECTION_NAMES.includes(
      collectionName as SupportedCollectionName,
    );
  }

  /**
   * Validate conversion type
   */
  private validateConversion(conversion: string): boolean {
    return SUPPORTED_CONVERSIONS.includes(conversion as SupportedConversion);
  }

  /**
   * Get optimized settings based on model type and collection
   */
  private getOptimizedSettings(modelType: string, collectionName: string) {
    const settings = {
      maxFileSize: this.maxFileSize,
      allowedMimeTypes: this.allowedMimeTypes,
      generateConversions: false,
      priority: 'normal' as 'high' | 'normal' | 'low',
    };

    // Model-specific optimizations
    switch (modelType) {
      case 'listings':
        settings.priority = 'high'; // Listings images are critical
        if (collectionName === 'images') {
          settings.generateConversions = true; // Generate responsive images for listing photos
        }
        break;

      case 'companies':
        if (collectionName === 'logos') {
          settings.maxFileSize = 2 * 1024 * 1024; // 2MB limit for logos
          settings.allowedMimeTypes = [
            'image/png',
            'image/jpeg',
            'image/svg+xml',
          ];
        }
        break;

      case 'floor_plans':
        if (collectionName === 'schematics') {
          settings.maxFileSize = 10 * 1024 * 1024; // 10MB for detailed floor plans
          settings.allowedMimeTypes = [
            'image/jpeg',
            'image/png',
            'application/pdf',
          ];
          settings.priority = 'high';
        }
        break;

      case 'posts':
        if (collectionName === 'featured_image') {
          settings.generateConversions = true;
          settings.priority = 'high';
        }
        break;
    }

    return settings;
  }

  /**
   * Generate unique filename
   */
  private generateUniqueFilename(originalName: string): string {
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    const extension = path.extname(originalName);
    const basename = path.basename(originalName, extension);

    // Use timestamp-random-basename.extension format
    return `${timestamp}-${random}-${basename}${extension}`;
  }

  /**
   * Generate model-specific filename based on model type and ID
   */
  private generateModelSpecificFilename(
    originalName: string,
    modelType: string,
    modelId?: string,
    modelSlug?: string,
  ): string {
    const extension = path.extname(originalName);

    // Validate model type before processing
    if (!this.validateModelType(modelType)) {
      throw new BadRequestException(`Unsupported model type: ${modelType}`);
    }

    if (modelType === 'listings' && modelId && modelSlug) {
      // For listings: {listing-slug}-{listing-id}.{extension}
      return `${modelSlug}-${modelId}${extension}`;
    }

    // For other models, use a generic approach
    if (modelId) {
      const basename = path.basename(originalName, extension);
      return `${modelType}-${modelId}-${basename}${extension}`;
    }

    // Fallback to unique filename if no model info
    return this.generateUniqueFilename(originalName);
  }

  /**
   * Generate S3 key structure for temporary upload (before media record exists)
   */
  private generateTempS3Key(
    fileName: string,
    _collectionName?: string,
  ): string {
    // Use a temp structure during upload, will be reorganized in completeUpload
    const tempPath = _collectionName ? `${_collectionName}/temp` : 'temp';
    return `${tempPath}/${fileName}`;
  }

  /**
   * Generate final S3 key structure after media record is created
   */
  private generateFinalS3Key(mediaId: number, fileName: string): string {
    // Structure: {mediaId}/{fileName} - consistent with URL generation
    return `${mediaId}/${fileName}`;
  }

  /**
   * Delete file from S3
   */
  private async deleteFileFromS3(
    filename: string,
    disk?: string,
  ): Promise<void> {
    const key = disk ? `${disk}/${filename}` : filename;

    try {
      await this.s3
        .deleteObject({
          Bucket: this.defaultDisk.bucket,
          Key: key,
        })
        .promise();
    } catch {}
  }

  /**
   * Generate presigned URL for S3 upload
   */
  async generatePresignedUrl(
    fileName: string,
    mimeType: string,
    fileSize: number,
    options: {
      model_type?: string;
      model_id?: string;
      model_slug?: string;
      collection_name?: string;
      custom_properties?: string;
    } = {},
  ): Promise<{
    presignedUrl: string;
    key: string;
    fileName: string;
    uploadId: string;
  }> {
    // Validate model type and collection name if provided
    if (options.model_type && !this.validateModelType(options.model_type)) {
      throw new BadRequestException(
        `Invalid model type: ${options.model_type}. Supported types: ${SUPPORTED_MODEL_TYPES.join(', ')}`,
      );
    }

    if (
      options.collection_name &&
      !this.validateCollectionName(options.collection_name)
    ) {
      throw new BadRequestException(
        `Invalid collection name: ${options.collection_name}. Supported collections: ${SUPPORTED_COLLECTION_NAMES.join(', ')}`,
      );
    }

    // Get optimized settings based on model type and collection
    const optimizedSettings = this.getOptimizedSettings(
      options.model_type || 'generic',
      options.collection_name || 'default',
    );

    // Validate file size with optimized limits
    if (fileSize > optimizedSettings.maxFileSize) {
      throw new BadRequestException(
        `File size ${fileSize} bytes exceeds maximum allowed size of ${optimizedSettings.maxFileSize} bytes for ${
          options.model_type || 'generic'
        }/${options.collection_name || 'default'}`,
      );
    }

    // Validate MIME type with optimized allowed types
    if (!optimizedSettings.allowedMimeTypes.includes(mimeType)) {
      throw new BadRequestException(
        `File type ${mimeType} is not allowed for ${
          options.model_type || 'generic'
        }/${options.collection_name || 'default'}. Allowed types: ${optimizedSettings.allowedMimeTypes.join(
          ', ',
        )}`,
      );
    }

    // Generate model-specific filename or fallback to unique filename
    const finalFileName =
      options.model_type && options.model_id
        ? this.generateModelSpecificFilename(
            fileName,
            options.model_type,
            options.model_id,
            options.model_slug,
          )
        : this.generateUniqueFilename(fileName);

    const uploadId = `upload-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;

    // Create temporary S3 key for upload (will be reorganized after media record creation)
    const key = this.generateTempS3Key(finalFileName, options.collection_name);

    // Generate presigned URL
    const presignedUrl = await this.s3.getSignedUrlPromise('putObject', {
      Bucket: this.defaultDisk.bucket,
      Key: key,
      Expires: 3600, // 1 hour
      ContentType: mimeType,
      ACL: this.defaultDisk.visibility === 'public' ? 'public-read' : 'private',
      Metadata: {
        originalName: fileName,
        finalFileName,
        uploadId,
        uploadedAt: new Date().toISOString(),
        ...(options.model_type && { modelType: options.model_type }),
        ...(options.model_id && { modelId: options.model_id }),
        ...(options.model_slug && { modelSlug: options.model_slug }),
        ...(options.collection_name && {
          collectionName: options.collection_name,
        }),
      },
    });

    return {
      presignedUrl,
      key,
      fileName: finalFileName,
      uploadId,
    };
  }

  /**
   * Complete upload after file has been uploaded to S3
   */
  async completeUpload(
    uploadId: string,
    tempKey: string,
    originalName: string,
    fileSize: number,
    mimeType: string,
    options: {
      model_type?: string;
      model_id?: string;
      model_slug?: string;
      collection_name?: string;
      custom_properties?: any;
      name?: string;
      status?: 'PENDING' | 'DONE' | 'WAITING_OPTIMIZATION';
    } = {},
  ): Promise<any> {
    // Validate model type and collection name if provided
    if (options.model_type && !this.validateModelType(options.model_type)) {
      throw new BadRequestException(
        `Invalid model type: ${options.model_type}. Supported types: ${SUPPORTED_MODEL_TYPES.join(', ')}`,
      );
    }

    if (
      options.collection_name &&
      !this.validateCollectionName(options.collection_name)
    ) {
      throw new BadRequestException(
        `Invalid collection name: ${options.collection_name}. Supported collections: ${SUPPORTED_COLLECTION_NAMES.join(', ')}`,
      );
    }

    // Get optimized settings for potential future use
    // const optimizedSettings = this.getOptimizedSettings(
    //   options.model_type || 'generic',
    //   options.collection_name || 'default',
    // );

    // Verify the file exists in S3 at the temporary location
    try {
      const headObjectParams = {
        Bucket: this.defaultDisk.bucket!,
        Key: tempKey,
      };

      const headObject = await this.s3.headObject(headObjectParams).promise();

      // Ensure the file size matches what was reported
      if (headObject.ContentLength !== fileSize) {
        throw new BadRequestException('File size mismatch');
      }

      // Ensure the content type matches
      if (headObject.ContentType !== mimeType) {
        throw new BadRequestException('Content type mismatch');
      }
    } catch (error) {
      throw new BadRequestException('Failed to verify uploaded file in S3');
    }

    // Extract filename from temp key
    const tempFileName = tempKey.split('/').pop() || tempKey;

    // Generate the proper filename using model-specific format
    const properFileName =
      options.model_type && options.model_id
        ? this.generateModelSpecificFilename(
            tempFileName,
            options.model_type,
            options.model_id,
            options.model_slug,
          )
        : this.generateUniqueFilename(tempFileName);

    // Determine initial status based on file type and model association
    let initialStatus: 'PENDING' | 'WAITING_OPTIMIZATION' | 'DONE' = 'DONE';

    // If an explicit status was provided in options, respect it
    if (options.status) {
      const s = options.status as 'PENDING' | 'WAITING_OPTIMIZATION' | 'DONE';
      initialStatus = s;
    } else if (!options.model_id || options.model_id === '0') {
      // If no model is provided (or model is 0), mark as PENDING
      initialStatus = 'PENDING';
    } else if (
      mimeType.startsWith('image/') &&
      this.isImageTypeThatNeedsOptimization(mimeType)
    ) {
      // For image files, default to WAITING_OPTIMIZATION (regardless of model association)
      initialStatus = 'WAITING_OPTIMIZATION';
    } else {
      // Other files are ready to use
      initialStatus = 'DONE';
    }

    // Create media record first to get the media ID
    const mediaData = await this.prisma.media.create({
      data: {
        model_type: options.model_type || 'generic',
        model_id: options.model_id ? BigInt(options.model_id) : BigInt(0),
        collection_name: options.collection_name || 'default',
        name: options.name || originalName,
        file_name: properFileName,
        mime_type: mimeType,
        disk: 's3',
        size: fileSize,
        manipulations: [],
        custom_properties: options.custom_properties || {},
        responsive_images: [],
        status: initialStatus,
        order_column: await this.getNextOrderColumn(
          options.model_type || 'generic',
          options.model_id ? BigInt(options.model_id) : BigInt(0),
          options.collection_name,
        ),
      },
    });

    // Generate final key using media ID and proper filename with consistent structure
    const finalKey = this.generateFinalS3Key(mediaData.id, properFileName);

    // Move file from temporary location to final location
    try {
      await this.s3
        .copyObject({
          Bucket: this.defaultDisk.bucket!,
          CopySource: `${this.defaultDisk.bucket}/${tempKey}`,
          Key: finalKey,
          ACL:
            this.defaultDisk.visibility === 'public'
              ? 'public-read'
              : 'private',
        })
        .promise();

      // Delete the temporary file
      await this.s3
        .deleteObject({
          Bucket: this.defaultDisk.bucket!,
          Key: tempKey,
        })
        .promise();
    } catch (error) {
      // Log error (could be replaced with proper logging)
      // If move fails, delete the media record and throw error
      await this.prisma.media.delete({
        where: { id: mediaData.id },
      });
      throw new BadRequestException('Failed to organize uploaded file');
    }

    // Media record already has the correct filename, no update needed

    // Generate image conversions if this is an image and conversions are enabled
    // if (
    //   mimeType.startsWith('image/') &&
    //   optimizedSettings.generateConversions
    // ) {
    //   await this.generateImageConversions(mediaData.id, finalKey, mimeType);
    // }

    // Add URL to the completed upload media record
    const url =
      this.defaultDisk.visibility === 'private'
        ? this.getBestAvailableSignedUrl(mediaData)
        : this.getBestAvailableUrl(mediaData);

    return {
      ...mediaData,
      url,
      custom_properties: (mediaData.custom_properties as object) || {},
    };
  }

  /**
   * Generate image conversions (placeholder for future implementation)
   * This would typically create resized versions of images
   */
  public async generateImageConversions(
    _mediaId: number,
    _originalKey: string,
    _mimeType: string,
  ): Promise<void> {
    // Download original from S3, generate conversions and upload to S3
    const mediaId = _mediaId;
    const originalKey = _originalKey; // expected format: "{mediaId}/{fileName}"

    // Get media record to access file_name and custom properties
    const media = await this.prisma.media.findUnique({
      where: { id: mediaId },
    });
    if (!media) return;

    const fileName = media.file_name;
    const extension = path.extname(fileName) || '.jpg';
    const originalTempPath = path.join(
      os.tmpdir(),
      `media-${mediaId}-${Date.now()}${extension}`,
    );

    try {
      this.logger.log(`Checking S3 object exists: ${originalKey}`);
      try {
        await this.s3
          .headObject({ Bucket: this.defaultDisk.bucket!, Key: originalKey })
          .promise();
      } catch (headErr) {
        this.logger.error(
          `S3 object not found for media ${mediaId} at key ${originalKey}: ${headErr?.message || headErr}`,
        );

        // Update DB to reflect no conversions yet (all false) but keep status WAITING_OPTIMIZATION
        const customProps = (media.custom_properties as any) || {};
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

      this.logger.log(`Downloading original object from S3: ${originalKey}`);
      // Download original file to temp
      const getObject = await this.s3
        .getObject({ Bucket: this.defaultDisk.bucket!, Key: originalKey })
        .promise();

      if (!getObject.Body) {
        this.logger.error(
          `Empty S3 object Body for media ${mediaId} at ${originalKey}`,
        );

        const customProps = (media.custom_properties as any) || {};
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

      // Body can be Buffer or stream.Readable; support both
      if (
        Buffer.isBuffer(getObject.Body) ||
        typeof getObject.Body === 'string'
      ) {
        await fs.promises.writeFile(originalTempPath, getObject.Body as Buffer);
      } else if ((getObject.Body as any).pipe) {
        // It's a stream
        await new Promise((resolve, reject) => {
          const writeStream = fs.createWriteStream(originalTempPath);
          (getObject.Body as any)
            .pipe(writeStream)
            .on('error', reject)
            .on('close', resolve);
        });
      } else {
        // Fallback: attempt to write as buffer
        await fs.promises.writeFile(
          originalTempPath,
          Buffer.from(String(getObject.Body)),
        );
      }

      this.logger.log(`Downloaded original to temp path: ${originalTempPath}`);

      // Define target conversions and sizes (widths)
      const conversions: { [key: string]: number } = {
        hero: 1200,
        thumb: 300,
        default: 800,
        hero_mobile: 600,
      };

      const generated: Record<string, boolean> = {};
      let anySucceeded = false;

      // Process conversions sequentially to avoid high memory spikes
      for (const [conversion, width] of Object.entries(conversions)) {
        try {
          this.logger.log(
            `Generating conversion '${conversion}' for media ${mediaId}`,
          );
          const convertedTempPath = path.join(
            os.tmpdir(),
            `media-${mediaId}-${conversion}-${Date.now()}${extension}`,
          );

          // Resize and re-encode using sharp
          await sharp(originalTempPath)
            .resize({ width: width })
            .toFile(convertedTempPath);

          // Upload to S3 under {mediaId}/conversions/{originalNameWithoutExt}-{conversion}{ext}
          const originalNameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
          const conversionFileName = `${originalNameWithoutExt}-${conversion}${extension}`;
          const key = `${mediaId}/conversions/${conversionFileName}`;

          const fileBuffer = await fs.promises.readFile(convertedTempPath);

          await this.s3
            .putObject({
              Bucket: this.defaultDisk.bucket!,
              Key: key,
              Body: fileBuffer,
              ContentType: _mimeType,
              ACL:
                this.defaultDisk.visibility === 'public'
                  ? 'public-read'
                  : 'private',
            })
            .promise();

          generated[conversion] = true;
          anySucceeded = true;

          this.logger.log(
            `Uploaded conversion '${conversion}' for media ${mediaId} to S3 key ${key}`,
          );

          // Remove temp converted file
          await fs.promises.unlink(convertedTempPath).catch(() => {});
        } catch (err) {
          // Continue with other conversions even if one fails
          generated[conversion] = false;
          this.logger.error(
            `Failed conversion '${conversion}' for media ${mediaId}: ${err?.message || err}`,
          );
        }
      }

      // Update media custom_properties.generated_conversions
      const customProps = (media.custom_properties as any) || {};
      customProps.generated_conversions = {
        hero: !!generated['hero'],
        thumb: !!generated['thumb'],
        default: !!generated['default'],
        hero_mobile: !!generated['hero_mobile'],
      };

      const updateData: any = { custom_properties: customProps };

      // Only mark DONE if at least one conversion succeeded
      if (anySucceeded) {
        updateData.status = 'DONE';
      }

      await this.prisma.media.update({
        where: { id: mediaId },
        data: updateData,
      });
    } catch (error) {
      // Log and rethrow or leave as WAITING_OPTIMIZATION to try later
      this.logger.error(
        `Error during generateImageConversions for media ${mediaId}: ${error?.message || error}`,
      );
      // For now, rethrow so caller can decide; ensure temp cleanup
      try {
        await fs.promises.unlink(originalTempPath).catch(() => {});
      } catch {}
      throw error;
    } finally {
      // Clean up original temp file
      await fs.promises.unlink(originalTempPath).catch(() => {});
    }
  }

  /**
   * Find media records with WAITING_OPTIMIZATION status
   */
  async findWaitingOptimizationMedia(limit = 50) {
    return this.prisma.media.findMany({
      where: {
        status: 'WAITING_OPTIMIZATION',
      },
      take: limit,
      orderBy: { created_at: 'asc' },
      select: {
        id: true,
        file_name: true,
        disk: true,
        mime_type: true,
      },
    });
  }

  /**
   * Reorder media files within a collection
   */
  async reorderMedia(
    model_type: string,
    model_id: bigint,
    collection_name: string,
    mediaIds: number[],
  ): Promise<void> {
    // Update order_column for each media file
    const updatePromises = mediaIds.map((mediaId, index) =>
      this.prisma.media.update({
        where: { id: mediaId },
        data: { order_column: index + 1 },
      }),
    );

    await Promise.all(updatePromises);
  }

  /**
   * Move media file to different collection
   */
  async moveToCollection(mediaId: number, newCollection: string): Promise<any> {
    const media = await this.prisma.media.findUnique({
      where: { id: mediaId },
    });

    if (!media) {
      throw new NotFoundException(`Media with ID ${mediaId} not found`);
    }

    // Get next order column for the new collection
    const nextOrder = await this.getNextOrderColumn(
      media.model_type,
      media.model_id,
      newCollection,
    );

    return this.prisma.media.update({
      where: { id: mediaId },
      data: {
        collection_name: newCollection,
        order_column: nextOrder,
      },
    });
  }

  /**
   * Get collections for a model
   */
  async getCollectionsForModel(
    model_type: string,
    model_id: bigint,
  ): Promise<string[]> {
    const collections = await this.prisma.media.findMany({
      where: {
        model_type,
        model_id,
      },
      select: {
        collection_name: true,
      },
      distinct: ['collection_name'],
    });

    return collections.map((c) => c.collection_name);
  }

  /**
   * Update media metadata
   */
  async updateMediaMetadata(
    mediaId: number,
    metadata: {
      name?: string;
      custom_properties?: any;
      order_column?: number;
    },
  ): Promise<any> {
    const media = await this.prisma.media.findUnique({
      where: { id: mediaId },
    });

    if (!media) {
      throw new NotFoundException(`Media with ID ${mediaId} not found`);
    }

    const updateData: any = {};

    if (metadata.name !== undefined) {
      updateData.name = metadata.name;
    }

    if (metadata.custom_properties !== undefined) {
      updateData.custom_properties = {
        ...((media.custom_properties as object) || {}),
        ...metadata.custom_properties,
      };
    }

    if (metadata.order_column !== undefined) {
      updateData.order_column = metadata.order_column;
    }

    return this.prisma.media.update({
      where: { id: mediaId },
      data: updateData,
    });
  }

  /**
   * Reassign pending media from one model_id to another and mark as DONE
   */
  async reassignPendingMedia(
    modelType: string,
    fromModelId: number,
    toModelId: number,
    collectionName?: string,
  ): Promise<void> {
    const where: any = {
      model_type: modelType,
      model_id: BigInt(fromModelId),
      status: 'PENDING',
    };

    if (collectionName) where.collection_name = collectionName;

    const mediaItems = await this.prisma.media.findMany({ where });

    for (const media of mediaItems) {
      await this.prisma.media.update({
        where: { id: media.id },
        data: {
          model_id: BigInt(toModelId),
          status: 'DONE',
        },
      });
    }
  }

  /**
   * Generic method to enrich media objects with URLs
   * Can be used by any service that needs to add URLs to media objects
   */
  enrichMediaWithUrls(mediaObjects: any[], conversion?: string): any[] {
    if (!mediaObjects || mediaObjects.length === 0) return mediaObjects;

    return mediaObjects.map((media) =>
      this.enrichSingleMediaWithUrl(media, conversion),
    );
  }

  /**
   * Enrich a single media object with URL
   */
  enrichSingleMediaWithUrl(media: any, conversion?: string): any {
    if (!media) return media;

    // Validate conversion type if provided
    if (conversion && !this.validateConversion(conversion)) {
      throw new BadRequestException(
        `Invalid conversion type: ${conversion}. Supported conversions: ${SUPPORTED_CONVERSIONS.join(', ')}`,
      );
    }

    // Add URL to the media object using existing logic
    const url =
      this.defaultDisk.visibility === 'private'
        ? this.getBestAvailableSignedUrl(media, conversion)
        : this.getBestAvailableUrl(media, conversion);

    return {
      ...media,
      url,
      custom_properties: (media.custom_properties as object) || {},
    };
  }

  /**
   * Check if image type needs optimization
   */
  private isImageTypeThatNeedsOptimization(mimeType: string): boolean {
    // Images that typically need optimization (can be resized, compressed, etc.)
    const optimizationNeededTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/bmp',
      'image/tiff',
    ];

    const lowerMimeType = mimeType.toLowerCase();
    return optimizationNeededTypes.includes(lowerMimeType);
  }
}
