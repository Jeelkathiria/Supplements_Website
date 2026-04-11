/*
  Warnings:

  - You are about to drop the column `basePrice` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `discountPercent` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `finalPrice` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `flavors` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `sizes` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `variants` on the `Product` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Product" DROP COLUMN "basePrice",
DROP COLUMN "discountPercent",
DROP COLUMN "finalPrice",
DROP COLUMN "flavors",
DROP COLUMN "isActive",
DROP COLUMN "sizes",
DROP COLUMN "variants";
