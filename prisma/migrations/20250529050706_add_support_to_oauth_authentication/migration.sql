/*
  Warnings:

  - A unique constraint covering the columns `[providerId]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `users` ADD COLUMN `provider` VARCHAR(191) NULL DEFAULT 'local',
    ADD COLUMN `providerId` VARCHAR(191) NULL,
    MODIFY `password` VARCHAR(100) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `users_providerId_key` ON `users`(`providerId`);
