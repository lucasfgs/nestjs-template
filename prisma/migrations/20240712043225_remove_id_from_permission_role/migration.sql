/*
  Warnings:

  - The primary key for the `permissionrole` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `permissionrole` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `permissionrole` DROP PRIMARY KEY,
    DROP COLUMN `id`;
