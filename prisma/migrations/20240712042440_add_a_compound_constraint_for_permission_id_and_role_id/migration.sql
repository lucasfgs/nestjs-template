/*
  Warnings:

  - A unique constraint covering the columns `[roleId,permissionId]` on the table `PermissionRole` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `PermissionRole_roleId_permissionId_key` ON `PermissionRole`(`roleId`, `permissionId`);
