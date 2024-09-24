/*
  Warnings:

  - You are about to drop the column `customerId` on the `subscription` table. All the data in the column will be lost.
  - You are about to drop the column `priceId` on the `subscription` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `subscription` DROP COLUMN `customerId`,
    DROP COLUMN `priceId`;
