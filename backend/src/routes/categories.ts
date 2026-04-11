import { Router } from "express";
import prisma from "../lib/prisma";

const router = Router();

// GET ALL CATEGORIES (from Product table)
router.get("/", async (_req, res) => {
  try {
    // Get distinct categories directly from Product table
    const products = await prisma.product.findMany({
      where: {
        categoryName: {
          not: null
        }
      },
      select: {
        categoryId: true,
        categoryName: true,
      },
      distinct: ["categoryName"],
      orderBy: {
        categoryName: "asc"
      }
    });

    // Format response: extract unique categories
    const categories = products
      .filter(p => p.categoryName) // Filter out null category names
      .map(p => ({
        id: p.categoryId || p.categoryName,
        name: p.categoryName,
      }))
      .filter((cat, index, self) => 
        index === self.findIndex(c => c.name === cat.name) // Remove duplicates
      );

    res.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({
      message: "Failed to fetch categories",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
