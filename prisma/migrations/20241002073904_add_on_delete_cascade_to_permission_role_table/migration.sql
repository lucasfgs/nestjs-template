-- DropForeignKey
ALTER TABLE `permissionrole` DROP FOREIGN KEY `PermissionRole_roleId_fkey`;

-- AddForeignKey
ALTER TABLE `PermissionRole` ADD CONSTRAINT `PermissionRole_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `Roles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
