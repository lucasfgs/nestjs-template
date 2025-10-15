import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, IsIn } from 'class-validator';

import {
  SUPPORTED_COLLECTION_NAMES,
  SUPPORTED_MODEL_TYPES,
} from '../media.service';

export class PresignedUrlRequestDto {
  @ApiProperty({
    description: 'File name',
    example: 'property-image-1.jpg',
  })
  @IsString()
  fileName: string;

  @ApiProperty({
    description: 'File MIME type',
    example: 'image/jpeg',
  })
  @IsString()
  mimeType: string;

  @ApiProperty({
    description: 'File size in bytes',
    example: 1024000,
  })
  @IsInt()
  fileSize: number;

  @ApiPropertyOptional({
    description: 'Model type for polymorphic relationship',
    example: 'listings',
    enum: SUPPORTED_MODEL_TYPES,
  })
  @IsOptional()
  @IsString()
  @IsIn(SUPPORTED_MODEL_TYPES)
  model_type?: string;

  @ApiPropertyOptional({
    description: 'Model ID for polymorphic relationship',
    example: '1025',
  })
  @IsOptional()
  @IsString()
  model_id?: string;

  @ApiPropertyOptional({
    description: 'Model slug for generating filenames',
    example: 'luxury-apartments',
  })
  @IsOptional()
  @IsString()
  model_slug?: string;

  @ApiPropertyOptional({
    description: 'Collection name for grouping files',
    example: 'images',
    enum: SUPPORTED_COLLECTION_NAMES,
  })
  @IsOptional()
  @IsString()
  @IsIn(SUPPORTED_COLLECTION_NAMES)
  collection_name?: string;

  @ApiPropertyOptional({
    description: 'Custom properties as JSON string',
    example: '{"alt": "Property image", "caption": "Living room"}',
  })
  @IsOptional()
  @IsString()
  custom_properties?: string;

  @ApiPropertyOptional({
    description: "Force initial media status (e.g. 'PENDING','DONE')",
    example: 'PENDING',
  })
  @IsOptional()
  @IsString()
  @IsIn(['PENDING', 'DONE', 'WAITING_OPTIMIZATION'])
  status?: string;
}

export class PresignedUrlResponseDto {
  @ApiProperty({
    description: 'Presigned URL for file upload',
    example:
      'https://my-bucket.s3.amazonaws.com/uploads/property-image-1.jpg?X-Amz-Algorithm=...',
  })
  presignedUrl: string;

  @ApiProperty({
    description: 'Unique key for the file in S3',
    example: 'uploads/property-image-1.jpg',
  })
  key: string;

  @ApiProperty({
    description: 'File name',
    example: 'property-image-1.jpg',
  })
  fileName: string;

  @ApiProperty({
    description: 'Upload ID for tracking the upload',
    example: 'upload-123456789',
  })
  uploadId: string;
}

export class CompleteUploadRequestDto {
  @ApiProperty({
    description: 'Upload ID from presigned URL generation',
    example: 'upload-123456789',
  })
  @IsString()
  uploadId: string;

  @ApiProperty({
    description: 'S3 key of the uploaded file',
    example: 'uploads/property-image-1.jpg',
  })
  @IsString()
  key: string;

  @ApiProperty({
    description: 'Original file name',
    example: 'property-image-1.jpg',
  })
  @IsString()
  originalName: string;

  @ApiPropertyOptional({
    description: 'Display name for the media file',
    example: 'Property Main Image',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'File size in bytes',
    example: 1024000,
  })
  @IsInt()
  fileSize: number;

  @ApiProperty({
    description: 'File MIME type',
    example: 'image/jpeg',
  })
  @IsString()
  mimeType: string;

  @ApiPropertyOptional({
    description: 'Model type for polymorphic relationship',
    example: 'listings',
    enum: ['listings', 'companies', 'floor_plans', 'posts', 'categories'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['listings', 'companies', 'floor_plans', 'posts', 'categories'])
  model_type?: string;

  @ApiPropertyOptional({
    description: 'Model ID for polymorphic relationship',
    example: '1025',
  })
  @IsOptional()
  @IsString()
  model_id?: string;

  @ApiPropertyOptional({
    description: 'Model slug for generating filenames',
    example: 'luxury-apartments',
  })
  @IsOptional()
  @IsString()
  model_slug?: string;

  @ApiPropertyOptional({
    description: 'Collection name for grouping files',
    example: 'images',
    enum: [
      'logos',
      'headers',
      'images',
      'tile_logo',
      'schematics',
      '3d-tour-thumbs',
      'featured_image',
    ],
  })
  @IsOptional()
  @IsString()
  @IsIn([
    'logos',
    'headers',
    'images',
    'tile_logo',
    'schematics',
    '3d-tour-thumbs',
    'featured_image',
  ])
  collection_name?: string;

  @ApiPropertyOptional({
    description: 'Custom properties as JSON string',
    example: '{"alt": "Property image", "caption": "Living room"}',
  })
  @IsOptional()
  @IsString()
  custom_properties?: string;
}
