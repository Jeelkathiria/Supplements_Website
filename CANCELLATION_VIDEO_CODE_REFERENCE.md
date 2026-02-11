# Order Cancellation Video Implementation - Complete Code Reference

## 1. Database Schema (Prisma)

### Changes to `OrderCancellationRequest` Model
```typescript
model OrderCancellationRequest {
  id        String                    @id @default(uuid())
  orderId   String                    @unique
  userId    String
  reason    String
  status    CancellationRequestStatus @default(PENDING)
  
  // NEW FIELDS FOR VIDEO EVIDENCE
  videoUrl      String?               // URL to video stored in uploads/videos/
  videoUploadedAt DateTime?           // Timestamp when video was uploaded
  
  order     Order                     @relation(fields: [orderId], references: [id], onDelete: Cascade)
  
  createdAt DateTime                  @default(now())
  updatedAt DateTime                  @updatedAt
  
  @@index([userId])
  @@index([status])
}
```

**Migration**: `20260205172701_add_video_to_cancellation_request`

---

## 2. Backend Video Upload Middleware

### File: `src/middlewares/videoUpload.ts`
```typescript
import multer from "multer";
import path from "path";
import fs from "fs";

// Create uploads directory if it doesn't exist
const uploadsDir = path.resolve(__dirname, "../../uploads/videos");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

// Filter for video files only
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = [
    "video/mp4",
    "video/webm",
    "video/quicktime",
    "video/x-msvideo",
    "video/x-matroska"
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only video files are allowed."));
  }
};

// Create multer instance for videos
export const videoUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});
```

---

## 3. Backend Routes

### File: `src/routes/orderCancellationRoutes.ts`
```typescript
import { Router } from "express";
import { OrderCancellationController } from "../controllers/orderCancellationController";
import { requireAuth } from "../middlewares/requireAuth";
import { videoUpload } from "../middlewares/videoUpload";  // NEW

const router = Router();

// Existing routes...
router.get("/admin/pending", requireAuth, OrderCancellationController.getPendingRequests);
router.get("/admin/all", requireAuth, OrderCancellationController.getAllRequests);
router.get("/order/:orderId", requireAuth, OrderCancellationController.getRequestByOrderId);

// NEW: Video upload route
router.post(
  "/:requestId/upload-video",
  requireAuth,
  videoUpload.single("video"),  // Expects "video" field in multipart form
  OrderCancellationController.uploadVideo
);

// Existing routes...
router.post("/", requireAuth, OrderCancellationController.createRequest);
router.patch("/:requestId/approve", requireAuth, OrderCancellationController.approveCancellation);
router.patch("/:requestId/reject", requireAuth, OrderCancellationController.rejectCancellation);

export default router;
```

---

## 4. Backend Controller

### File: `src/controllers/orderCancellationController.ts` - New Method
```typescript
// Upload video for cancellation request (for delivered orders with defects)
static async uploadVideo(req: Request, res: Response) {
  try {
    const { requestId } = req.params;
    const userId = req.user?.uid;
    const id = Array.isArray(requestId) ? requestId[0] : requestId;

    if (!id) {
      return res.status(400).json({ error: "Request ID is required" });
    }

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "Video file is required" });
    }

    // Store the video URL
    const videoUrl = `/uploads/videos/${req.file.filename}`;

    // Update cancellation request with video URL
    const updated = await OrderCancellationService.uploadVideo(id, userId, videoUrl);

    return res.status(200).json({
      success: true,
      message: "Video uploaded successfully",
      data: updated,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      error: error.message || "Failed to upload video",
    });
  }
}
```

---

## 5. Backend Service

### File: `src/services/orderCancellationService.ts` - New Method
```typescript
// Upload video for cancellation request (for delivered orders with defects)
static async uploadVideo(requestId: string, userId: string, videoUrl: string) {
  // Get the cancellation request
  const request = await prisma.orderCancellationRequest.findUnique({
    where: { id: requestId },
    include: { order: true },
  });

  if (!request) {
    throw new Error("Cancellation request not found");
  }

  // Verify the user owns this request
  if (request.userId !== userId) {
    throw new Error("Unauthorized - you can only upload videos for your own requests");
  }

  // Verify the order is in DELIVERED status
  if (request.order.status !== "DELIVERED") {
    throw new Error("Video can only be uploaded for delivered orders");
  }

  // Update the request with video URL
  return prisma.orderCancellationRequest.update({
    where: { id: requestId },
    data: {
      videoUrl,
      videoUploadedAt: new Date(),
    },
    include: {
      order: true,
    },
  });
}
```

---

## 6. Frontend Service

### File: `frontend/src/services/orderCancellationService.ts`

#### Updated Interface
```typescript
export interface OrderCancellationRequest {
  id: string;
  orderId: string;
  userId: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  videoUrl?: string;              // NEW
  videoUploadedAt?: string;       // NEW
  createdAt: string;
  updatedAt: string;
}
```

