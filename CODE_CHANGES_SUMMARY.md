# Code Changes Summary

## New Files Created

### 1. Backend Image Upload Middleware
**File**: `backend/src/middlewares/imageUpload.ts`

Handles file upload configuration with multer:
- Validates image file types (JPEG, PNG, GIF, WebP)
- Enforces 5MB file size limit
- Generates unique filenames with timestamp and random suffix
- Stores files in `/backend/uploads/` directory

### 2. Backend Image Routes
**File**: `backend/src/routes/imageRoutes.ts`

Provides API endpoints:
- `POST /api/images/upload` - Single image upload
- `POST /api/images/upload-multiple` - Batch upload (up to 10 images)
- Both endpoints require Firebase authentication
- Return image URLs for database storage

---

## Modified Files

### Backend Changes

#### 1. `backend/src/app.ts`
**Added:**
- Import imageRoutes
- Import path module
- Static file serving for `/uploads` directory
- Register `/api/images` routes

**Key Addition:**
```typescript
import path from "path";
import imageRoutes from "./routes/imageRoutes";

// Serve uploads directory as static files
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Image uploads
app.use("/api/images", imageRoutes);
```

#### 2. `backend/.gitignore`
**Added:** 
```
# Uploads
uploads/
```

#### 3. `backend/package.json`
**Dependencies Added:**
```json
"multer": "^1.4.5-lts.1",
"@types/multer": "^1.4.11"
```

### Frontend Changes

#### 1. `frontend/src/services/productService.ts`
**Added Functions:**

```typescript
// Upload single image
export const uploadImage = async (file: File): Promise<string>

// Upload multiple images
export const uploadImages = async (files: File[]): Promise<string[]>
```

Both functions:
- Get Firebase authentication token
- Send FormData to backend
- Return array of image URLs
- Handle errors with meaningful messages

#### 2. `frontend/src/app/pages/Admin.tsx`
**Changes:**

1. **Import Updated:**
   - Added `uploadImages` to imports from productService

2. **Image Upload Handler Changed:**
   - Old: Converted files to base64 synchronously
   - New: Uploads files asynchronously to backend
   - Shows loading toast during upload
   - Displays success/error messages
   - Updates form state with returned URLs

3. **Form Submit Handler Simplified:**
   - Old: Filtered between base64 and existing URLs
   - New: Directly uses returned image URLs
   - No base64 encoding/decoding needed

#### 3. `frontend/.env`
**Added:**
```
VITE_API_URL=http://localhost:5000/api
```

---

## Code Details

### imageUpload.ts - Multer Configuration

```typescript
import multer from "multer";
import path from "path";
import fs from "fs";

// Directory setup
const uploadsDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Unique filename: fieldname-timestamp-random.ext
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

// File validation
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only images are allowed."));
  }
};

// Export multer instance
export const imageUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});
```

### imageRoutes.ts - API Endpoints

```typescript
import { Router, Request, Response } from "express";
import { imageUpload } from "../middlewares/imageUpload";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

// Single image upload
router.post("/upload", requireAuth, imageUpload.single("image"), (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }

    const imageUrl = `/uploads/${req.file.filename}`;
    
    res.json({
      success: true,
      imageUrl,
      filename: req.file.filename,
    });
  } catch (error) {
    // Error handling
  }
});

// Multiple images upload
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
    // Error handling
  }
});

export default router;
```

### Frontend Image Upload Handler

**Old Implementation:**
```typescript
const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = e.target.files;
  if (!files) return;

  // Convert to base64 strings
  const promises = Array.from(files).map((file) => {
    return new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        resolve(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    });
  });

  Promise.all(promises).then((base64Images) => {
    setFormData((prev) => ({
      ...prev,
      imageUrls: [...(prev.imageUrls || []), ...base64Images],
    }));
    toast.success(`${files.length} image(s) added`);
  });
};
```

**New Implementation:**
```typescript
const handleImageUpload = async (
  e: React.ChangeEvent<HTMLInputElement>,
) => {
  const files = e.target.files;
  if (!files) return;

  try {
    toast.loading(`Uploading ${files.length} image(s)...`);
    
    // Upload files to backend
    const uploadedUrls = await uploadImages(Array.from(files));
    
    // Add uploaded URLs to form data
    setFormData((prev) => ({
      ...prev,
      imageUrls: [...(prev.imageUrls || []), ...uploadedUrls],
    }));
    
    toast.dismiss();
    toast.success(`${files.length} image(s) uploaded successfully`);
  } catch (error) {
    toast.dismiss();
    toast.error(error instanceof Error ? error.message : "Failed to upload images");
    console.error("Image upload error:", error);
  }
};
```

**Key Changes:**
- Async function with await
- Calls `uploadImages()` from service
- Shows loading toast during upload
- Receives URLs instead of base64
- Better error handling

### Frontend Product Service Functions

```typescript
export const uploadImage = async (file: File): Promise<string> => {
  try {
    const token = await getAuthToken();

    if (!token) {
      throw new Error("Not authenticated. Please login first.");
    }

    const formData = new FormData();
    formData.append("image", file);

    const response = await fetch(`${API_BASE_URL}/images/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to upload image (${response.status})`);
    }

    const data = await response.json();
    return data.imageUrl;
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
};

export const uploadImages = async (files: File[]): Promise<string[]> => {
  try {
    const token = await getAuthToken();

    if (!token) {
      throw new Error("Not authenticated. Please login first.");
    }

    const formData = new FormData();
    files.forEach((file) => {
      formData.append("images", file);
    });

    const response = await fetch(`${API_BASE_URL}/images/upload-multiple`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to upload images (${response.status})`);
    }

    const data = await response.json();
    return data.imageUrls;
  } catch (error) {
    console.error("Error uploading images:", error);
    throw error;
  }
};
```

---

## Data Flow Changes

### Before: Base64 Approach
1. User selects images
2. Frontend converts to base64
3. Frontend stores base64 in state
4. Frontend sends base64 in JSON
5. Backend stores base64 in database
6. Frontend displays base64 URLs directly

### After: URL-Based Approach
1. User selects images
2. Frontend sends files to upload endpoint
3. Backend processes files and stores on disk
4. Backend returns URLs
5. Frontend stores URLs in state
6. Frontend sends product with URLs in JSON
7. Backend stores URLs in database
8. Frontend displays images from `/uploads` directory

---

## Benefits of New Implementation

1. **Smaller Database**: URLs (100 bytes) vs base64 (1-5MB)
2. **Faster Loading**: Parallel image requests vs single large JSON
3. **Better UX**: Real-time upload feedback
4. **Easier Scaling**: Can move to cloud storage (S3, etc)
5. **Image Optimization**: Can resize/compress on backend
6. **Memory Efficient**: No huge strings in memory

---

## Backward Compatibility

- Existing products with images continue to work
- Old base64 images can be migrated to new system
- Both URL formats and base64 supported in frontend display
- Database schema unchanged (imageUrls already existed)

---

## Testing Checklist

- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Multer installed successfully
- [ ] Image upload endpoint responds to requests
- [ ] Files saved to `/backend/uploads/` directory
- [ ] API returns correct image URLs
- [ ] Frontend preview shows uploaded images
- [ ] Product saves with image URLs
- [ ] Database stores URLs correctly
- [ ] Images display on product pages
- [ ] Images serve from `/uploads` endpoint

---

## Dependencies Added

- **multer** (^1.4.5-lts.1): File upload middleware
- **@types/multer** (^1.4.11): TypeScript types for multer

Both are already installed by `npm install`.

