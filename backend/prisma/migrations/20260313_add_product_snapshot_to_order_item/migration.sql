-- Add product snapshot fields to OrderItem
ALTER TABLE "OrderItem" ADD COLUMN "productName" TEXT;
ALTER TABLE "OrderItem" ADD COLUMN "basePrice" DOUBLE PRECISION;
ALTER TABLE "OrderItem" ADD COLUMN "discountPercent" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "OrderItem" ADD COLUMN "imageUrl" TEXT;

-- Update existing records with data from Product table (for migration)
UPDATE "OrderItem" oi
SET 
  "productName" = p."name",
  "basePrice" = p."basePrice",
  "discountPercent" = COALESCE(p."discountPercent", 0),
  "imageUrl" = p."imageUrls"[1]
FROM "Product" p
WHERE oi."productId" = p."id";
