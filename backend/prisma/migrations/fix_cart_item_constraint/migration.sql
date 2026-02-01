-- Drop the old unique constraint on (cartId, productId) if it exists
ALTER TABLE "CartItem" DROP CONSTRAINT IF EXISTS "CartItem_cartId_productId_key";

-- Delete all cart items to avoid constraint violations  
DELETE FROM "CartItem";

-- Add the new unique constraint on (cartId, productId, flavor, size)
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_cartId_productId_flavor_size_key" UNIQUE ("cartId", "productId", "flavor", "size");
