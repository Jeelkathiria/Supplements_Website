-- CreateEnum
CREATE TYPE "CancellationRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "OrderCancellationRequest" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "CancellationRequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderCancellationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrderCancellationRequest_orderId_key" ON "OrderCancellationRequest"("orderId");

-- CreateIndex
CREATE INDEX "OrderCancellationRequest_userId_idx" ON "OrderCancellationRequest"("userId");

-- CreateIndex
CREATE INDEX "OrderCancellationRequest_status_idx" ON "OrderCancellationRequest"("status");

-- AddForeignKey
ALTER TABLE "OrderCancellationRequest" ADD CONSTRAINT "OrderCancellationRequest_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
