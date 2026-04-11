/*
  Warnings:

  - You are about to drop the column `minValue` on the `Coupon` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Favorite" DROP CONSTRAINT "Favorite_productId_fkey";

-- AlterTable
ALTER TABLE "Coupon" DROP COLUMN "minValue",
ADD COLUMN     "minAmount" DOUBLE PRECISION DEFAULT 0;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "defaultPrice" DOUBLE PRECISION,
ADD COLUMN     "pricingMatrix" JSONB,
ADD COLUMN     "weights" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
