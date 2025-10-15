import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';

import { IMedia } from '../interfaces/media.interface';

export class MediaResponseDto implements IMedia {
  @ApiProperty({
    description: 'Unique identifier for the media file',
    example: 1,
  })
  @Expose()
  id: number;

  @ApiProperty({
    description: 'Model type for polymorphic relationship',
    example: 'User',
  })
  @Expose()
  model_type: string;

  @ApiProperty({
    description: 'Model ID for polymorphic relationship',
    example: '123',
  })
  @Expose()
  @Transform(({ value }) => Number(value), { toClassOnly: true })
  model_id: bigint;

  @ApiProperty({
    description: 'Collection name for grouping files',
    example: 'avatars',
  })
  @Expose()
  collection_name: string;

  @ApiProperty({
    description: 'Human readable name for the file',
    example: 'profile-picture.jpg',
  })
  @Expose()
  name: string;

  @ApiProperty({
    description: 'Actual filename on disk',
    example: 'abc123-profile-picture.jpg',
  })
  @Expose()
  file_name: string;

  @ApiPropertyOptional({
    description: 'MIME type of the file',
    example: 'image/jpeg',
  })
  @Expose()
  mime_type: string | null;

  @ApiProperty({
    description: 'Storage disk where file is stored',
    example: 'public',
  })
  @Expose()
  disk: string;

  @ApiProperty({
    description: 'File size in bytes',
    example: 1024000,
  })
  @Expose()
  size: number;

  @ApiProperty({
    description: 'File manipulations data (JSON)',
    example: '{"resize": {"width": 300, "height": 300}}',
  })
  @Expose()
  manipulations: any;

  @ApiProperty({
    description: 'Custom properties (JSON)',
    example: '{"alt": "User avatar", "caption": "Profile picture"}',
  })
  @Expose()
  custom_properties: any;

  @ApiProperty({
    description: 'Responsive images data (JSON)',
    example: '{"thumb": "thumb-abc123.jpg", "medium": "medium-abc123.jpg"}',
  })
  @Expose()
  responsive_images: any;

  @ApiPropertyOptional({
    description: 'Order column for sorting',
    example: 1,
  })
  @Expose()
  order_column: number | null;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  @Expose()
  created_at: Date | null;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  @Expose()
  updated_at: Date | null;

  // Dynamic properties (added by service)
  @ApiPropertyOptional({
    description: 'Full URL to access the file (dynamically generated)',
    example:
      'https://d1234567890.cloudfront.net/12345/luxury-apartments-1031.jpg',
  })
  @Expose()
  url?: string;

  @ApiProperty({
    description: 'File extension',
    example: 'jpg',
  })
  @Expose()
  get extension(): string {
    return this.file_name.split('.').pop() || '';
  }

  @ApiProperty({
    description: 'Human readable file size',
    example: '1.0 MB',
  })
  @Expose()
  get human_readable_size(): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = this.size;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }
}

export class MediaListResponseDto {
  @ApiProperty({
    type: [MediaResponseDto],
    description: 'List of media files',
  })
  @Expose()
  data: MediaResponseDto[];

  @ApiProperty({
    description: 'Total number of media files',
    example: 25,
  })
  @Expose()
  total: number;
}
