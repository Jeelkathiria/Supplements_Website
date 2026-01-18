# Image Storage System Architecture

## System Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                             │
│                    src/app/pages/Admin.tsx                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  [User Selects Images] → [handleImageUpload]                        │
│         ↓                      ↓                                     │
│    File Input          uploadImages() function                      │
│   (e.target.files)    ─────────────────────────────────────────→    │
│                                                                      │
│                       Call productService                          │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
                        NETWORK REQUEST
                    POST /api/images/upload-multiple
                         (FormData)
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    BACKEND (Express.js)                              │
│              src/routes/imageRoutes.ts                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  router.post("/upload-multiple", requireAuth, handler)             │
│         ↓                                                            │
│  imageUpload.array("images", 10)                                   │
│         ↓                                                            │
│  src/middlewares/imageUpload.ts                                    │
│    ├─ Validate file types (JPEG, PNG, GIF, WebP)                  │
│    ├─ Check file size (max 5MB)                                   │
│    ├─ Generate unique filename (timestamp + random)               │
│    └─ Save to disk: /backend/uploads/                             │
│         ↓                                                            │
│  Return Response:                                                   │
│  {                                                                   │
│    "success": true,                                                │
│    "imageUrls": [                                                  │
│      "/uploads/images-1704873200000-123456789.jpg",               │
│      "/uploads/images-1704873200001-987654321.jpg"                │
│    ]                                                               │
│  }                                                                  │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
                        NETWORK RESPONSE
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                             │
│                  setFormData.imageUrls = [URLs]                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  [Show Image Preview Grid]                                         │
│         ↓                                                            │
│  User clicks "Save Product"                                        │
│         ↓                                                            │
│  handleSubmit() sends product data with imageUrls                  │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
                        NETWORK REQUEST
                  POST /api/admin/products
              (includes imageUrls array with URLs)
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    BACKEND (Express.js)                              │
│           src/routes/adminProducts.ts                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  router.post("/", requireAuth, handler)                            │
│         ↓                                                            │
│  Create Product:                                                    │
│  await prisma.product.create({                                     │
│    name: "...",                                                    │
│    imageUrls: ["/uploads/images-...", ...]                         │
│    ...                                                             │
│  })                                                                │
│         ↓                                                            │
│  Database: PostgreSQL                                              │
│         ↓                                                            │
│  Return created product with ID                                    │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
                        NETWORK RESPONSE
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                             │
│                    Admin.tsx & Components                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Product created successfully!                                     │
│  Refresh product list                                              │
│         ↓                                                            │
│  Display product with images                                       │
│  <img src="/uploads/images-..." />                                 │
└─────────────────────────────────────────────────────────────────────┘
```

## File System Structure

```
backend/
├── src/
│   ├── middlewares/
│   │   ├── imageUpload.ts          ← Multer configuration
│   │   ├── requireAuth.ts
│   │   └── ...
│   ├── routes/
│   │   ├── imageRoutes.ts          ← NEW: Upload endpoints
│   │   ├── adminProducts.ts        ← Modified: works with URLs
│   │   ├── products.ts
│   │   └── ...
│   ├── app.ts                      ← Modified: added static serving
│   └── ...
├── uploads/                        ← NEW: Directory for images
│   ├── images-1704873200000-123456789.jpg
│   ├── images-1704873200001-987654321.jpg
│   └── ...
├── package.json                    ← Added: multer, @types/multer
└── ...

frontend/
├── src/
│   ├── app/
│   │   └── pages/
│   │       └── Admin.tsx           ← Modified: new upload handler
│   └── services/
│       └── productService.ts       ← Added: uploadImages()
├── .env                            ← Added: VITE_API_URL
└── ...
```

## Database Schema

```
┌─────────────────────────────┐
│      Product Table          │
├─────────────────────────────┤
│ id (UUID)                   │
│ name (String)               │
│ description (String)        │
│ basePrice (Float)           │
│ discountPercent (Float)     │
│ gstPercent (Float)          │
│ finalPrice (Float)          │
│ stockQuantity (Integer)     │
│ flavors (String[])          │
│ sizes (String[])            │
│ imageUrls (String[])        │ ← Stores URLs!
│ categoryId (String)         │
│ categoryName (String)       │
│ isFeatured (Boolean)        │
│ isSpecialOffer (Boolean)    │
│ isActive (Boolean)          │
│ isVegetarian (Boolean)      │
│ createdAt (DateTime)        │
│ updatedAt (DateTime)        │
└─────────────────────────────┘

imageUrls example:
[
  "/uploads/images-1704873200000-123456789.jpg",
  "/uploads/images-1704873200001-987654321.jpg",
  "/uploads/images-1704873200002-555555555.jpg"
]
```

## Data Flow Summary

1. **Upload Phase**:
   - User selects image files in Admin panel
   - Frontend uploads to `/api/images/upload-multiple`
   - Backend validates, processes, and saves images to disk
   - Backend returns URLs like `/uploads/image-xyz.jpg`
   - Frontend shows preview and stores URLs in state

2. **Save Phase**:
   - User clicks "Save Product"
   - Frontend sends product data WITH image URLs to `/api/admin/products`
   - Backend creates product record in database with imageUrls array
   - Product is now stored with image references

3. **Display Phase**:
   - Frontend fetches products from database
   - Each product has imageUrls array
   - Frontend renders `<img src="/uploads/image-xyz.jpg" />`
   - Backend serves images from `/uploads` directory

## Key Features

✅ **Immediate Upload**: Images upload as soon as files are selected
✅ **Real-time Preview**: Users see uploaded images before saving
✅ **Efficient Storage**: Only URLs stored in database, not base64
✅ **Multiple Images**: Up to 10 images per product
✅ **Validation**: File type and size checks
✅ **Unique Names**: Auto-generated filenames prevent conflicts
✅ **Static Serving**: Images served via HTTP from `/uploads`
✅ **Database Persistence**: Image URLs persist with products
✅ **Fast Loading**: Small JSON payloads instead of base64 strings

## API Endpoints

### Image Upload
```
POST /api/images/upload
Headers: Authorization: Bearer {token}
Body: FormData with "image" field
Response: { success: true, imageUrl: "/uploads/..." }

POST /api/images/upload-multiple
Headers: Authorization: Bearer {token}
Body: FormData with "images" field (up to 10 files)
Response: { success: true, imageUrls: ["/uploads/...", ...] }
```

### Image Retrieval
```
GET /uploads/{filename}
Response: Image file (binary)
```

### Product with Images
```
GET /api/products
Response: Array of products with imageUrls arrays

POST /api/admin/products
Body: { ..., imageUrls: ["/uploads/...", ...] }
Response: Created product with images
```

## Performance Characteristics

| Metric | Before | After |
|--------|--------|-------|
| Database size per product | Large (base64) | Small (URLs) |
| Product fetch time | Slow | Fast |
| Image loading | Immediate (all data) | Progressive (on demand) |
| Upload experience | Delayed | Real-time |
| Image delivery | Single request | Parallel requests |

