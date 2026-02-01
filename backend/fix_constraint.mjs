import prisma from './src/lib/prisma.js';

async function main() {
  try {
    // Delete all cart items first
    await prisma.$executeRawUnsafe('DELETE FROM "CartItem"');
    console.log('Cleared all cart items');
    
    // Check if the old constraint exists and drop it
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "CartItem" DROP CONSTRAINT IF EXISTS "CartItem_cartId_productId_key"'
    );
    console.log('Dropped old constraint');
    
    // Add the new constraint
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_cartId_productId_flavor_size_key" UNIQUE ("cartId", "productId", "flavor", "size")'
    );
    console.log('Added new constraint');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
