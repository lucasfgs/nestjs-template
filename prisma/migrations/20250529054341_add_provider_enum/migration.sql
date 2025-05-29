/*
  Warnings:

  - You are about to alter the column `provider` on the `users` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(0))`.

*/
-- AlterTable
ALTER TABLE `users` MODIFY `provider` ENUM('LOCAL', 'GOOGLE') NULL DEFAULT 'LOCAL';
