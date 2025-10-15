import { Test, TestingModule } from '@nestjs/testing';

import { FileUploadController } from '../media.controller';
import { FileUploadService } from '../media.service';

describe('FileUploadController', () => {
  let controller: FileUploadController;
  let mockFileUploadService: jest.Mocked<Partial<FileUploadService>>;

  beforeEach(async () => {
    mockFileUploadService = {
      getMediaForModel: jest.fn(),
      getMediaById: jest.fn(),
      getConversionUrl: jest.fn(),
      getAvailableConversions: jest.fn(),
      updateMedia: jest.fn(),
      deleteMedia: jest.fn(),
      generatePresignedUrl: jest.fn(),
      completeUpload: jest.fn(),
      reorderMedia: jest.fn(),
      moveToCollection: jest.fn(),
      getCollectionsForModel: jest.fn(),
      updateMediaMetadata: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FileUploadController],
      providers: [
        {
          provide: FileUploadService,
          useValue: mockFileUploadService,
        },
      ],
    }).compile();

    controller = module.get<FileUploadController>(FileUploadController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getMediaForModel', () => {
    it('should return media for a model', async () => {
      const mockMedia = [
        {
          id: 1,
          status: 'DONE' as any,
          name: 'test-image.jpg',
          file_name: 'test-image.jpg',
          mime_type: 'image/jpeg',
          path: 'uploads/test-image.jpg',
          disk: 's3',
          size: 1024,
          collection_name: 'images',
          model_type: 'listings',
          model_id: 1n,
          order_column: 1,
          custom_properties: {},
          created_at: new Date(),
          updated_at: new Date(),
          url: 'https://cdn.example.com/test-image.jpg',
          manipulations: {},
          responsive_images: {},
        },
      ];

      mockFileUploadService.getMediaForModel.mockResolvedValue(mockMedia);

      const result = await controller.getMediaForModel('listings', 1);

      expect(result).toEqual({
        data: mockMedia,
        total: mockMedia.length,
      });
      expect(mockFileUploadService.getMediaForModel).toHaveBeenCalledWith(
        'listings',
        BigInt(1),
        undefined,
        undefined,
      );
    });

    it('should filter by collection name', async () => {
      const mockMedia = [
        {
          id: 1,
          status: 'DONE' as any,
          name: 'test-image.jpg',
          collection_name: 'images',
          model_type: 'listings',
          model_id: 1n,
          file_name: 'test-image.jpg',
          mime_type: 'image/jpeg',
          path: 'uploads/test-image.jpg',
          disk: 's3',
          size: 1024,
          order_column: 1,
          custom_properties: {},
          created_at: new Date(),
          updated_at: new Date(),
          url: 'https://cdn.example.com/test-image.jpg',
          manipulations: {},
          responsive_images: {},
        },
      ];

      mockFileUploadService.getMediaForModel.mockResolvedValue(mockMedia);

      await controller.getMediaForModel('listings', 1, 'images');

      expect(mockFileUploadService.getMediaForModel).toHaveBeenCalledWith(
        'listings',
        BigInt(1),
        'images',
        undefined,
      );
    });
  });

  describe('getMediaById', () => {
    it('should return media by id', async () => {
      const mockMedia = {
        id: 1,
        status: 'DONE' as any,
        name: 'test-image.jpg',
        file_name: 'test-image.jpg',
        mime_type: 'image/jpeg',
        path: 'uploads/test-image.jpg',
        disk: 's3',
        size: 1024,
        collection_name: 'images',
        model_type: 'listings',
        model_id: 1n,
        order_column: 1,
        custom_properties: {},
        created_at: new Date(),
        updated_at: new Date(),
        url: 'https://cdn.example.com/test-image.jpg',
        manipulations: {},
        responsive_images: {},
      };

      mockFileUploadService.getMediaById.mockResolvedValue(mockMedia);

      const result = await controller.getMediaById(1);

      expect(result).toEqual(mockMedia);
      expect(mockFileUploadService.getMediaById).toHaveBeenCalledWith(
        1,
        undefined,
      );
    });

    it('should return media with conversion', async () => {
      const mockMedia = {
        id: 1,
        status: 'DONE' as any,
        name: 'test-image.jpg',
        file_name: 'test-image-thumb.jpg',
        mime_type: 'image/jpeg',
        path: 'uploads/conversions/test-image-thumb.jpg',
        disk: 's3',
        size: 1024,
        collection_name: 'images',
        model_type: 'listings',
        model_id: 1n,
        order_column: 1,
        custom_properties: {},
        created_at: new Date(),
        updated_at: new Date(),
        url: 'https://cdn.example.com/test-image-thumb.jpg',
        manipulations: {},
        responsive_images: {},
      };

      mockFileUploadService.getMediaById.mockResolvedValue(mockMedia);

      const result = await controller.getMediaById(1, 'thumb');

      expect(result).toEqual(mockMedia);
      expect(mockFileUploadService.getMediaById).toHaveBeenCalledWith(
        1,
        'thumb',
      );
    });
  });

  describe('getConversionUrl', () => {
    it('should return conversion URL', async () => {
      const mockUrl = 'https://cdn.example.com/test-image-thumb.jpg';

      mockFileUploadService.getConversionUrl.mockResolvedValue(mockUrl);

      const result = await controller.getConversionUrl(1, 'thumb');

      expect(result).toEqual({ url: mockUrl });
      expect(mockFileUploadService.getConversionUrl).toHaveBeenCalledWith(
        1,
        'thumb',
      );
    });
  });

  describe('getAvailableConversions', () => {
    it('should return available conversions', async () => {
      const mockConversions = {
        original: 'https://cdn.example.com/test-image.jpg',
        thumb: 'https://cdn.example.com/test-image-thumb.jpg',
        hero: 'https://cdn.example.com/test-image-hero.jpg',
      };

      mockFileUploadService.getAvailableConversions.mockResolvedValue(
        mockConversions,
      );

      const result = await controller.getAvailableConversions(1);

      expect(result).toEqual(mockConversions);
      expect(
        mockFileUploadService.getAvailableConversions,
      ).toHaveBeenCalledWith(1);
    });
  });

  describe('updateMedia', () => {
    it('should update media', async () => {
      const updateData = { name: 'Updated Name' };
      const mockUpdatedMedia = {
        id: 1,
        status: 'DONE' as any,
        name: 'Updated Name',
        file_name: 'test-image.jpg',
        mime_type: 'image/jpeg',
        path: 'uploads/test-image.jpg',
        disk: 's3',
        size: 1024,
        collection_name: 'images',
        model_type: 'listings',
        model_id: 1n,
        order_column: 1,
        custom_properties: {},
        created_at: new Date(),
        updated_at: new Date(),
        url: 'https://cdn.example.com/test-image.jpg',
        manipulations: {},
        responsive_images: {},
      };

      mockFileUploadService.updateMedia.mockResolvedValue(mockUpdatedMedia);

      const result = await controller.updateMedia(1, updateData);

      expect(result).toEqual(mockUpdatedMedia);
      expect(mockFileUploadService.updateMedia).toHaveBeenCalledWith(
        1,
        updateData,
      );
    });
  });

  describe('deleteMedia', () => {
    it('should delete media', async () => {
      mockFileUploadService.deleteMedia.mockResolvedValue(undefined);

      const result = await controller.deleteMedia(1);

      expect(result).toBeUndefined();
      expect(mockFileUploadService.deleteMedia).toHaveBeenCalledWith(1);
    });
  });

  describe('generatePresignedUrl', () => {
    it('should generate presigned URL', async () => {
      const presignedUrlData = {
        fileName: 'test-image.jpg',
        mimeType: 'image/jpeg',
        fileSize: 1024,
        model_type: 'listings',
        model_id: '1',
        collection_name: 'images',
        custom_properties: '{}',
      };

      const mockResult = {
        presignedUrl: 'https://s3.amazonaws.com/presigned-url',
        key: 'uploads/test-image.jpg',
        fileName: 'test-image.jpg',
        uploadId: 'upload-123',
      };

      mockFileUploadService.generatePresignedUrl.mockResolvedValue(mockResult);

      const result = await controller.generatePresignedUrl(presignedUrlData);

      expect(result).toEqual({
        presignedUrl: mockResult.presignedUrl,
        key: mockResult.key,
        fileName: mockResult.fileName,
        uploadId: mockResult.uploadId,
      });
      expect(mockFileUploadService.generatePresignedUrl).toHaveBeenCalledWith(
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
    });
  });

  describe('completeUpload', () => {
    it('should complete upload', async () => {
      const completeUploadData = {
        uploadId: 'upload-123',
        key: 'uploads/test-image.jpg',
        originalName: 'test-image.jpg',
        fileSize: 1024,
        mimeType: 'image/jpeg',
        model_type: 'listings',
        model_id: '1',
        collection_name: 'images',
        custom_properties: '{}',
        name: 'Test Image',
      };

      const mockResult = {
        id: 1,
        status: 'DONE' as any,
        name: 'Test Image',
        file_name: 'test-image.jpg',
        mime_type: 'image/jpeg',
        path: 'uploads/test-image.jpg',
        disk: 's3',
        size: 1024,
        collection_name: 'images',
        model_type: 'listings',
        model_id: 1n,
        order_column: 1,
        custom_properties: {},
        created_at: new Date(),
        updated_at: new Date(),
        url: 'https://cdn.example.com/test-image.jpg',
        manipulations: {},
        responsive_images: {},
      };

      mockFileUploadService.completeUpload.mockResolvedValue(mockResult);

      const result = await controller.completeUpload(completeUploadData);

      expect(result).toEqual(mockResult);
      expect(mockFileUploadService.completeUpload).toHaveBeenCalledWith(
        completeUploadData.uploadId,
        completeUploadData.key,
        completeUploadData.originalName,
        completeUploadData.fileSize,
        completeUploadData.mimeType,
        {
          model_type: completeUploadData.model_type,
          model_id: '1',
          model_slug: undefined,
          collection_name: completeUploadData.collection_name,
          custom_properties: {},
          name: completeUploadData.name,
        },
      );
    });
  });

  describe('reorderMedia', () => {
    it('should reorder media', async () => {
      const reorderData = { mediaIds: [3, 1, 2] };

      mockFileUploadService.reorderMedia.mockResolvedValue(undefined);

      const result = await controller.reorderMedia(
        'listings',
        '1',
        'images',
        reorderData,
      );

      expect(result).toEqual({ message: 'Media files reordered successfully' });
      expect(mockFileUploadService.reorderMedia).toHaveBeenCalledWith(
        'listings',
        BigInt(1),
        'images',
        reorderData.mediaIds,
      );
    });
  });

  describe('moveToCollection', () => {
    it('should move media to collection', async () => {
      const moveData = { collection_name: 'gallery' };
      const mockUpdatedMedia = {
        id: 1,
        status: 'DONE' as any,
        name: 'test-image.jpg',
        file_name: 'test-image.jpg',
        mime_type: 'image/jpeg',
        path: 'uploads/test-image.jpg',
        disk: 's3',
        size: 1024,
        collection_name: 'gallery',
        model_type: 'listings',
        model_id: 1n,
        order_column: 1,
        custom_properties: {},
        created_at: new Date(),
        updated_at: new Date(),
        url: 'https://cdn.example.com/test-image.jpg',
        manipulations: {},
        responsive_images: {},
      };

      mockFileUploadService.moveToCollection.mockResolvedValue(
        mockUpdatedMedia,
      );

      const result = await controller.moveToCollection(1, moveData);

      expect(result).toEqual(mockUpdatedMedia);
      expect(mockFileUploadService.moveToCollection).toHaveBeenCalledWith(
        1,
        moveData.collection_name,
      );
    });
  });

  describe('getCollectionsForModel', () => {
    it('should return collections for model', async () => {
      const mockCollections = ['images', 'documents', 'gallery'];

      mockFileUploadService.getCollectionsForModel.mockResolvedValue(
        mockCollections,
      );

      const result = await controller.getCollectionsForModel('listings', 1);

      expect(result).toEqual({ collections: mockCollections });
      expect(mockFileUploadService.getCollectionsForModel).toHaveBeenCalledWith(
        'listings',
        BigInt(1),
      );
    });
  });

  describe('updateMediaMetadata', () => {
    it('should update media metadata', async () => {
      const metadata = {
        name: 'Updated Name',
        custom_properties: { alt: 'Alt text' },
        order_column: 5,
      };
      const mockUpdatedMedia = {
        id: 1,
        status: 'DONE' as any,
        name: 'Updated Name',
        file_name: 'test-image.jpg',
        mime_type: 'image/jpeg',
        path: 'uploads/test-image.jpg',
        disk: 's3',
        size: 1024,
        collection_name: 'images',
        model_type: 'listings',
        model_id: 1n,
        order_column: 5,
        custom_properties: { alt: 'Alt text' },
        created_at: new Date(),
        updated_at: new Date(),
        url: 'https://cdn.example.com/test-image.jpg',
        manipulations: {},
        responsive_images: {},
      };

      mockFileUploadService.updateMediaMetadata.mockResolvedValue(
        mockUpdatedMedia,
      );

      const result = await controller.updateMediaMetadata(1, metadata);

      expect(result).toEqual(mockUpdatedMedia);
      expect(mockFileUploadService.updateMediaMetadata).toHaveBeenCalledWith(
        1,
        metadata,
      );
    });
  });
});
