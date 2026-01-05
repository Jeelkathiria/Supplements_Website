import { Response } from "express";
import { AuthRequest } from "../middlewares/requireAuth";
import * as cartService from "../services/cartService";

export const getCart = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }
    const cart = await cartService.getOrCreateCart(userId);
    res.json(cart);
  } catch (error) {
    console.error("Error getting cart:", error);
    res.status(500).json({ message: "Failed to get cart" });
  }
};

export const addItem = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }
    const { productId, quantity } = req.body;

    if (!productId || !quantity || quantity <= 0) {
      return res.status(400).json({ message: "Invalid productId or quantity" });
    }

    const item = await cartService.addToCart(userId, productId, quantity);
    res.json(item);
  } catch (error) {
    console.error("Error adding item to cart:", error);
    res.status(500).json({ message: "Failed to add item to cart" });
  }
};

export const updateItem = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }
    const { productId, quantity } = req.body;

    if (!productId || !quantity || quantity <= 0) {
      return res.status(400).json({ message: "Invalid productId or quantity" });
    }

    const item = await cartService.updateCartItem(userId, productId, quantity);
    res.json(item);
  } catch (error) {
    console.error("Error updating cart item:", error);
    res.status(500).json({ message: "Failed to update cart item" });
  }
};

export const removeItem = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ message: "Invalid productId" });
    }

    const result = await cartService.removeCartItem(userId, productId);
    // Return success whether item existed or not (idempotent operation)
    res.json({ success: true, removed: result !== null });
  } catch (error) {
    console.error("Error removing cart item:", error);
    const message = error instanceof Error ? error.message : "Failed to remove cart item";
    res.status(500).json({ message });
  }
};
