# Image Upload & Storage Implementation

## Overview
Images are now properly stored in the database through a file-based system on the backend.

## How It Works

### 1. **Frontend Image Upload Flow**

When you upload images in the Admin panel:

1. User selects image files from their computer
2. Frontend sends files to backend API endpoint: `POST /api/images/upload-multiple`
3. Backend processes images with multer, stores them in `/uploads` directory
4. Backend returns image URLs (e.g., `/uploads/image-1704873200000-123456789.jpg`)
5. Frontend displays preview of uploaded images
6. When saving the product, image URLs are stored in the database

### 2. **Backend Image Handling**

**Image Upload Middleware** (`src/middlewares/imageUpload.ts`):
- Uses multer to handle multipart form data
- Validates file types (JPEG, PNG, GIF, WebP only)
- Limits file size to 5MB per image
- Stores files in `/uploads` directory
- Generates unique filenames using timestamp + random number

**Image Upload Routes** (`src/routes/imageRoutes.ts`):
- `POST /api/images/upload` - Upload single image
- `POST /api/images/upload-multiple` - Upload multiple images
- Returns array of image URLs that can be stored in database

**Static File Serving** (`src/app.ts`):
- `/uploads` directory is served as static files
- Images are accessible via `http://localhost:5000/uploads/filename.jpg`

### 3. **Database Storage**

Product schema includes `imageUrls: String[]` field in Prisma:

```prisma
model Product {
  // ... other fields
  imageUrls String[]
  // ... other fields
}
```

Image URLs are stored as strings in the database and can include:
- Local URLs: `/uploads/image-1704873200000-123456789.jpg`
- External URLs: `https://example.com/image.jpg`

### 4. **Frontend Integration**

**Product Service** (`frontend/src/services/productService.ts`):
- `uploadImages(files: File[])` - Uploads files and returns URLs
- `createProduct()` - Saves product with image URLs
- `updateProduct()` - Updates product with image URLs

**Admin Component** (`frontend/src/app/pages/Admin.tsx`):
- `handleImageUpload()` - Handles file selection and upload
- Images are uploaded immediately when selected
- Preview shows uploaded images before saving product
- Multiple images can be uploaded to a single product

## Usage Guide

### Adding a Product with Images

1. Click "Add Product" button
2. Fill in product details
3. Click "Upload Images" button
4. Select multiple images (up to 10 per request)
5. Images are uploaded automatically and previewed
6. Images appear in a grid below the upload button
7. Click the ✕ button to remove an image before saving
8. Click "Save Product" to create the product with images

### Viewing Product Images

Images are displayed in:
- Product listing page
- Product detail page
- Cart page
- Order pages

Each product displays the first image from the `imageUrls` array.

## File Structure

```
backend/
├── src/
│   ├── middlewares/
│   │   └── imageUpload.ts          # Multer configuration
│   └── routes/
│       └── imageRoutes.ts           # Image upload endpoints
├── uploads/                         # Directory where images are stored
│   └── [generated filenames]
└── app.ts                           # Added static file serving
```

## Configuration

### Environment Variables

Frontend `.env`:
```
VITE_API_URL=http://localhost:5000/api
```

### Size Limits

- Maximum file size: 5MB per image
- Maximum files per upload: 10 images
- Allowed formats: JPEG, PNG, GIF, WebP

## Security Features

1. **File Type Validation**: Only image MIME types are accepted
2. **File Size Limits**: 5MB maximum per image
3. **Authentication**: Image upload requires Firebase authentication token
4. **Unique Filenames**: Generated using timestamp + random number to prevent conflicts

## Troubleshooting

### Images not displaying

1. Check that backend server is running on port 5000
2. Verify `VITE_API_URL` is set correctly in frontend `.env`
3. Check browser console for 404 errors
4. Verify images were uploaded by checking `/uploads` directory

### Upload fails

1. Check file size (must be under 5MB)
2. Check file format (must be JPEG, PNG, GIF, or WebP)
3. Verify Firebase authentication is working
4. Check backend logs for detailed error messages

### Database shows empty imageUrls

This usually means:
1. Images weren't uploaded before saving the product
2. The upload endpoint returned an error
3. The returned URLs weren't properly passed to the product creation

## Future Improvements

1. **Cloud Storage**: Replace file-based storage with AWS S3, Firebase Storage, or similar
2. **Image Optimization**: Resize/compress images before storage
3. **Image Versioning**: Store multiple sizes (thumbnail, medium, full)
4. **CDN Integration**: Serve images through a CDN for faster delivery
5. **Image Deletion**: Implement image deletion when products are removed
