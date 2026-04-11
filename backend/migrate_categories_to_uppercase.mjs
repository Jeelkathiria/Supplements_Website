import { PrismaClient } from './src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function migrate() {
  console.log('Starting category migration to uppercase...');

  try {
    // 1. Update all Product categoryName fields
    const products = await prisma.product.findMany({
      where: {
        categoryName: { not: null }
      }
    });

    console.log(`Checking ${products.length} products...`);
    let productUpdates = 0;
    for (const product of products) {
      if (product.categoryName && product.categoryName !== product.categoryName.toUpperCase()) {
        await prisma.product.update({
          where: { id: product.id },
          data: { categoryName: product.categoryName.toUpperCase().trim() }
        });
        productUpdates++;
      }
    }
    console.log(`Updated ${productUpdates} products to uppercase category names.`);

    // 2. Update Category table and handle duplicates
    const categories = await prisma.category.findMany();
    console.log(`Checking ${categories.length} categories...`);

    const nameMap = new Map(); // Uppercase Name -> Category Object

    for (const category of categories) {
      const upperName = category.name.toUpperCase().trim();
      
      if (nameMap.has(upperName)) {
        // DUPLICATE DETECTED! Merge this one into the existing one.
        const survivingCategory = nameMap.get(upperName);
        console.log(`Merging Category "${category.name}" into "${survivingCategory.name}"`);

        // Re-assign all products from this category to the survivor
        await prisma.product.updateMany({
          where: { categoryId: category.id },
          data: { 
            categoryId: survivingCategory.id,
            categoryName: upperName
          }
        });

        // Delete the redundant category
        await prisma.category.delete({
          where: { id: category.id }
        });
      } else {
        // Not a duplicate yet, update name to uppercase
        const updatedCategory = await prisma.category.update({
          where: { id: category.id },
          data: { name: upperName }
        });
        nameMap.set(upperName, updatedCategory);
      }
    }

    console.log('Migration completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrate();