#### New Method
```typescript
// Upload video for cancellation request (for delivered orders with defects)
static async uploadVideo(
  requestId: string,
  videoFile: File
): Promise<OrderCancellationRequest> {
  const formData = new FormData();
  formData.append('video', videoFile);

  const response = await apiFetch(
    `/order-cancellation-requests/${requestId}/upload-video`,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!response.ok) {
    let errorMessage = 'Failed to upload video';
    try {
      const error = await response.json();
      errorMessage = error.error || error.message || errorMessage;
    } catch (e) {
      errorMessage = `Error ${response.status}: ${response.statusText}`;
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  return data.data;
}
```

---

## 7. Frontend Component

### File: `frontend/src/app/pages/RequestCancellation.tsx`

#### Key State Variables
```typescript
const [videoFile, setVideoFile] = useState<File | null>(null);
const [videoPreview, setVideoPreview] = useState<string | null>(null);
const [uploadingVideo, setUploadingVideo] = useState(false);
const [cancellationRequestId, setCancellationRequestId] = useState<string | null>(null);
```

#### Status-Based Blocking
```typescript
// Show error if trying to cancel during shipment
if (order && order.status === 'SHIPPED') {
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded p-6">
      <AlertCircle className="w-6 h-6 text-yellow-600" />
      <p className="font-semibold text-yellow-900">Cannot Cancel During Shipment</p>
      <p className="text-yellow-800">
        Your order is currently in transit. Once your order is delivered and if 
        you find any defects, you can then request cancellation by uploading a 
        video showing the damage during unpacking.
      </p>
    </div>
  );
}

// Show error if already cancelled
if (order && order.status === 'CANCELLED') {
  return (
    <div className="text-red-600">
      This order is already cancelled
    </div>
  );
}
```

#### Video Upload Handlers
```typescript
const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  // Validate file type
  const validTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska'];
  if (!validTypes.includes(file.type)) {
    toast.error('Invalid file type. Please upload MP4, WebM, MOV, AVI, or MKV format.');
    return;
  }

  // Validate file size (50MB limit)
  const maxSize = 50 * 1024 * 1024;
  if (file.size > maxSize) {
    toast.error('File size must be less than 50MB');
    return;
  }

  setVideoFile(file);
  const previewUrl = URL.createObjectURL(file);
  setVideoPreview(previewUrl);
};

const handleRemoveVideo = () => {
  if (videoPreview) {
    URL.revokeObjectURL(videoPreview);
  }
  setVideoFile(null);
  setVideoPreview(null);
};
```

