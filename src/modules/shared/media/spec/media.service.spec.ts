import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as AWS from 'aws-sdk';

import { PrismaService } from '@modules/shared/prisma/prisma.service';

import { FileUploadService } from '../media.service';

// Mock AWS S3
jest.mock('aws-sdk', () => ({
  S3: jest.fn().mockImplementation(() => ({
    getSignedUrlPromise: jest.fn(),
    putObject: jest.fn().mockReturnValue({
      promise: jest.fn(),
    }),
    copyObject: jest.fn().mockReturnValue({
      promise: jest.fn(),
    }),
    deleteObject: jest.fn().mockReturnValue({
      promise: jest.fn(),
    }),
    headObject: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({
        ContentLength: 1024,
        ContentType: 'image/jpeg',
      }),
    }),
  })),
}));

// Mock environment variables
process.env.AWS_S3_BUCKET = 'test-bucket';
process.env.AWS_REGION = 'us-east-1';
process.env.AWS_ACCESS_KEY_ID = 'test-access-key';
process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key';
process.env.AWS_CLOUDFRONT_MEDIA_URL = 'https://cdn.example.com';
process.env.MAX_FILE_SIZE = '10485760';
process.env.ALLOWED_MIME_TYPES = 'image/jpeg,image/png,application/pdf';

