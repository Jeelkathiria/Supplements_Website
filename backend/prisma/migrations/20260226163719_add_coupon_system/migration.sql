-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "couponCode" TEXT;

-- CreateTable
CREATE TABLE "Coupon" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "trainerName" TEXT NOT NULL,
    "trainerId" TEXT,
    "discountPercent" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "discountType" TEXT NOT NULL DEFAULT 'percent',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "maxUses" INTEGER,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "expiryDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppliedCoupon" (
    "id" TEXT NOT NULL,
    "couponId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "discountAmount" DOUBLE PRECISION NOT NULL,
    "trainerName" TEXT NOT NULL,
    "trainerId" TEXT,
    "appliedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "commissionNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppliedCoupon_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Coupon_code_key" ON "Coupon"("code");

-- CreateIndex
CREATE INDEX "Coupon_code_idx" ON "Coupon"("code");

-- CreateIndex
CREATE INDEX "Coupon_isActive_idx" ON "Coupon"("isActive");

-- CreateIndex
CREATE INDEX "Coupon_trainerName_idx" ON "Coupon"("trainerName");

-- CreateIndex
CREATE UNIQUE INDEX "AppliedCoupon_orderId_key" ON "AppliedCoupon"("orderId");

-- CreateIndex
CREATE INDEX "AppliedCoupon_couponId_idx" ON "AppliedCoupon"("couponId");

-- CreateIndex
CREATE INDEX "AppliedCoupon_orderId_idx" ON "AppliedCoupon"("orderId");

-- CreateIndex
CREATE INDEX "AppliedCoupon_userId_idx" ON "AppliedCoupon"("userId");

-- CreateIndex
CREATE INDEX "AppliedCoupon_trainerName_idx" ON "AppliedCoupon"("trainerName");

-- CreateIndex
CREATE INDEX "AppliedCoupon_appliedDate_idx" ON "AppliedCoupon"("appliedDate");

-- CreateIndex
CREATE INDEX "Order_couponCode_idx" ON "Order"("couponCode");

-- AddForeignKey
ALTER TABLE "AppliedCoupon" ADD CONSTRAINT "AppliedCoupon_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppliedCoupon" ADD CONSTRAINT "AppliedCoupon_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
