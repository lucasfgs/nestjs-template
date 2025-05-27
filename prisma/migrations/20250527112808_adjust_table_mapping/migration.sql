/*
  Warnings:

  - You are about to drop the `permissionrole` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `refreshtokens` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `permissionrole` DROP FOREIGN KEY `PermissionRole_permissionId_fkey`;

-- DropForeignKey
ALTER TABLE `permissionrole` DROP FOREIGN KEY `PermissionRole_roleId_fkey`;

-- DropForeignKey
ALTER TABLE `refreshtokens` DROP FOREIGN KEY `RefreshTokens_userId_fkey`;

-- DropForeignKey
ALTER TABLE `subscriptions` DROP FOREIGN KEY `Subscriptions_userId_fkey`;

-- DropForeignKey
ALTER TABLE `users` DROP FOREIGN KEY `Users_roleId_fkey`;

-- DropTable
DROP TABLE `permissionrole`;

-- DropTable
DROP TABLE `refreshtokens`;

-- CreateTable
CREATE TABLE `permission_role` (
    `create` BOOLEAN NOT NULL DEFAULT false,
    `read` BOOLEAN NOT NULL DEFAULT false,
    `update` BOOLEAN NOT NULL DEFAULT false,
    `delete` BOOLEAN NOT NULL DEFAULT false,
    `roleId` INTEGER NOT NULL,
    `permissionId` INTEGER NOT NULL,

    UNIQUE INDEX `permission_role_roleId_permissionId_key`(`roleId`, `permissionId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `refresh_tokens` (
    `id` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL,

    UNIQUE INDEX `refresh_tokens_token_key`(`token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `roles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `permission_role` ADD CONSTRAINT `permission_role_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `roles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `permission_role` ADD CONSTRAINT `permission_role_permissionId_fkey` FOREIGN KEY (`permissionId`) REFERENCES `permissions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `refresh_tokens` ADD CONSTRAINT `refresh_tokens_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `roles` RENAME INDEX `Roles_name_key` TO `roles_name_key`;
