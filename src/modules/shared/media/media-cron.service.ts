import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { FileUploadService } from './media.service';

@Injectable()
export class FileUploadCronService {
  private readonly logger = new Logger(FileUploadCronService.name);

  constructor(private readonly fileUploadService: FileUploadService) {}

  /**
   * Clean up media files that have pending_validation flag for too long
   * This runs daily at 3 AM to remove unvalidated media files
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanupPendingValidationMedia() {
    try {
      this.logger.log('Starting daily cleanup of pending validation media...');

      const cutoffDate = new Date();
      cutoffDate.setHours(cutoffDate.getHours() - 48); // 48 hours old

      // Find media with pending_validation flag older than cutoff
      const pendingMedia =
        await this.fileUploadService.findPendingValidationMedia(48);

      let deletedCount = 0;

      // Process media deletions in parallel for better performance
      const deletePromises = pendingMedia.map(async (media) => {
        try {
          // Double-check that this media still has the pending flag
          // (in case it was updated between our query and now)
          const currentMedia = await this.fileUploadService.getMediaById(
            media.id,
          );

          if (currentMedia && currentMedia.status === 'PENDING') {
            // Use the FileUploadService to delete both S3 file and database record
            await this.fileUploadService.deleteMedia(media.id);

            this.logger.log(
              `Deleted pending validation media: ${media.id} (${media.model_type}/${media.collection_name})`,
            );

            return true; // Successfully deleted
          }
          return false; // No deletion needed
        } catch (error) {
          this.logger.error(`Failed to cleanup media ${media.id}:`, error);
          return false; // Failed to delete
        }
      });

      // Wait for all deletion operations to complete
      const deleteResults = await Promise.all(deletePromises);

      // Count successful deletions
      deletedCount = deleteResults.filter((result) => result === true).length;

      if (deletedCount > 0) {
        this.logger.log(
          `Successfully cleaned up ${deletedCount} pending validation media files`,
        );
      } else {
        this.logger.log('No pending validation media found to clean up');
      }
    } catch (error) {
      this.logger.error(
        `Failed to cleanup pending validation media: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Process media items waiting for optimization.
   * This used to run hourly as a Cron job; removed the decorator so it won't
   * run on the EB instance. It can be invoked manually or from a Lambda.
   */
  async processWaitingOptimizationMedia() {
    try {
      this.logger.log(
        'Starting hourly processing of WAITING_OPTIMIZATION media...',
      );

      // Fetch a batch to avoid processing too many at once
      const waiting =
        await this.fileUploadService.findWaitingOptimizationMedia(50);

      if (!waiting || waiting.length === 0) {
        this.logger.log('No media waiting for optimization');
        return;
      }

      for (const media of waiting) {
        try {
          this.logger.log(`Optimizing media ${media.id} (${media.file_name})`);

          // Build the key used for final storage
          const key = `${media.id}/${media.file_name}`;

          const mimeType = (media as any).mime_type || 'image/jpeg';

          await this.fileUploadService.generateImageConversions(
            media.id,
            key,
            mimeType,
          );

          this.logger.log(`Optimized media ${media.id}`);
        } catch (err) {
          this.logger.error(
            `Failed optimizing media ${media.id}: ${err.message || err}`,
          );
          // leave it for next run
        }
      }
    } catch (error) {
      this.logger.error(
        `Failed to process waiting optimization media: ${error.message}`,
        error.stack,
      );
    }
  }
}
