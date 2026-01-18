import { Router, Request, Response } from "express";
import { imageUpload } from "../middlewares/imageUpload";
import { requireAuth } from "../middlewares/requireAuth";
import path from "path";

const router = Router();

// Upload image endpoint
router.post("/upload", requireAuth, imageUpload.single("image"), (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }

    // Return the image URL path
    const imageUrl = `/uploads/${req.file.filename}`;
    
    res.json({
      success: true,
      imageUrl,
      filename: req.file.filename,
    });
  } catch (error) {
    console.error("Error uploading image:", error);
    res.status(500).json({
      message: "Failed to upload image",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Upload multiple images
router.post("/upload-multiple", requireAuth, imageUpload.array("images", 10), (req: Request, res: Response) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No image files provided" });
    }

    const imageUrls = (req.files as Express.Multer.File[]).map(
      (file) => `/uploads/${file.filename}`
    );

    res.json({
      success: true,
      imageUrls,
      count: imageUrls.length,
    });
  } catch (error) {
    console.error("Error uploading images:", error);
    res.status(500).json({
      message: "Failed to upload images",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
