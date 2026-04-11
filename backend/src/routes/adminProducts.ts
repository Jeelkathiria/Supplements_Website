import { Router, Request, Response } from "express";
import prisma from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middlewares/requireAuth";

const router = Router();

// ============= PRODUCT VARIANTS =============
/**
 * Create product variants (size + flavor combinations)
 * POST /admin/products/:id/variants
 */
router.post("/:id/variants", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const paramId = req.params.id;
    const productId = Array.isArray(paramId) ? paramId[0] : paramId;
    const { variants } = req.body; // Array of { size, flavor, price, discount, discountType }

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Delete existing variants for this product
    await prisma.productVariant.deleteMany({
      where: { productId },
    });

    // Create new variants
    const createdVariants = await Promise.all(
      variants.map((v: any) => {
        const price = Number(v.price);
        const discount = Number(v.discount || 0);
        const discountType = v.discountType || "percent";
        
        let finalPrice = price;
        if (discountType === "percent") {
          finalPrice = price - (price * discount) / 100;
        } else if (discountType === "flat") {
          finalPrice = price - discount;
        }

        return prisma.productVariant.create({
          data: {
            productId,
            size: v.size.trim(),
            flavor: v.flavor.trim(),
            price,
            discount,
            discountType,
            finalPrice: Math.max(0, finalPrice), // Ensure non-negative
          },
        });
      })
    );

    res.status(201).json(createdVariants);
  } catch (error) {
    console.error("Error creating variants:", error);
    res.status(500).json({ 
      message: "Failed to create variants",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * Get all variants for a product
 * GET /admin/products/:id/variants
 */
router.get("/:id/variants", async (req: Request, res: Response) => {
  try {
    const paramId = req.params.id;
    const productId = Array.isArray(paramId) ? paramId[0] : paramId;

    const variants = await prisma.productVariant.findMany({
      where: { productId },
      orderBy: [
        { flavor: "asc" },
        { size: "asc" }
      ],
    });

    res.json(variants);
  } catch (error) {
    console.error("Error fetching variants:", error);
    res.status(500).json({ 
      message: "Failed to fetch variants",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * Get single variant
 * GET /admin/products/variants/:variantId
 */
router.get("/variants/:variantId", async (req: Request, res: Response) => {
  try {
    const paramId = req.params.variantId;
    const variantId = Array.isArray(paramId) ? paramId[0] : paramId;

    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
    });

    if (!variant) {
      return res.status(404).json({ message: "Variant not found" });
    }

    res.json(variant);
  } catch (error) {
    console.error("Error fetching variant:", error);
    res.status(500).json({ 
      message: "Failed to fetch variant",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * Update single variant
 * PUT /admin/products/variants/:variantId
 */
router.put("/variants/:variantId", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const paramId = req.params.variantId;
    const variantId = Array.isArray(paramId) ? paramId[0] : paramId;
    const { price, discount, discountType } = req.body;

    const numPrice = Number(price);
    const numDiscount = Number(discount || 0);
    const type = discountType || "percent";
    
    let finalPrice = numPrice;
    if (type === "percent") {
      finalPrice = numPrice - (numPrice * numDiscount) / 100;
    } else if (type === "flat") {
      finalPrice = numPrice - numDiscount;
    }

    const variant = await prisma.productVariant.update({
      where: { id: variantId },
      data: {
        price: numPrice,
        discount: numDiscount,
        discountType: type,
        finalPrice: Math.max(0, Math.round(finalPrice)),
      },
    });

    res.json(variant);
  } catch (error) {
    console.error("Error updating variant:", error);
    res.status(500).json({ 
      message: "Failed to update variant",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * Delete single variant
 * DELETE /admin/products/variants/:variantId
 */
router.delete("/variants/:variantId", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const paramId = req.params.variantId;
    const variantId = Array.isArray(paramId) ? paramId[0] : paramId;

    await prisma.productVariant.delete({
      where: { id: variantId },
    });

    res.json({ message: "Variant deleted successfully" });
  } catch (error) {
    console.error("Error deleting variant:", error);
    res.status(500).json({ 
      message: "Failed to delete variant",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// ============= PRODUCTS =============

// CREATE PRODUCT
router.post("/", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      description,
      basePrice,
      discountPercent,
      flavors,
      productSizes,
      variants,
      imageUrls,
      categoryId,
      categoryName,
      isFeatured,
      isSpecialOffer,
      isVegetarian,
      isOutOfStock,
    } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({ 
        message: "Missing required fields: name" 
      });
    }

    // Validate and resolve categoryId
    let validatedCategoryId = null;
    let resolvedCategoryName = null;
    
    // If categoryId is provided, try to resolve it
    if (categoryId) {
      // Trim and uppercase the categoryId for case-insensitive lookup
      const normalizedCategoryId = categoryId.trim().toUpperCase();
      
      // Check if it's a UUID or a category name
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(normalizedCategoryId);
      
      if (isUUID) {
        // It's a UUID, validate it exists
        const categoryExists = await prisma.category.findUnique({
          where: { id: normalizedCategoryId },
        });
        if (!categoryExists) {
          return res.status(400).json({ message: "Category not found" });
        }
        validatedCategoryId = normalizedCategoryId;
        resolvedCategoryName = categoryExists.name.toUpperCase();
      } else {
        // It's a category name, look it up case-insensitively
        const categoryByName = await prisma.category.findUnique({
          where: { name: normalizedCategoryId },
        });
        if (categoryByName) {
          validatedCategoryId = categoryByName.id;
          resolvedCategoryName = categoryByName.name.toUpperCase();
        } else {
          // Category doesn't exist, store the name as uppercase
          resolvedCategoryName = normalizedCategoryId;
          validatedCategoryId = null;
        }
      }
    }

    const finalCategoryName = (categoryName || resolvedCategoryName || categoryId || "").trim().toUpperCase();

    // Create product (without flavors/productSizes - those go to ProductVariant)
    const product = await prisma.product.create({
      data: {
        name,
        description: description || "",
        basePrice: basePrice ? Number(basePrice) : 0,
        discountPercent: discountPercent ? Number(discountPercent) : 0,
        categoryId: validatedCategoryId,
        categoryName: finalCategoryName || null, // Store the name for display, preserving spaces
        imageUrls: imageUrls || [],
        isFeatured: isFeatured === true || isFeatured === "true",
        isSpecialOffer: isSpecialOffer === true || isSpecialOffer === "true",
        isVegetarian: isVegetarian === true || isVegetarian === "true",
        isOutOfStock: isOutOfStock === true || isOutOfStock === "true",
      },
      include: { 
        productVariants: true,
      },
    });

    // Create variants from productSizes (new system)
    if (productSizes && Array.isArray(productSizes) && productSizes.length > 0) {
      await Promise.all(
        productSizes.flatMap((size: any) => {
          const sizeDiscount = Number(size.discount || 0); // Percentage discount for entire size
          return (size.flavors || []).map((flavor: any) => {
            const price = Number(flavor.price);
            
            // Apply size-level discount (percentage only)
            let finalPrice = price;
            if (sizeDiscount > 0) {
              finalPrice = price - (price * sizeDiscount / 100);
            }

            return prisma.productVariant.create({
              data: {
                productId: product.id,
                size: size.size.trim(),
                flavor: flavor.name.trim(),
                price,
                discount: sizeDiscount,
                discountType: "percent",
                finalPrice: Math.round(finalPrice),
              },
            });
          });
        })
      );
    }
    // Fallback: Create variants from old variants format
    else if (variants && Array.isArray(variants) && variants.length > 0) {
      await Promise.all(
        variants.map((v: any) => {
          const price = Number(v.price);
          const discount = Number(v.discount || 0);
          const discountType = v.discountType || "percent";
          
          let finalPrice = price;
          if (discountType === "percent") {
            finalPrice = price - (price * discount) / 100;
          } else if (discountType === "flat") {
            finalPrice = price - discount;
          }

          return prisma.productVariant.create({
            data: {
              productId: product.id,
              size: v.size.trim(),
              flavor: v.flavor.trim(),
              price,
              discount,
              discountType,
              finalPrice: Math.max(0, finalPrice),
            },
          });
        })
      );
    }

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
    const paramId = req.params.id;
    const id = Array.isArray(paramId) ? paramId[0] : paramId;
    const {
      name,
      description,
      basePrice,
      discountPercent,
      flavors,
      productSizes,
      variants,
      imageUrls,
      categoryName,
      categoryId,
      isFeatured,
      isSpecialOffer,
      isVegetarian,
      isOutOfStock,
    } = req.body;

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Validate and resolve categoryId
    let validatedCategoryId = null;
    let resolvedCategoryName = null;
    
    // If categoryId is provided, try to resolve it
    if (categoryId) {
      // Trim and uppercase the categoryId for case-insensitive lookup
      const normalizedCategoryId = categoryId.trim().toUpperCase();
      
      // Check if it's a UUID or a category name
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(normalizedCategoryId);
      
      if (isUUID) {
        // It's a UUID, validate it exists
        const categoryExists = await prisma.category.findUnique({
          where: { id: normalizedCategoryId },
        });
        if (!categoryExists) {
          return res.status(400).json({ message: "Category not found" });
        }
        validatedCategoryId = normalizedCategoryId;
        resolvedCategoryName = categoryExists.name.toUpperCase();
      } else {
        // It's a category name, look it up case-insensitively
        const categoryByName = await prisma.category.findUnique({
          where: { name: normalizedCategoryId },
        });
        if (categoryByName) {
          validatedCategoryId = categoryByName.id;
          resolvedCategoryName = categoryByName.name.toUpperCase();
        } else {
          // Category doesn't exist, store the name as uppercase
          resolvedCategoryName = normalizedCategoryId;
          validatedCategoryId = null;
        }
      }
    }

    const finalCategoryName = (categoryName || resolvedCategoryName || categoryId || "").trim().toUpperCase();

    // Update product (without flavors/productSizes - those go to ProductVariant)
    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
        description: description || "",
        basePrice: basePrice ? Number(basePrice) : 0,
        discountPercent: discountPercent ? Number(discountPercent) : 0,
        categoryId: validatedCategoryId,
        categoryName: finalCategoryName || null, // Store the name for display, preserving spaces
        imageUrls: imageUrls || [],
        isFeatured: isFeatured === true || isFeatured === "true",
        isSpecialOffer: isSpecialOffer === true || isSpecialOffer === "true",
        isVegetarian: isVegetarian === true || isVegetarian === "true",
        isOutOfStock: isOutOfStock === true || isOutOfStock === "true",
      },
      include: { 
        productVariants: true,
      },
    });

    // Update variants from productSizes (new system)
    if (productSizes && Array.isArray(productSizes)) {
      // Delete old variants and recreate from new productSizes
      await prisma.productVariant.deleteMany({
        where: { productId: id },
      });

      if (productSizes.length > 0) {
        await Promise.all(
          productSizes.flatMap((size: any) => {
            const sizeDiscount = Number(size.discount || 0); // Percentage discount for entire size
            return (size.flavors || []).map((flavor: any) => {
              const price = Number(flavor.price);
              
              // Apply size-level discount (percentage only)
              let finalPrice = price;
              if (sizeDiscount > 0) {
                finalPrice = price - (price * sizeDiscount / 100);
              }

              return prisma.productVariant.create({
                data: {
                  productId: id,
                  size: size.size.trim(),
                  flavor: flavor.name.trim(),
                  price,
                  discount: sizeDiscount,
                  discountType: "percent",
                  finalPrice,
                },
              });
            });
          })
        );
      }
    }
    // Fallback: Update variants from old variants format
    else if (variants && Array.isArray(variants)) {
      // Delete old variants and create new ones
      await prisma.productVariant.deleteMany({
        where: { productId: id },
      });

      if (variants.length > 0) {
        await Promise.all(
          variants.map((v: any) => {
            const price = Number(v.price);
            const discount = Number(v.discount || 0);
            const discountType = v.discountType || "percent";
            
            let finalPrice = price;
            if (discountType === "percent") {
              finalPrice = price - (price * discount) / 100;
            } else if (discountType === "flat") {
              finalPrice = price - discount;
            }

            return prisma.productVariant.create({
              data: {
                productId: id,
                size: v.size.trim(),
                flavor: v.flavor.trim(),
                price,
                discount,
                discountType,
                finalPrice: Math.max(0, finalPrice),
              },
            });
          })
        );
      }
    }

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
    const paramId = req.params.id;
    const id = Array.isArray(paramId) ? paramId[0] : paramId;

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

// GET PRICE FOR FLAVOR + WEIGHT COMBINATION
router.get("/:id/price", async (req: Request, res: Response) => {
  try {
    const paramId = req.params.id;
    const id = Array.isArray(paramId) ? paramId[0] : paramId;
    const { flavor, size } = req.query;

    const variant = await prisma.productVariant.findFirst({
      where: {
        productId: id,
        flavor: flavor as string,
        size: size as string,
      },
    });

    if (variant) {
      return res.json({
        price: variant.finalPrice,
        productId: id,
        flavor: flavor || null,
        size: size || null,
        fullVariant: variant,
      });
    }

    // Fallback to product base price if no variant found
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({
      price: product.basePrice * (1 - (product.discountPercent || 0) / 100),
      productId: id,
      flavor: flavor || null,
      size: size || null,
    });
  } catch (error) {
    console.error("Error getting price:", error);
    res.status(500).json({ 
      message: "Failed to get price",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;
