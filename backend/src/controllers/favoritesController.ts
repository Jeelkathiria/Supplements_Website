import { Request, Response } from "express";
import prisma from "../lib/prisma";

// Get user favorites with full product details
export const getFavorites = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.uid as string;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const favorites = await prisma.favorite.findMany({
      where: { userId },
      include: {
        product: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json(favorites);
  } catch (error) {
    console.error("Error fetching favorites:", error);
    return res.status(500).json({ error: "Failed to fetch favorites" });
  }
};

// Add product to favorites
export const addFavorite = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.uid as string;
    const { productId } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    if (!productId) {
      return res.status(400).json({ error: "Product ID is required" });
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Check if already favorited
    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (existingFavorite) {
      return res.status(400).json({ error: "Product already in favorites" });
    }

    // Add to favorites
    const favorite = await prisma.favorite.create({
      data: {
        userId,
        productId,
      },
      include: {
        product: true,
      },
    });

    return res.status(201).json(favorite);
  } catch (error) {
    console.error("Error adding favorite:", error);
    return res.status(500).json({ error: "Failed to add favorite" });
  }
};

// Remove product from favorites
export const removeFavorite = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.uid as string;
    const productId = req.params.productId as string;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    if (!productId) {
      return res.status(400).json({ error: "Product ID is required" });
    }

    // Check if favorite exists
    const favorite = await prisma.favorite.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (!favorite) {
      return res.status(404).json({ error: "Favorite not found" });
    }

    // Remove from favorites
    await prisma.favorite.delete({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    return res.status(200).json({ message: "Favorite removed successfully" });
  } catch (error) {
    console.error("Error removing favorite:", error);
    return res.status(500).json({ error: "Failed to remove favorite" });
  }
};

// Check if product is favorited
export const isFavorited = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.uid as string;
    const productId = req.params.productId as string;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    if (!productId) {
      return res.status(400).json({ error: "Product ID is required" });
    }

    const favorite = await prisma.favorite.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    return res.status(200).json({ isFavorited: !!favorite });
  } catch (error) {
    console.error("Error checking favorite:", error);
    return res.status(500).json({ error: "Failed to check favorite" });
  }
};
