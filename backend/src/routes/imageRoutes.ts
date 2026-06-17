import { Router, Request, Response } from "express";
import { imageUpload } from "../middlewares/imageUpload";
import { requireAuth } from "../middlewares/requireAuth";
import { StorageService } from "../services/storageService";

const router = Router();

// Upload image endpoint
router.post("/upload", requireAuth, imageUpload.single("image"), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }

    // Convert file buffer directly to Base64 Data URL
    const base64Data = req.file.buffer.toString("base64");
    const imageUrl = `data:${req.file.mimetype};base64,${base64Data}`;
    
    res.json({
      success: true,
      imageUrl,
      filename: req.file.originalname,
    });
  } catch (error) {
    console.error("Error converting image to Base64:", error);
    res.status(500).json({
      message: "Failed to upload image",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Upload multiple images
router.post("/upload-multiple", requireAuth, imageUpload.array("images", 10), async (req: Request, res: Response) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No image files provided" });
    }

    const files = req.files as Express.Multer.File[];
    const imageUrls = files.map((file) => {
      const base64Data = file.buffer.toString("base64");
      return `data:${file.mimetype};base64,${base64Data}`;
    });

    res.json({
      success: true,
      imageUrls,
      count: imageUrls.length,
    });
  } catch (error) {
    console.error("Error converting images to Base64:", error);
    res.status(500).json({
      message: "Failed to upload images",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
