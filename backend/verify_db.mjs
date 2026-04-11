import { PrismaClient } from './src/generated/prisma/index.js';
const prisma = new PrismaClient();
async function check() {
  const products = await prisma.product.findMany({
    select: { name: true, categoryName: true }
  });
  console.log('--- PRODUCTS ---');
  products.forEach(p => console.log(`${p.name}: ${p.categoryName}`));
  
  const categories = await prisma.category.findMany();
  console.log('--- CATEGORIES ---');
  categories.forEach(c => console.log(`${c.id}: ${c.name}`));
  
  await prisma.$disconnect();
}
check();
