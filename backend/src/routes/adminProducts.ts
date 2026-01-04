import { Router, Request, Response } from "express";
import prisma from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middlewares/requireAuth";

const router = Router();

// CREATE PRODUCT
router.post("/", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      description,
      basePrice,
      discountPercent,
      gstPercent,
      stockQuantity,
      flavors,
      sizes,
      imageUrls,
      categoryId, // This is actually the category name from frontend
      isFeatured,
      isSpecialOffer,
    } = req.body;

    // Validate required fields
    if (!name || basePrice === undefined) {
      return res.status(400).json({ 
        message: "Missing required fields: name, basePrice" 
      });
    }

    const discountedPrice =
      Number(basePrice) - (Number(basePrice) * Number(discountPercent || 0)) / 100;

    const finalPrice =
      discountedPrice + (discountedPrice * Number(gstPercent || 0)) / 100;

    // Handle category - create if doesn't exist
    let actualCategoryId: string | null = null;
    let actualCategoryName: string | null = null;
    if (categoryId && categoryId.trim()) {
      const category = await prisma.category.findUnique({
        where: { name: categoryId.trim() },
      });

      if (category) {
        actualCategoryId = category.id;
        actualCategoryName = category.name;
      } else {
        // Create new category
        const newCategory = await prisma.category.create({
          data: { name: categoryId.trim() },
        });
        actualCategoryId = newCategory.id;
        actualCategoryName = newCategory.name;
      }
    }

    const product = await prisma.product.create({
      data: {
        name,
        description: description || "",
        basePrice: Number(basePrice),
        discountPercent: Number(discountPercent || 0),
        gstPercent: Number(gstPercent || 0),
        finalPrice,
        stockQuantity: Number(stockQuantity || 0),
        flavors: flavors || [],
        sizes: sizes || [],
        imageUrls: imageUrls || [],
        categoryId: actualCategoryId,
        categoryName: actualCategoryName,
        isFeatured: isFeatured === true || isFeatured === "true",
        isSpecialOffer: isSpecialOffer === true || isSpecialOffer === "true",
        isActive: true,
      },
      include: { category: true },
    });

    res.status(201).json(product);
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ 
      message: "Failed to create product",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// UPDATE PRODUCT
router.put("/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      basePrice,
      discountPercent,
      gstPercent,
      stockQuantity,
      flavors,
      sizes,
      imageUrls,
      categoryId,
      isFeatured,
      isSpecialOffer,
    } = req.body;

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    const discountedPrice =
      Number(basePrice) - (Number(basePrice) * Number(discountPercent || 0)) / 100;

    const finalPrice =
      discountedPrice + (discountedPrice * Number(gstPercent || 0)) / 100;

    // Handle category - create if doesn't exist
    let actualCategoryId: string | null = null;
    let actualCategoryName: string | null = null;
    if (categoryId && categoryId.trim()) {
      const category = await prisma.category.findUnique({
        where: { name: categoryId.trim() },
      });

      if (category) {
        actualCategoryId = category.id;
        actualCategoryName = category.name;
      } else {
        // Create new category
        const newCategory = await prisma.category.create({
          data: { name: categoryId.trim() },
        });
        actualCategoryId = newCategory.id;
        actualCategoryName = newCategory.name;
      }
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
        description: description || "",
        basePrice: Number(basePrice),
        discountPercent: Number(discountPercent || 0),
        gstPercent: Number(gstPercent || 0),
        finalPrice,
        stockQuantity: Number(stockQuantity || 0),
        flavors: flavors || [],
        sizes: sizes || [],
        imageUrls: imageUrls || [],
        categoryId: actualCategoryId,
        categoryName: actualCategoryName,
        isFeatured: isFeatured === true || isFeatured === "true",
        isSpecialOffer: isSpecialOffer === true || isSpecialOffer === "true",
      },
      include: { category: true },
    });

    res.json(product);
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ 
      message: "Failed to update product",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// DELETE PRODUCT
router.delete("/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    await prisma.product.delete({
      where: { id },
    });

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ 
      message: "Failed to delete product",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;
