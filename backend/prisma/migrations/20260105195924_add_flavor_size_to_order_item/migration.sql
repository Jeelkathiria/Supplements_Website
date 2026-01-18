-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "flavor" TEXT,
ADD COLUMN     "size" TEXT;

-- CreateIndex
CREATE INDEX "Order_userId_idx" ON "Order"("userId");
