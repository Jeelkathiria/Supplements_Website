/*
  Warnings:

  - You are about to drop the column `defaultPrice` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `pricingMatrix` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `weights` on the `Product` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Product" DROP COLUMN "defaultPrice",
DROP COLUMN "pricingMatrix",
DROP COLUMN "weights",
ADD COLUMN     "variants" JSONB NOT NULL DEFAULT '[]';
