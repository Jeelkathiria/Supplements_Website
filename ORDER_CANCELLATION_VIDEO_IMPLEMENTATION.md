# Order Cancellation with Video Evidence Implementation

## Overview
Implemented a complete order cancellation system with video evidence requirement for delivered orders. This ensures quality control and prevents fraudulent cancellation claims.

## Features Implemented

### 1. **Order Status-Based Cancellation Rules**
- ✅ **PENDING orders**: Can be cancelled immediately
- ✅ **SHIPPED orders**: Cannot cancel during transit - shows user-friendly message
- ✅ **DELIVERED orders**: Can cancel only with video evidence of defects
- ✅ **CANCELLED orders**: Cannot be cancelled again

### 2. **Video Upload System**
- **Visible only for DELIVERED orders** - Conditional rendering based on order status
- **Video requirements**:
  - Formats supported: MP4, WebM, MOV, AVI, MKV
  - Max file size: 50MB
  - Required for delivered orders (mandatory field)
- **Video storage**:
  - Stored locally in `/uploads/videos/` directory
  - Can be extended to cloud storage (S3, etc.)
  - Video URL and metadata stored in database
  - Timestamp recorded when video is uploaded

### 3. **Database Schema Updates**
Added to `OrderCancellationRequest` model:
```typescript
videoUrl?: string          // URL to video
videoUploadedAt?: DateTime // When video was uploaded
```

### 4. **Backend Implementation**

#### New Middleware
- **videoUpload.ts**: Multer configuration for video file handling
  - File type validation
  - Size limit enforcement
  - Unique filename generation

#### New Endpoint
- **POST** `/order-cancellation-requests/:requestId/upload-video`
  - Requires authentication
  - Validates order status is DELIVERED
  - Stores video and updates database
  - Returns updated cancellation request

#### Service Updates
- **OrderCancellationService.uploadVideo()**:
  - Validates request ownership
  - Ensures order is DELIVERED
  - Updates video URL and timestamp
  - Throws appropriate errors for invalid states

#### Controller Updates
- **OrderCancellationController.uploadVideo()**:
  - Handles multipart form data
  - Manages file upload errors
  - Returns proper HTTP responses

### 5. **Frontend Implementation**

#### New UI Components in RequestCancellation.tsx
- **Status-based message display**:
  - For SHIPPED orders: "Cannot Cancel During Shipment" with helpful message
  - For CANCELLED orders: "This order is already cancelled"
  
- **Video upload section** (visible only for DELIVERED orders):
  - Drag-and-drop file input UI
  - File type and size validation
  - Video preview with filename and size
  - Remove button to change video selection
  - Mandatory field indicator with explanatory text

- **Form validation**:
  - Reason must be at least 10 characters
  - For DELIVERED orders: video is mandatory
  - Submit button disabled until all requirements met

#### Updated Service
- **OrderCancellationService.uploadVideo()**:
  - Takes request ID and video file
  - Sends multipart form data
  - Returns updated cancellation request

## Flow Diagram

```
User Initiates Cancellation
        ↓
Load Order Status
        ↓
┌─ PENDING ─→ Show Cancellation Form (no video)
│
├─ SHIPPED ─→ Show "Cannot Cancel During Shipment" Message
│
├─ DELIVERED ─→ Show Cancellation Form WITH Video Upload (mandatory)
│
└─ CANCELLED ─→ Show "Already Cancelled" Message
        ↓
    (If DELIVERED & video selected)
User submits Reason + Video
        ↓
Create Cancellation Request
        ↓
Upload Video to Server
        ↓
Store Video URL + Metadata in DB
        ↓
Redirect to Cancellation Ticket
        ↓
Frontend: Stream video via URL
```

## Files Modified

### Backend
1. **prisma/schema.prisma** - Added video fields
2. **prisma/migrations/** - New migration created
3. **src/middlewares/videoUpload.ts** - New video upload middleware
4. **src/routes/orderCancellationRoutes.ts** - Added video upload route
5. **src/controllers/orderCancellationController.ts** - Added uploadVideo method
6. **src/services/orderCancellationService.ts** - Added uploadVideo service method

### Frontend
1. **frontend/src/app/pages/RequestCancellation.tsx** - Complete form redesign with:
   - Status-based conditional rendering
   - Video upload UI
   - Validation logic
   - Error handling
   - Loading states

2. **frontend/src/services/orderCancellationService.ts** - Added:
   - videoUrl and videoUploadedAt to interface
   - uploadVideo() method

## Error Handling

### Frontend Validations
- Invalid file type
- File size exceeds 50MB
- Missing required fields
- Network errors during upload

### Backend Validations
- User authorization (request ownership)
- Order status verification
- Request existence check
- File integrity

## API Endpoints

### Video Upload
```
POST /api/order-cancellation-requests/:requestId/upload-video
Authorization: Required (Bearer token)
Content-Type: multipart/form-data

Body:
- video: File (required)

Response:
{
  "success": true,
  "message": "Video uploaded successfully",
  "data": {
    "id": "...",
    "videoUrl": "/uploads/videos/...",
    "videoUploadedAt": "2026-02-05T...",
    ...
  }
}
```

## User Experience

1. **User navigates to cancellation page** - Form loads with order details
2. **System checks order status**:
   - If SHIPPED: Display error message "Once delivered and order damaged, then you can cancel"
   - If DELIVERED: Show video upload section (mandatory)
   - If PENDING: Show cancellation form without video
3. **For delivered orders**:
   - User provides cancellation reason
   - User uploads unpacking video showing defect
   - System validates all inputs
   - Video uploaded to server
   - Request submitted with video evidence
4. **Admin review**: Can view video from cancellation ticket to verify defect claim

## Security Considerations

- ✅ File type validation on frontend and backend
- ✅ File size limits (50MB max)
- ✅ User authorization checks
- ✅ Order status validation
- ✅ Video stored separately from user uploads
- ✅ Proper error messages (no sensitive info leaked)

## Future Enhancements

1. Cloud storage integration (AWS S3, Google Cloud Storage)
2. Video streaming optimization (HLS, DASH)
3. AI-based defect detection from videos
4. Video compression on upload
5. Automatic cleanup of rejected request videos
6. Video playback with admin annotations
7. Return shipping integration based on video verification

## Testing Checklist

- [ ] PENDING order can be cancelled without video
- [ ] SHIPPED order shows error message
- [ ] DELIVERED order requires video
- [ ] Video validation works (type, size)
- [ ] Video upload completes successfully
- [ ] Video URL stored in database
- [ ] Admin can view video from cancellation ticket
- [ ] Unauthorized user cannot upload video for others' orders
- [ ] Video persists after page refresh
- [ ] Multiple videos can be uploaded to different requests
