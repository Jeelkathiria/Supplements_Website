import { Router } from "express";
import prisma from "../lib/prisma";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        productVariants: {
          orderBy: { createdAt: "asc" },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Transform category relationship to categoryName for frontend
    const productsWithCategoryNames = products.map((product) => ({
      ...product,
      categoryName: product.category?.name || product.categoryName,
    }));

    res.json(productsWithCategoryNames);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Failed to fetch products" });
  }
});

// Get a single product by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        productVariants: {
          orderBy: { createdAt: "asc" },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Transform category relationship to categoryName for frontend
    const productWithCategoryName = {
      ...product,
      categoryName: product.category?.name || product.categoryName,
    };

    res.json(productWithCategoryName);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ message: "Failed to fetch product" });
  }
});

export default router;
