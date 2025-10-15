const { Logger } = require('./logger');

/**
 * File upload cron service for background tasks
 */
class MediaCronService {
  constructor(mediaService) {
    this.mediaService = mediaService;
    this.logger = new Logger('MediaCronService');
  }

  /**
   * Clean up media files that have pending_validation flag for too long
   * This runs daily at 3 AM to remove unvalidated media files
   */
  async cleanupPendingValidationMedia() {
    try {
      this.logger.log('Starting daily cleanup of pending validation media...');

      // Find media with pending_validation flag older than 48 hours
      const pendingMedia =
        await this.mediaService.findPendingValidationMedia(48);

      let deletedCount = 0;

      // Process media deletions in parallel for better performance
      const deletePromises = pendingMedia.map(async (media) => {
        try {
          // Double-check that this media still has the pending flag
          // (in case it was updated between our query and now)
          const currentMedia = await this.mediaService.getMediaById(media.id);

          if (currentMedia && currentMedia.status === 'PENDING') {
            // Use the mediaService to delete both S3 file and database record
            await this.mediaService.deleteMedia(media.id);

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

      return { deletedCount, totalProcessed: pendingMedia.length };
    } catch (error) {
      this.logger.error(
        `Failed to cleanup pending validation media: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}

module.exports = { MediaCronService };