describe('FileUploadService', () => {
  let service: FileUploadService;
  let mockPrismaService: any;
  let mockS3: jest.Mocked<AWS.S3>;

  beforeEach(async () => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create simple mock functions
    mockPrismaService = {
      media: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        aggregate: jest.fn().mockReturnValue(
          Promise.resolve({
            _max: {
              order_column: 5,
            },
          }),
        ),
        count: jest.fn(),
      },
      $queryRaw: jest.fn(),
    };

    // Setup S3 mock
    mockS3 = new AWS.S3() as jest.Mocked<AWS.S3>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileUploadService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<FileUploadService>(FileUploadService);

    // Override the S3 instance with our mock
    (service as any).s3 = mockS3;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('constructor', () => {
    it('should initialize with environment variables', () => {
      expect((service as any).defaultDisk.bucket).toBe('test-bucket');
      expect((service as any).defaultDisk.region).toBe('us-east-1');
      expect((service as any).maxFileSize).toBe(10485760);
      expect((service as any).allowedMimeTypes).toContain('image/jpeg');
    });
  });

  describe('getMediaForModel', () => {
    it('should return media for a model', async () => {
      const mockMedia = [
        {
          id: 1,
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
        },
      ];

      mockPrismaService.media.findMany.mockReturnValue(
        Promise.resolve(mockMedia as any),
      );

      const result = await service.getMediaForModel('listings', 1n);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
      expect(result[0]).toHaveProperty('url');
      expect(mockPrismaService.media.findMany).toHaveBeenCalledWith({
        where: {
          model_type: 'listings',
          model_id: 1n,
        },
        orderBy: [
          { collection_name: 'asc' },
          { order_column: 'asc' },
          { created_at: 'asc' },
        ],
      });
    });

    it('should filter by collection name', async () => {
      const mockMedia = [
        {
          id: 1,
          name: 'test-image.jpg',
          collection_name: 'images',
          model_type: 'listings',
          model_id: 1n,
        },
      ];

      mockPrismaService.media.findMany.mockReturnValue(
        Promise.resolve(mockMedia as any),
      );

      await service.getMediaForModel('listings', 1n, 'images');

      expect(mockPrismaService.media.findMany).toHaveBeenCalledWith({
        where: {
          model_type: 'listings',
          model_id: 1n,
          collection_name: 'images',
        },
        orderBy: [
          { collection_name: 'asc' },
          { order_column: 'asc' },
          { created_at: 'asc' },
        ],
      });
    });

    it('should throw error for invalid conversion', async () => {
      await expect(
        service.getMediaForModel(
          'listings',
          1n,
          undefined,
          'invalid_conversion',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getMediaById', () => {
    it('should return media by id', async () => {
      const mockMedia = {
        id: 1,
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
      };

      mockPrismaService.media.findUnique.mockReturnValue(
        Promise.resolve(mockMedia as any),
      );

      const result = await service.getMediaById(1);

      expect(result.id).toBe(1);
      expect(result).toHaveProperty('url');
      expect(mockPrismaService.media.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should throw NotFoundException when media not found', async () => {
      mockPrismaService.media.findUnique.mockReturnValue(
        Promise.resolve(null as any),
      );

      await expect(service.getMediaById(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateMedia', () => {
    it('should update media successfully', async () => {
      const existingMedia = {
        id: 1,
        name: 'old-name.jpg',
        file_name: 'old-name.jpg',
      };

      const updateData = {
        name: 'new-name.jpg',
      };

      const updatedMedia = {
        id: 1,
        name: 'new-name.jpg',
        file_name: 'old-name.jpg',
      };

      mockPrismaService.media.findUnique.mockReturnValue(
        Promise.resolve(existingMedia as any),
      );
      mockPrismaService.media.update.mockReturnValue(
        Promise.resolve(updatedMedia),
      );

      const result = await service.updateMedia(1, updateData);

      expect(result.name).toBe('new-name.jpg');
      expect(mockPrismaService.media.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updateData,
      });
    });

    it('should throw NotFoundException when media not found', async () => {
      mockPrismaService.media.findUnique.mockReturnValue(
        Promise.resolve(null as any),
      );

      await expect(service.updateMedia(999, { name: 'test' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteMedia', () => {
    it('should delete media successfully', async () => {
      const mockMedia = {
        id: 1,
        name: 'test-image.jpg',
        path: 'uploads/test-image.jpg',
        disk: 's3',
      };

      mockPrismaService.media.findUnique.mockReturnValue(
        Promise.resolve(mockMedia as any),
      );
      mockPrismaService.media.delete.mockReturnValue(
        Promise.resolve(mockMedia),
      );
      mockS3.deleteObject.mockReturnValue({
        promise: jest.fn().mockReturnValue(Promise.resolve({})),
      } as any);

      await service.deleteMedia(1);

      expect(mockPrismaService.media.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockS3.deleteObject).toHaveBeenCalled();
    });

    it('should throw NotFoundException when media not found', async () => {
      mockPrismaService.media.findUnique.mockReturnValue(
        Promise.resolve(null as any),
      );

      await expect(service.deleteMedia(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('generatePresignedUrl', () => {
    beforeEach(() => {
      mockS3.getSignedUrlPromise = jest
        .fn()
        .mockReturnValue(Promise.resolve('https://presigned-url.com'));
    });

    it('should generate presigned URL successfully', async () => {
      const result = await service.generatePresignedUrl(
        'test-image.jpg',
        'image/jpeg',
        1024,
        {
          model_type: 'listings',
          model_id: '1',
          collection_name: 'images',
        },
      );

      expect(result).toHaveProperty('presignedUrl');
      expect(result).toHaveProperty('key');
      expect(result).toHaveProperty('fileName');
      expect(result).toHaveProperty('uploadId');
    });

    it('should throw error for invalid model type', async () => {
      await expect(
        service.generatePresignedUrl('test.jpg', 'image/jpeg', 1024, {
          model_type: 'invalid_type',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error for invalid collection name', async () => {
      await expect(
        service.generatePresignedUrl('test.jpg', 'image/jpeg', 1024, {
          collection_name: 'invalid_collection',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error for file too large', async () => {
      await expect(
        service.generatePresignedUrl('test.jpg', 'image/jpeg', 20000000, {
          model_type: 'listings',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('completeUpload', () => {
    it('should complete upload successfully', async () => {
      const mockMedia = {
        id: 1,
        name: 'test-image.jpg',
        file_name: 'test-image.jpg',
      };

      mockPrismaService.media.create.mockReturnValue(
        Promise.resolve(mockMedia),
      );

      const result = await service.completeUpload(
        'upload-123',
        'uploads/test-image.jpg',
        'test-image.jpg',
        1024,
        'image/jpeg',
        {
          model_type: 'listings',
          model_id: '1',
          collection_name: 'images',
          custom_properties: {},
          name: 'Test Image',
        },
      );

      expect(result.id).toBe(1);
      expect(mockPrismaService.media.create).toHaveBeenCalled();
    });

    it('should use default values when not provided', async () => {
      const mockMedia = {
        id: 1,
        name: 'test-image.jpg',
        file_name: 'test-image.jpg',
      };

      mockPrismaService.media.create.mockReturnValue(
        Promise.resolve(mockMedia),
      );

      await service.completeUpload(
        'upload-123',
        'uploads/test-image.jpg',
        'test-image.jpg',
        1024,
        'image/jpeg',
        {},
      );

      expect(mockPrismaService.media.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          model_type: 'generic',
          collection_name: 'default',
        }),
      });
    });
  });

  describe('reorderMedia', () => {
    it('should reorder media successfully', async () => {
      const mediaIds = [3, 1, 2];
      const mockMedia = [
        { id: 3, order_column: 1 },
        { id: 1, order_column: 2 },
        { id: 2, order_column: 3 },
      ];

      mockPrismaService.media.findMany.mockReturnValue(
        Promise.resolve(mockMedia as any),
      );
      mockPrismaService.media.update.mockReturnValue(
        Promise.resolve({} as any),
      );

      await service.reorderMedia('listings', 1n, 'images', mediaIds);

      expect(mockPrismaService.media.update).toHaveBeenCalledTimes(3);
    });
  });

  describe('moveToCollection', () => {
    it('should move media to different collection', async () => {
      const mockMedia = {
        id: 1,
        name: 'test-image.jpg',
        collection_name: 'gallery',
      };

      mockPrismaService.media.findUnique.mockReturnValue(
        Promise.resolve({
          id: 1,
          collection_name: 'images',
        } as any),
      );
      mockPrismaService.media.update.mockReturnValue(
        Promise.resolve(mockMedia as any),
      );

      const result = await service.moveToCollection(1, 'gallery');

      expect(result.collection_name).toBe('gallery');
      expect(mockPrismaService.media.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { collection_name: 'gallery', order_column: 6 },
      });
    });
  });

  describe('getCollectionsForModel', () => {
    it('should return collections for model', async () => {
      mockPrismaService.media.findMany.mockReturnValue(
        Promise.resolve([
          { collection_name: 'images' },
          { collection_name: 'documents' },
        ] as any),
      );

      const result = await service.getCollectionsForModel('listings', 1n);

      expect(result).toEqual(['images', 'documents']);
    });
  });

  describe('updateMediaMetadata', () => {
    it('should update media metadata', async () => {
      const metadata = {
        name: 'Updated Name',
        custom_properties: { alt: 'Alt text' },
        order_column: 5,
      };

      const mockMedia = {
        id: 1,
        name: 'Updated Name',
        custom_properties: { alt: 'Alt text' },
        order_column: 5,
      };

      mockPrismaService.media.findUnique.mockReturnValue(
        Promise.resolve({
          id: 1,
          name: 'Original Name',
        } as any),
      );
      mockPrismaService.media.update.mockReturnValue(
        Promise.resolve(mockMedia as any),
      );

      const result = await service.updateMediaMetadata(1, metadata);

      expect(result.name).toBe('Updated Name');
      expect(mockPrismaService.media.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: metadata,
      });
    });
  });

  describe('findPendingValidationMedia', () => {
    it('should find media with pending validation', async () => {
      const mockMedia = [
        {
          id: 1,
          custom_properties: { pending_validation: true },
        },
      ];

      mockPrismaService.media.findMany.mockReturnValue(
        Promise.resolve(mockMedia as any),
      );

      const result = await service.findPendingValidationMedia(48);

      expect(result).toHaveLength(1);
      expect(mockPrismaService.media.findMany).toHaveBeenCalled();
    });
  });

  describe('getConversionUrl', () => {
    it('should return conversion URL', async () => {
      const mockMedia = {
        id: 1,
        path: 'uploads/test-image.jpg',
        file_name: 'test-image.jpg',
        custom_properties: {
          generated_conversions: {
            thumb: '/conversions/thumb/test-image.jpg',
          },
        },
      };

      mockPrismaService.media.findUnique.mockReturnValue(
        Promise.resolve(mockMedia as any),
      );

      const result = await service.getConversionUrl(1, 'thumb');

      expect(typeof result).toBe('string');
      expect(mockPrismaService.media.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });

  describe('getAvailableConversions', () => {
    it('should return available conversions', async () => {
      const mockMedia = {
        id: 1,
        path: 'uploads/test-image.jpg',
        custom_properties: {},
      };

      mockPrismaService.media.findUnique.mockReturnValue(
        Promise.resolve(mockMedia as any),
      );

      const result = await service.getAvailableConversions(1);

      expect(result).toHaveProperty('original');
      expect(mockPrismaService.media.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });

  describe('generateModelSpecificFilename', () => {
    it('should generate filename for listings with slug and id', () => {
      const result = (service as any).generateModelSpecificFilename(
        'test-image.jpg',
        'listings',
        '123',
        'beautiful-apartment',
      );

      expect(result).toBe('beautiful-apartment-123.jpg');
    });

    it('should generate filename for other models with id', () => {
      const result = (service as any).generateModelSpecificFilename(
        'logo.png',
        'companies',
        '456',
      );

      expect(result).toBe('companies-456-logo.png');
    });

    it('should fallback to unique filename when no model info provided', () => {
      const mockUniqueFilename = 'unique-filename.jpg';
      jest
        .spyOn(service as any, 'generateUniqueFilename')
        .mockReturnValue(mockUniqueFilename);

      const result = (service as any).generateModelSpecificFilename(
        'test.jpg',
        'listings',
      );

      expect(result).toBe(mockUniqueFilename);
      expect((service as any).generateUniqueFilename).toHaveBeenCalledWith(
        'test.jpg',
      );
    });

    it('should throw error for invalid model type', () => {
      expect(() => {
        (service as any).generateModelSpecificFilename(
          'test.jpg',
          'invalid_model',
          '123',
        );
      }).toThrow(BadRequestException);
    });
  });

  describe('completeUpload - additional edge cases', () => {
    it('should throw error for invalid model type in completeUpload', async () => {
      const mockMedia = {
        id: 1,
        name: 'test-image.jpg',
      };

      mockPrismaService.media.create.mockReturnValue(
        Promise.resolve(mockMedia),
      );

      await expect(
        service.completeUpload(
          'upload-123',
          'uploads/test-image.jpg',
          'test-image.jpg',
          1024,
          'image/jpeg',
          {
            model_type: 'invalid_model',
            model_id: '1',
            collection_name: 'images',
          },
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error for invalid collection name in completeUpload', async () => {
      const mockMedia = {
        id: 1,
        name: 'test-image.jpg',
      };

      mockPrismaService.media.create.mockReturnValue(
        Promise.resolve(mockMedia),
      );

      await expect(
        service.completeUpload(
          'upload-123',
          'uploads/test-image.jpg',
          'test-image.jpg',
          1024,
          'image/jpeg',
          {
            model_type: 'listings',
            model_id: '1',
            collection_name: 'invalid_collection',
          },
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error for unsupported MIME type', async () => {
      const mockMedia = {
        id: 1,
        name: 'test-image.jpg',
      };

      mockPrismaService.media.create.mockReturnValue(
        Promise.resolve(mockMedia),
      );

      await expect(
        service.completeUpload(
          'upload-123',
          'uploads/test-image.jpg',
          'test-image.jpg',
          1024,
          'application/exe', // Unsupported MIME type
          {
            model_type: 'listings',
            model_id: '1',
            collection_name: 'images',
          },
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle file size mismatch error', async () => {
      const mockMedia = {
        id: 1,
        name: 'test-image.jpg',
      };

      // Mock headObject to return different size
      const headObjectMock = jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          ContentLength: 2048, // Different from reported size of 1024
          ContentType: 'image/jpeg',
        }),
      });

      mockPrismaService.media.create.mockReturnValue(
        Promise.resolve(mockMedia),
      );
      (service as any).s3.headObject = headObjectMock;

      await expect(
        service.completeUpload(
          'upload-123',
          'uploads/test-image.jpg',
          'test-image.jpg',
          1024,
          'image/jpeg',
          {
            model_type: 'listings',
            model_id: '1',
            collection_name: 'images',
          },
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle content type mismatch error', async () => {
      const mockMedia = {
        id: 1,
        name: 'test-image.jpg',
      };

      // Mock headObject to return different content type
      const headObjectMock = jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          ContentLength: 1024,
          ContentType: 'text/plain', // Different from reported type
        }),
      });

      mockPrismaService.media.create.mockReturnValue(
        Promise.resolve(mockMedia),
      );
      (service as any).s3.headObject = headObjectMock;

      await expect(
        service.completeUpload(
          'upload-123',
          'uploads/test-image.jpg',
          'test-image.jpg',
          1024,
          'image/jpeg',
          {
            model_type: 'listings',
            model_id: '1',
            collection_name: 'images',
          },
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle S3 errors gracefully', async () => {
      const mockMedia = {
        id: 1,
        name: 'test-image.jpg',
      };

      // Mock headObject to throw error
      const headObjectMock = jest.fn().mockReturnValue({
        promise: jest.fn().mockRejectedValue(new Error('S3 connection failed')),
      });

      mockPrismaService.media.create.mockReturnValue(
        Promise.resolve(mockMedia),
      );
      (service as any).s3.headObject = headObjectMock;

      await expect(
        service.completeUpload(
          'upload-123',
          'uploads/test-image.jpg',
          'test-image.jpg',
          1024,
          'image/jpeg',
          {
            model_type: 'listings',
            model_id: '1',
            collection_name: 'images',
          },
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
