import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import {
  getFavorites,
  addFavorite,
  removeFavorite,
  isFavorited,
} from "../controllers/favoritesController";

const router = Router();

// Get all favorites for user
router.get("/", requireAuth, getFavorites);

// Add product to favorites
router.post("/", requireAuth, addFavorite);

// Check if product is favorited
router.get("/:productId/check", requireAuth, isFavorited);

// Remove product from favorites
router.delete("/:productId", requireAuth, removeFavorite);

export default router;