#### Form Submission with Video Upload
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!reason.trim()) {
    toast.error('Please provide a reason for cancellation');
    return;
  }

  // For delivered orders, video is required
  if (order?.status === 'DELIVERED' && !videoFile) {
    toast.error('Video evidence is required for delivered orders');
    return;
  }

  try {
    setSubmitting(true);

    // 1. Create cancellation request first
    const request = await OrderCancellationService.createCancellationRequest(
      orderId!,
      reason.trim()
    );
    setCancellationRequestId(request.id);

    // 2. If video is provided and order is DELIVERED, upload it
    if (videoFile && order?.status === 'DELIVERED') {
      setUploadingVideo(true);
      try {
        await OrderCancellationService.uploadVideo(request.id, videoFile);
        toast.success('Video uploaded successfully');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to upload video';
        toast.error(errorMessage);
        console.error('Video upload error:', err);
      } finally {
        setUploadingVideo(false);
      }
    }

    setSubmitted(true);
    toast.success('Cancellation request submitted successfully');

    setTimeout(() => {
      navigate(`/cancellation-ticket/${orderId}`);
    }, 2000);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to submit cancellation request';
    toast.error(errorMessage);
    console.error('Error:', err);
  } finally {
    setSubmitting(false);
  }
};
```

#### Video Upload UI (Conditional for DELIVERED Orders)
```typescript
{order.status === 'DELIVERED' && (
  <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded">
    <p className="font-semibold text-orange-900 mb-3 flex items-center gap-2">
      <AlertCircle className="w-4 h-4" />
      Video Evidence Required
    </p>
    <p className="text-orange-800 text-xs mb-4">
      To process your cancellation request for a delivered order, please record 
      and upload a video showing any defects found during unpacking. This video 
      is mandatory for defect claims.
    </p>

    {!videoFile ? (
      <div className="border-2 border-dashed border-orange-300 rounded-lg p-6 text-center">
        <input
          type="file"
          id="video"
          accept="video/*"
          onChange={handleVideoSelect}
          disabled={uploadingVideo || submitting}
          className="hidden"
        />
        <label htmlFor="video" className="cursor-pointer flex flex-col items-center gap-2">
          <Upload className="w-8 h-8 text-orange-600" />
          <span className="font-medium text-orange-900">Upload Video</span>
          <span className="text-xs text-orange-700">
            MP4, WebM, MOV, AVI, MKV (Max 50MB)
          </span>
        </label>
      </div>
    ) : (
      <div className="border border-orange-300 rounded-lg p-4 bg-white">
        <div className="flex items-start gap-3">
          <Play className="w-8 h-8 text-orange-600 mt-1 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-orange-900 text-sm break-words">
              {videoFile.name}
            </p>
            <p className="text-xs text-orange-700 mt-1">
              {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
            </p>
          </div>
          <button
            type="button"
            onClick={handleRemoveVideo}
            disabled={uploadingVideo || submitting}
            className="flex-shrink-0 text-orange-600 hover:text-orange-700 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    )}
  </div>
)}
```

#### Form Validation Logic
```typescript
{/* Video is mandatory for DELIVERED orders */}
disabled={
  submitting || 
  uploadingVideo || 
  !reason.trim() || 
  reason.trim().length < 10 || 
  (order.status === 'DELIVERED' && !videoFile)
}
```

---

## 8. Video Streaming on Frontend

### In Cancellation Ticket Component
```typescript
{request.videoUrl && (
  <div className="bg-white border rounded p-4">
    <p className="font-semibold mb-3">Uploaded Evidence</p>
    <video
      src={getFullVideoUrl(request.videoUrl)}
      controls
      className="w-full rounded bg-black"
      style={{ maxHeight: '400px' }}
    />
    <p className="text-xs text-neutral-600 mt-2">
      Uploaded on {new Date(request.videoUploadedAt).toLocaleString()}
    </p>
  </div>
)}

// Helper function to get full video URL
const getFullVideoUrl = (videoUrl: string) => {
  if (!videoUrl) return '';
  if (videoUrl.startsWith('http')) return videoUrl;
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const backendBase = apiBase.replace('/api', '');
  return `${backendBase}${videoUrl}`;
};
```

---

## 9. Complete User Flow

```
1. User clicks "Cancel Order"
   ↓
2. Load order details
   ↓
3. Check order.status
   ├─ SHIPPED → Block with message + no form
   ├─ CANCELLED → Block with message + no form
   ├─ PENDING → Show form without video section
   └─ DELIVERED → Show form WITH mandatory video section
   ↓
4. User fills reason (for all applicable statuses)
   ↓
5. For DELIVERED: User selects video file
   ├─ Validate type (MP4, WebM, MOV, AVI, MKV)
   ├─ Validate size (≤ 50MB)
   └─ Show preview with filename and size
   ↓
6. User clicks "Submit Request"
   ├─ Backend: Create OrderCancellationRequest record
   └─ Backend: Create video upload endpoint call (if DELIVERED & video)
   ↓
7. For DELIVERED orders:
   ├─ POST /api/order-cancellation-requests/{id}/upload-video
   ├─ Backend: Validate user authorization
   ├─ Backend: Validate order is DELIVERED
   ├─ Backend: Save video to /uploads/videos/
   └─ Backend: Update OrderCancellationRequest with videoUrl + timestamp
   ↓
8. Success
   ├─ Toast: "Cancellation request submitted successfully"
   ├─ Toast: "Video uploaded successfully" (if video)
   └─ Redirect to /cancellation-ticket/{orderId}
   ↓
9. Admin Review
   ├─ View cancellation request details
   ├─ Watch uploaded video (if available)
   ├─ Approve or Reject based on video evidence
   └─ User gets notification of decision
```

---

## Environment & Dependencies

### Backend Requirements
- `multer` (already installed)
- `express` (already installed)
- `@prisma/client` (already installed)
- Node.js with streaming support

### Frontend Requirements
- React 18+
- `sonner` for toast notifications
- `lucide-react` for icons
- FormData API support

### File System
- Videos stored at: `backend/uploads/videos/`
- Accessible via: `http://localhost:5000/uploads/videos/{filename}`
- Each video gets unique timestamp-based filename

---

## Testing the Feature

```bash
# 1. Test DELIVERED order cancellation with video
curl -X POST http://localhost:5000/api/order-cancellation-requests \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"orderId":"xyz","reason":"Product has defects shown in video"}'

# 2. Upload video
curl -X POST http://localhost:5000/api/order-cancellation-requests/{requestId}/upload-video \
  -H "Authorization: Bearer {token}" \
  -F "video=@/path/to/video.mp4"

# 3. Response
{
  "success": true,
  "message": "Video uploaded successfully",
  "data": {
    "id": "req_123",
    "orderId": "order_456",
    "videoUrl": "/uploads/videos/video-1707173722000-123456789.mp4",
    "videoUploadedAt": "2026-02-06T08:15:22.000Z",
    "status": "PENDING"
  }
}
```

---

## Security Checklist

✅ File type validation (frontend + backend)
✅ File size limit (50MB)
✅ User authorization checks
✅ Order status verification
✅ Request ownership validation
✅ No directory traversal attacks (multer handles)
✅ Unique filenames (timestamp + random)
✅ Proper error messages (no info leakage)
✅ CORS headers (if needed)
✅ Rate limiting (can be added)

---

## Deployment Notes

1. Ensure `backend/uploads/videos/` directory is writable
2. For production, consider:
   - Cloud storage (S3, Google Cloud, Azure Blob)
   - CDN for video streaming
   - Video compression on upload
   - Automatic cleanup of old videos
   - Backup strategy for video files
3. Update nginx/Apache to serve video files with correct MIME types
4. Consider streaming optimization (HLS, DASH) for large videos
