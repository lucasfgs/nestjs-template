import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { FileUploadCronService } from '../media-cron.service';
import { FileUploadService } from '../media.service';

describe('FileUploadCronService', () => {
  let service: FileUploadCronService;
  let mockFileUploadService: jest.Mocked<Partial<FileUploadService>>;
  let loggerSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(async () => {
    // Clear all mocks
    jest.clearAllMocks();

    mockFileUploadService = {
      findPendingValidationMedia: jest.fn(),
      getMediaById: jest.fn(),
      deleteMedia: jest.fn(),
      // methods used by processWaitingOptimizationMedia
      findWaitingOptimizationMedia: jest.fn(),
      generateImageConversions: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileUploadCronService,
        {
          provide: FileUploadService,
          useValue: mockFileUploadService,
        },
      ],
    }).compile();

    service = module.get<FileUploadCronService>(FileUploadCronService);

    // Spy on logger methods
    loggerSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('cleanupPendingValidationMedia', () => {
    it('should cleanup pending validation media successfully', async () => {
      const mockPendingMedia = [
        { id: 1, model_type: 'listings', collection_name: 'images' },
        { id: 2, model_type: 'companies', collection_name: 'logos' },
      ];

      const mockMediaWithFlag = {
        id: 1,
        status: 'PENDING' as any,
        custom_properties: { pending_validation: true },
      };

      mockFileUploadService.findPendingValidationMedia.mockResolvedValue(
        mockPendingMedia as any,
      );
      mockFileUploadService.getMediaById.mockResolvedValue(
        mockMediaWithFlag as any,
      );
      mockFileUploadService.deleteMedia.mockResolvedValue();

      await service.cleanupPendingValidationMedia();

      expect(
        mockFileUploadService.findPendingValidationMedia,
      ).toHaveBeenCalledWith(48);
      expect(mockFileUploadService.getMediaById).toHaveBeenCalledTimes(2);
      expect(mockFileUploadService.deleteMedia).toHaveBeenCalledTimes(2);
      expect(loggerSpy).toHaveBeenCalledWith(
        'Starting daily cleanup of pending validation media...',
      );
      expect(loggerSpy).toHaveBeenCalledWith(
        'Successfully cleaned up 2 pending validation media files',
      );
    });

    it('should skip media without pending validation flag', async () => {
      const mockPendingMedia = [
        { id: 1, model_type: 'listings', collection_name: 'images' },
      ];

      const mockMediaWithoutFlag = {
        id: 1,
        custom_properties: { alt: 'some alt text' }, // No pending_validation flag
      };

      mockFileUploadService.findPendingValidationMedia.mockResolvedValue(
        mockPendingMedia as any,
      );
      mockFileUploadService.getMediaById.mockResolvedValue(
        mockMediaWithoutFlag as any,
      );

      await service.cleanupPendingValidationMedia();

      expect(mockFileUploadService.deleteMedia).not.toHaveBeenCalled();
      expect(loggerSpy).toHaveBeenCalledWith(
        'No pending validation media found to clean up',
      );
    });

    it('should handle errors gracefully', async () => {
      mockFileUploadService.findPendingValidationMedia.mockRejectedValue(
        new Error('Database connection failed'),
      );

      await service.cleanupPendingValidationMedia();

      expect(loggerSpy).toHaveBeenCalledWith(
        'RootTestModule dependencies initialized',
      );
      expect(loggerSpy).toHaveBeenCalledWith(
        'Starting daily cleanup of pending validation media...',
      );
      // Error is logged with logger.error(), not logger.log()
      expect(errorSpy).toHaveBeenCalledWith(
        'Failed to cleanup pending validation media: Database connection failed',
        expect.any(String),
      );
    });

    it('should handle individual media deletion errors', async () => {
      const mockPendingMedia = [
        { id: 1, model_type: 'listings', collection_name: 'images' },
        { id: 2, model_type: 'companies', collection_name: 'logos' },
      ];

      const mockMediaWithFlag = {
        id: 1,
        status: 'PENDING' as any,
        custom_properties: { pending_validation: true },
      };

      mockFileUploadService.findPendingValidationMedia.mockResolvedValue(
        mockPendingMedia as any,
      );
      mockFileUploadService.getMediaById.mockResolvedValue(
        mockMediaWithFlag as any,
      );
      mockFileUploadService.deleteMedia
        .mockResolvedValueOnce() // First call succeeds
        .mockRejectedValueOnce(new Error('S3 deletion failed')); // Second call fails

      await service.cleanupPendingValidationMedia();

      expect(mockFileUploadService.deleteMedia).toHaveBeenCalledTimes(2);
      expect(loggerSpy).toHaveBeenCalledWith(
        'Successfully cleaned up 1 pending validation media files',
      );
    });

    it('should handle media not found during double-check', async () => {
      const mockPendingMedia = [
        { id: 1, model_type: 'listings', collection_name: 'images' },
      ];

      mockFileUploadService.findPendingValidationMedia.mockResolvedValue(
        mockPendingMedia as any,
      );
      mockFileUploadService.getMediaById.mockResolvedValue(null); // Media not found

      await service.cleanupPendingValidationMedia();

      expect(mockFileUploadService.deleteMedia).not.toHaveBeenCalled();
      expect(loggerSpy).toHaveBeenCalledWith(
        'No pending validation media found to clean up',
      );
    });
  });

  // weekly cleanup tests removed — weekly task deprecated in favor of S3-triggered flows

  describe('processWaitingOptimizationMedia', () => {
    it('should process waiting optimization media and call generateImageConversions', async () => {
      const mockWaiting = [
        { id: 1, file_name: 'photo.jpg', mime_type: 'image/png' },
      ];

      mockFileUploadService.findWaitingOptimizationMedia.mockResolvedValue(
        mockWaiting as any,
      );
      mockFileUploadService.generateImageConversions.mockResolvedValue(
        undefined as any,
      );

      await service.processWaitingOptimizationMedia();

      expect(
        mockFileUploadService.findWaitingOptimizationMedia,
      ).toHaveBeenCalledWith(50);
      expect(
        mockFileUploadService.generateImageConversions,
      ).toHaveBeenCalledWith(1, '1/photo.jpg', 'image/png');
      expect(loggerSpy).toHaveBeenCalledWith(
        'Starting hourly processing of WAITING_OPTIMIZATION media...',
      );
    });

    it('should do nothing when no waiting media', async () => {
      mockFileUploadService.findWaitingOptimizationMedia.mockResolvedValue(
        [] as any,
      );

      await service.processWaitingOptimizationMedia();

      expect(
        mockFileUploadService.generateImageConversions,
      ).not.toHaveBeenCalled();
      expect(loggerSpy).toHaveBeenCalledWith(
        'No media waiting for optimization',
      );
    });

    it('should handle errors gracefully', async () => {
      mockFileUploadService.findWaitingOptimizationMedia.mockRejectedValue(
        new Error('DB error'),
      );

      await service.processWaitingOptimizationMedia();

      expect(errorSpy).toHaveBeenCalledWith(
        'Failed to process waiting optimization media: DB error',
        expect.any(String),
      );
    });
  });
});
