/*
  Warnings:

  - You are about to drop the `permission_role` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `permission_role` DROP FOREIGN KEY `Permission_Role_permissionId_fkey`;

-- DropForeignKey
ALTER TABLE `permission_role` DROP FOREIGN KEY `Permission_Role_roleId_fkey`;

-- DropTable
DROP TABLE `permission_role`;

-- CreateTable
CREATE TABLE `PermissionRole` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `create` BOOLEAN NOT NULL DEFAULT false,
    `read` BOOLEAN NOT NULL DEFAULT false,
    `update` BOOLEAN NOT NULL DEFAULT false,
    `delete` BOOLEAN NOT NULL DEFAULT false,
    `roleId` INTEGER NOT NULL,
    `permissionId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `PermissionRole` ADD CONSTRAINT `PermissionRole_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `Roles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PermissionRole` ADD CONSTRAINT `PermissionRole_permissionId_fkey` FOREIGN KEY (`permissionId`) REFERENCES `Permissions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
