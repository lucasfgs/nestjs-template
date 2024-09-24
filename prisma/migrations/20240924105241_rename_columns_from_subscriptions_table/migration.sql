/*
  Warnings:

  - You are about to drop the column `stripeId` on the `subscription` table. All the data in the column will be lost.
  - Added the required column `customerId` to the `Subscription` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stripeSubscriptionId` to the `Subscription` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `subscription` DROP COLUMN `stripeId`,
    ADD COLUMN `customerId` VARCHAR(191) NOT NULL,
    ADD COLUMN `stripeSubscriptionId` VARCHAR(191) NOT NULL;
