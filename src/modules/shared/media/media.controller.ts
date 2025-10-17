import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Param,
  Query,
  Body,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

import { Serialize } from '@common/interceptors/serialize.interceptor';

import {
  MediaResponseDto,
  MediaListResponseDto,
} from './dto/media-response.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import {
  PresignedUrlRequestDto,
  PresignedUrlResponseDto,
  CompleteUploadRequestDto,
} from './dto/upload-file.dto';
import { FileUploadService } from './media.service';
import {
  SUPPORTED_MODEL_TYPES,
  SUPPORTED_COLLECTION_NAMES,
  SUPPORTED_CONVERSIONS,
} from './media.service';

@ApiTags('File Upload')
@Controller('files')
export class FileUploadController {
  constructor(private readonly fileUploadService: FileUploadService) {}

  @Get('model/:model_type/:model_id')
  @ApiOperation({ summary: 'Get media files for a specific model' })
  @ApiParam({
    name: 'model_type',
    description: 'Type of the model',
    enum: [...SUPPORTED_MODEL_TYPES],
    example: 'listings',
  })
  @ApiParam({
    name: 'model_id',
    description: 'ID of the model',
    example: '123',
  })
  @ApiQuery({
    name: 'collection_name',
    required: false,
    description: 'Filter by collection name',
    enum: [...SUPPORTED_COLLECTION_NAMES],
    example: 'images',
  })
  @ApiQuery({
    name: 'conversion',
    required: false,
    description: 'Specific conversion to return',
    enum: [...SUPPORTED_CONVERSIONS],
    example: 'thumb',
  })
  @ApiResponse({
    status: 200,
    description: 'Media files retrieved successfully',
    type: MediaListResponseDto,
  })
  @Serialize(MediaResponseDto)
  async getMediaForModel(
    @Param('model_type') model_type: string,
    @Param('model_id', ParseIntPipe) model_id: number,
    @Query('collection_name') collection_name?: string,
    @Query('conversion') conversion?: string,
  ) {
    const media = await this.fileUploadService.getMediaForModel(
      model_type,
      BigInt(model_id),
      collection_name,
      conversion,
    );

    return {
      data: media,
      total: media.length,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get media file by ID' })
  @ApiParam({
    name: 'id',
    description: 'Media file ID',
    example: 1,
  })
  @ApiQuery({
    name: 'conversion',
    required: false,
    description: 'Specific conversion to return',
    enum: [...SUPPORTED_CONVERSIONS],
    example: 'thumb',
  })
  @ApiResponse({
    status: 200,
    description: 'Media file retrieved successfully',
    type: MediaResponseDto,
  })
  @Serialize(MediaResponseDto)
  async getMediaById(
    @Param('id', ParseIntPipe) id: number,
    @Query('conversion') conversion?: string,
  ) {
    return this.fileUploadService.getMediaById(id, conversion);
  }

  @Get(':id/conversion/:conversion')
  @ApiOperation({ summary: 'Get URL for a specific media conversion' })
  @ApiParam({
    name: 'id',
    description: 'Media file ID',
    example: 1,
  })
  @ApiParam({
    name: 'conversion',
    description: 'Conversion name',
    enum: [...SUPPORTED_CONVERSIONS],
    example: 'thumb',
  })
  @ApiResponse({
    status: 200,
    description: 'Conversion URL retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          example:
            'https://d1234567890.cloudfront.net/12345/conversions/luxury-apartments-1031-thumb.png',
        },
      },
    },
  })
  async getConversionUrl(
    @Param('id', ParseIntPipe) id: number,
    @Param('conversion') conversion: string,
  ) {
    const url = await this.fileUploadService.getConversionUrl(id, conversion);
    return { url };
  }

  @Get(':id/conversions')
  @ApiOperation({ summary: 'Get all available conversions for a media item' })
  @ApiParam({
    name: 'id',
    description: 'Media file ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Available conversions retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        original: {
          type: 'string',
          example:
            'https://d1234567890.cloudfront.net/12345/luxury-apartments-1031.png',
        },
        thumb: {
          type: 'string',
          example:
            'https://d1234567890.cloudfront.net/12345/conversions/luxury-apartments-1031-thumb.png',
        },
        hero: {
          type: 'string',
          example:
            'https://d1234567890.cloudfront.net/12345/conversions/luxury-apartments-1031-hero.png',
        },
        default: {
          type: 'string',
          example:
            'https://d1234567890.cloudfront.net/12345/conversions/luxury-apartments-1031-default.png',
        },
      },
    },
  })
  async getAvailableConversions(@Param('id', ParseIntPipe) id: number) {
    return this.fileUploadService.getAvailableConversions(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update media file information' })
  @ApiParam({
    name: 'id',
    description: 'Media file ID',
    example: 1,
  })
  @ApiBody({
    description: 'Media update data',
    type: UpdateMediaDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Media file updated successfully',
    type: MediaResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  @Serialize(MediaResponseDto)
  async updateMedia(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateData: UpdateMediaDto,
  ) {
    return this.fileUploadService.updateMedia(id, updateData);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete media file' })
  @ApiParam({
    name: 'id',
    description: 'Media file ID',
    example: 1,
  })
  @ApiResponse({
    status: 204,
    description: 'Media file deleted successfully',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMedia(@Param('id', ParseIntPipe) id: number) {
    await this.fileUploadService.deleteMedia(id);
  }

  @Post('presigned-url')
  @ApiOperation({ summary: 'Generate presigned URL for S3 upload' })
  @ApiBody({
    description: 'Presigned URL request data',
    type: PresignedUrlRequestDto,
  })
  @ApiResponse({
    status: 201,
    description: 'Presigned URL generated successfully',
    type: PresignedUrlResponseDto,
  })
  @Serialize(PresignedUrlResponseDto)
  async generatePresignedUrl(@Body() presignedUrlData: PresignedUrlRequestDto) {
    const result = await this.fileUploadService.generatePresignedUrl(
      presignedUrlData.fileName,
      presignedUrlData.mimeType,
      presignedUrlData.fileSize,
      {
        model_type: presignedUrlData.model_type,
        model_id: presignedUrlData.model_id,
        collection_name: presignedUrlData.collection_name,
        custom_properties: presignedUrlData.custom_properties,
      },
    );

    return {
      presignedUrl: result.presignedUrl,
      key: result.key,
      fileName: result.fileName,
      uploadId: result.uploadId,
    };
  }

  @Post('validate')
  @ApiOperation({ summary: 'Validate uploaded media (mark PENDING => DONE)' })
  @ApiBody({
    description:
      'Either a single mediaId or model_type+model_id to validate pending media',
    schema: {
      oneOf: [
        { type: 'object', properties: { mediaId: { type: 'number' } } },
        {
          type: 'object',
          properties: {
            model_type: { type: 'string' },
            model_id: { type: 'number' },
          },
        },
      ],
    },
  })
  @HttpCode(HttpStatus.OK)
  async validateMedia(@Body() body: any) {
    if (body.mediaId) {
      await this.fileUploadService.removePendingValidationFlag(body.mediaId);
      return { message: 'Media validated' };
    }

    if (body.model_type && body.model_id !== undefined) {
      await this.fileUploadService.removePendingValidationFlag(
        body.model_type,
        body.model_id,
      );
      return { message: 'Model media validated' };
    }

    return { message: 'No action taken' };
  }

  @Post('reassign')
  @ApiOperation({
    summary: 'Reassign pending media from one model ID to another',
  })
  @ApiBody({
    description:
      'Provide model_type, from_model_id, to_model_id, optional collection_name',
    schema: {
      type: 'object',
      properties: {
        model_type: { type: 'string' },
        from_model_id: { type: 'number' },
        to_model_id: { type: 'number' },
        collection_name: { type: 'string' },
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  async reassignPending(@Body() body: any) {
    const { model_type, from_model_id, to_model_id, collection_name } = body;
    if (
      !model_type ||
      from_model_id === undefined ||
      to_model_id === undefined
    ) {
      return { message: 'Missing parameters' };
    }

    await this.fileUploadService.reassignPendingMedia(
      model_type,
      Number(from_model_id),
      Number(to_model_id),
      collection_name,
    );

    return { message: 'Reassigned pending media' };
  }

  @Post('complete-upload')
  @ApiOperation({
    summary: 'Complete upload after file has been uploaded to S3',
  })
  @ApiBody({
    description: 'Complete upload request data',
    type: CompleteUploadRequestDto,
  })
  @ApiResponse({
    status: 201,
    description: 'Upload completed successfully',
    type: MediaResponseDto,
  })
  @HttpCode(HttpStatus.CREATED)
  @Serialize(MediaResponseDto)
  async completeUpload(@Body() completeUploadData: CompleteUploadRequestDto) {
    const result = await this.fileUploadService.completeUpload(
      completeUploadData.uploadId,
      completeUploadData.key,
      completeUploadData.originalName,
      completeUploadData.fileSize,
      completeUploadData.mimeType,
      {
        model_type: completeUploadData.model_type || 'listings',
        model_id: completeUploadData.model_id || undefined,
        model_slug: completeUploadData.model_slug || undefined,
        collection_name: completeUploadData.collection_name || 'images',
        custom_properties: completeUploadData.custom_properties
          ? JSON.parse(completeUploadData.custom_properties)
          : {},
        name: completeUploadData.name || undefined,
      },
    );

    return result;
  }

  @Post('reorder/:model_type/:model_id/:collection_name')
  @ApiOperation({
    summary: 'Reorder media files within a collection',
  })
  @ApiParam({
    name: 'model_type',
    description: 'Type of the model',
    enum: [...SUPPORTED_MODEL_TYPES],
    example: 'listings',
  })
  @ApiParam({
    name: 'model_id',
    description: 'ID of the model',
    example: '1025',
  })
  @ApiParam({
    name: 'collection_name',
    description: 'Collection name',
    enum: [...SUPPORTED_COLLECTION_NAMES],
    example: 'images',
  })
  @ApiBody({
    description: 'Reorder request data',
    schema: {
      type: 'object',
      properties: {
        mediaIds: {
          type: 'array',
          items: { type: 'number' },
          example: [1, 2, 3, 4],
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Media files reordered successfully',
  })
  @HttpCode(HttpStatus.OK)
  async reorderMedia(
    @Param('model_type') model_type: string,
    @Param('model_id') model_id: string,
    @Param('collection_name') collection_name: string,
    @Body() reorderData: { mediaIds: number[] },
  ) {
    await this.fileUploadService.reorderMedia(
      model_type,
      BigInt(model_id),
      collection_name,
      reorderData.mediaIds,
    );

    return { message: 'Media files reordered successfully' };
  }

  @Put(':id/move-collection')
  @ApiOperation({
    summary: 'Move media file to different collection',
  })
  @ApiParam({
    name: 'id',
    description: 'Media file ID',
    example: 1,
  })
  @ApiBody({
    description: 'Move collection request data',
    schema: {
      type: 'object',
      properties: {
        collection_name: {
          type: 'string',
          enum: [...SUPPORTED_COLLECTION_NAMES],
          example: 'images',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Media file moved successfully',
    type: MediaResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  @Serialize(MediaResponseDto)
  async moveToCollection(
    @Param('id', ParseIntPipe) id: number,
    @Body() moveData: { collection_name: string },
  ) {
    return this.fileUploadService.moveToCollection(
      id,
      moveData.collection_name,
    );
  }

  @Get('collections/:model_type/:model_id')
  @ApiOperation({
    summary: 'Get collections for a model',
  })
  @ApiParam({
    name: 'model_type',
    description: 'Type of the model',
    enum: [...SUPPORTED_MODEL_TYPES],
    example: 'listings',
  })
  @ApiParam({
    name: 'model_id',
    description: 'ID of the model',
    example: '1025',
  })
  @ApiResponse({
    status: 200,
    description: 'Collections retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        collections: {
          type: 'array',
          items: { type: 'string' },
          example: ['images', 'documents', 'gallery'],
        },
      },
    },
  })
  async getCollectionsForModel(
    @Param('model_type') model_type: string,
    @Param('model_id', ParseIntPipe) model_id: number,
  ) {
    const collections = await this.fileUploadService.getCollectionsForModel(
      model_type,
      BigInt(model_id),
    );

    return { collections };
  }

  @Put(':id/metadata')
  @ApiOperation({
    summary: 'Update media file metadata',
  })
  @ApiParam({
    name: 'id',
    description: 'Media file ID',
    example: 1,
  })
  @ApiBody({
    description: 'Metadata update data',
    schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          example: 'Updated image name',
        },
        custom_properties: {
          type: 'object',
          example: { alt: 'New alt text', caption: 'New caption' },
        },
        order_column: {
          type: 'number',
          example: 5,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Media metadata updated successfully',
    type: MediaResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  @Serialize(MediaResponseDto)
  async updateMediaMetadata(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    metadata: {
      name?: string;
      custom_properties?: any;
      order_column?: number;
    },
  ) {
    return this.fileUploadService.updateMediaMetadata(id, metadata);
  }
}
