import { Response } from "express";
import { AuthRequest } from "../middlewares/requireAuth";
import * as cartService from "../services/cartService";

export const getCart = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.dbUser?.id;
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }
    const cart = await cartService.getCartWithTotals(userId);
    res.json(cart);
  } catch (error) {
    console.error("Error getting cart:", error);
    res.status(500).json({ message: "Failed to get cart" });
  }
};

export const addItem = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.dbUser?.id;
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }
    const { productId, quantity, flavor, size } = req.body;

    if (!productId || !quantity || quantity <= 0) {
      return res.status(400).json({ message: "Invalid productId or quantity" });
    }

    const item = await cartService.addToCart(userId, productId, quantity, flavor, size);
    res.json(item);
  } catch (error) {
    console.error("Error adding item to cart:", error);
    res.status(500).json({ message: "Failed to add item to cart" });
  }
};

export const updateItem = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.dbUser?.id;
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
    const userId = req.user?.dbUser?.id;
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

export const mergeCart = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.dbUser?.id;
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const { cartItems } = req.body;

    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({ message: "Invalid cart items" });
    }

    // Validate each item
    for (const item of cartItems) {
      if (!item.productId || !item.quantity || item.quantity <= 0) {
        return res.status(400).json({ message: "Invalid cart item data" });
      }
    }

    const mergedCart = await cartService.mergeGuestCart(userId, cartItems);
    res.json({
      message: "Cart merged successfully",
      cart: mergedCart
    });
  } catch (error) {
    console.error("Error merging cart:", error);
    const message = error instanceof Error ? error.message : "Failed to merge cart";
    res.status(500).json({ message });
  }
};
