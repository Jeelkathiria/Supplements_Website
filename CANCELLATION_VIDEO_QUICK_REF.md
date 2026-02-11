# Order Cancellation Video Feature - Quick Reference

## Feature Summary

Users can now cancel orders with conditional video upload based on delivery status:

| Order Status | Action | Requirement |
|---|---|---|
| PENDING | ✅ Allow cancellation | Reason only |
| SHIPPED | ❌ Block cancellation | Show: "Once delivered and order damaged, then you can cancel" |
| DELIVERED | ✅ Allow cancellation | Reason + **Video mandatory** |
| CANCELLED | ❌ Block cancellation | Already cancelled |

## Key Implementation Points

### 1. **Video Upload Restrictions** (Backend)
- Only for DELIVERED orders
- Validates user owns the request
- Validates order is DELIVERED before allowing upload
- Max 50MB file size
- Supported formats: MP4, WebM, MOV, AVI, MKV

### 2. **Frontend UI Changes**
```tsx
// Video upload section only visible for DELIVERED orders
{order.status === 'DELIVERED' && (
  <div>... video upload UI ...</div>
)}

// Cannot cancel during shipment
if (order.status === 'SHIPPED') {
  // Show error message and prevent form
}

// Mandatory video for delivered orders
disabled={
  submitting || 
  !reason.trim() || 
  (order.status === 'DELIVERED' && !videoFile)  // ← Video required
}
```

### 3. **Database Changes**
```typescript
model OrderCancellationRequest {
  // ... existing fields ...
  videoUrl?: string         // NEW: URL to uploaded video
  videoUploadedAt?: DateTime // NEW: Timestamp of upload
}
```

### 4. **API Endpoints**

**New endpoint for video upload:**
```
POST /api/order-cancellation-requests/{requestId}/upload-video
Content-Type: multipart/form-data
Authorization: Bearer <token>

FormData:
- video: File
```

## Testing Guide

### Test Case 1: Pending Order
```
✅ Can submit cancellation without video
✅ Form shows "Reason for Cancellation" field only
✅ No video section displayed
```

### Test Case 2: Shipped Order
```
❌ Cannot click on cancellation page
❌ Shows yellow warning message
❌ Message: "Once delivered and order damaged, then you can cancel"
❌ Back button available to return to orders
```

### Test Case 3: Delivered Order (Main Feature)
```
✅ Form shows "Reason for Cancellation" field
✅ MANDATORY video section displays with orange highlight
✅ Shows: "Video Evidence Required"
✅ Video upload area with instructions
✅ Shows: "MP4, WebM, MOV, AVI, MKV (Max 50MB)"
✅ Can select video file
✅ Shows file name and size after selection
✅ Submit button disabled until video selected
✅ Video uploads with request submission
✅ Success message shows "Video uploaded successfully"
```

### Test Case 4: Cancelled Order
```
❌ Cannot access cancellation page
❌ Shows: "This order is already cancelled"
```

## File Locations

### Frontend
- **Form component**: `frontend/src/app/pages/RequestCancellation.tsx`
  - State variables: `videoFile`, `videoPreview`, `uploadingVideo`, `cancellationRequestId`
  - Functions: `handleVideoSelect()`, `handleRemoveVideo()`, `handleSubmit()`
  - UI: Video upload section with conditional rendering

- **Service**: `frontend/src/services/orderCancellationService.ts`
  - New method: `uploadVideo(requestId, videoFile)`
  - Interface updated with `videoUrl?` and `videoUploadedAt?`

### Backend
- **Video middleware**: `backend/src/middlewares/videoUpload.ts`
  - Multer configuration for videos
  - 50MB limit, supported formats validation
  - Destination: `uploads/videos/`

- **Routes**: `backend/src/routes/orderCancellationRoutes.ts`
  - New route: `POST /:requestId/upload-video`
  - Uses `videoUpload.single("video")` middleware

- **Controller**: `backend/src/controllers/orderCancellationController.ts`
  - New method: `uploadVideo(req, res)`
  - Handles multipart form data

- **Service**: `backend/src/services/orderCancellationService.ts`
  - New method: `uploadVideo(requestId, userId, videoUrl)`
  - Validates request ownership
  - Ensures order is DELIVERED
  - Updates DB with video URL and timestamp

- **Database**: `backend/prisma/schema.prisma`
  - New fields in `OrderCancellationRequest`:
    - `videoUrl?: String`
    - `videoUploadedAt?: DateTime`
  - Migration: `20260205172701_add_video_to_cancellation_request`

## Error Messages

### User-Friendly Errors
- "Invalid file type. Please upload MP4, WebM, MOV, AVI, or MKV format."
- "File size must be less than 50MB"
- "Video is required for delivered orders"
- "Once delivered and order damaged, then you can cancel"

### Validation Errors
- Missing reason (< 10 characters)
- Missing video for delivered orders
- Unauthorized user trying to upload for others' orders
- Non-DELIVERED order trying to upload video

## Integration Flow

```
User Navigation
    ↓
/request-cancellation/:orderId
    ↓
Load Order Details
    ↓
Check Order Status
    ├→ SHIPPED: Show block message
    ├→ CANCELLED: Show already cancelled
    ├→ PENDING: Show form without video
    └→ DELIVERED: Show form WITH video (mandatory)
    ↓
User Fills Form + Selects Video (if DELIVERED)
    ↓
Submit Cancellation Request
    ├→ Create request via API
    ├→ Upload video (if DELIVERED & video selected)
    └→ Success toast notification
    ↓
Redirect to /cancellation-ticket/:orderId
    ↓
User can view status and video (if uploaded)
```

## Admin Features (Future)

- [ ] View video from cancellation ticket
- [ ] Verify defect claims based on video
- [ ] Auto-reject if no valid defect shown
- [ ] AI detection of defects in video
- [ ] Add notes/comments to video review

## Performance Notes

- Videos stored locally in `backend/uploads/videos/`
- File served via static route: `/uploads/videos/filename`
- For production: Consider cloud storage (S3, etc.)
- Compression strategy: Upload as-is (can add later)
- Cleanup: Manual (can add auto-cleanup for rejected requests)

## Browser Compatibility

- Modern browsers supporting:
  - File Upload API
  - FormData API
  - Multipart form data
  - Video element (for playback)

## Mobile Considerations

- ✅ Responsive video upload UI
- ✅ Works on mobile file pickers
- ✅ Mobile video recording compatible (MP4)
- ⚠️ Large files may slow on mobile (50MB limit helps)
