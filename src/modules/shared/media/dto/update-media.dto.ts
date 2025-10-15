import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min } from 'class-validator';

export class UpdateMediaDto {
  @ApiPropertyOptional({
    description: 'Collection name for grouping files',
    example: 'avatars',
  })
  @IsOptional()
  @IsString()
  collection_name?: string;

  @ApiPropertyOptional({
    description: 'Human readable name for the file',
    example: 'updated-profile-picture.jpg',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Custom properties as JSON string',
    example: '{"alt": "Updated user avatar", "caption": "New profile picture"}',
  })
  @IsOptional()
  @IsString()
  custom_properties?: string;

  @ApiPropertyOptional({
    description: 'Order column for sorting',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  order_column?: number;
}
