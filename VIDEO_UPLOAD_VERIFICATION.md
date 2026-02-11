# Video Upload Verification Guide

## Overview
This guide helps diagnose why videos might not be appearing in the admin panel for cancellation requests.

## Component Integration ✅ VERIFIED

### Frontend Components
- **AdminLayout.tsx**: Sidebar navigation with "Cancellations" menu item added ✅
- **Admin.tsx**: Main admin page with "cancellations" tab support ✅  
- **AdminCancellationRequests.tsx**: Video display component with `getFullVideoUrl()` helper ✅

### Backend Components  
- **Database Schema**: `OrderCancellationRequest` includes `videoUrl` and `videoUploadedAt` fields ✅
- **Middleware**: Multer configured for `/uploads/videos/` with 50MB limit ✅
- **Controller**: `uploadVideo()` creates path as `/uploads/videos/${filename}` ✅
- **Service**: `uploadVideo()` updates DB with videoUrl and timestamp ✅
- **Routes**: POST `/order-cancellation-requests/:requestId/upload-video` configured ✅
- **Static Serving**: Express serves `/uploads` directory as static files ✅

## Step-by-Step Verification

### Step 1: Verify Directory Exists and Has Write Permissions
```bash
# Check if uploads directory exists and has correct permissions
ls -la /uploads/
ls -la /uploads/videos/

# On Windows (if running in WSL or similar):
dir C:\path\to\project\uploads
dir C:\path\to\project\uploads\videos
```

**Expected**: `/uploads/videos/` directory should exist with read/write permissions

---

### Step 2: Create a Test Cancellation Request
1. Go to customer account and place an order
2. Wait for order status to change to "DELIVERED"
3. Request cancellation with reason (minimum 20 characters)
4. You should see the cancellation request appear in Admin > Cancellations tab

---

### Step 3: Upload a Test Video
1. In Admin panel, go to Cancellations tab
2. Find your test cancellation request
3. Click the request to open details/modal
4. Upload a video file (MP4, WebM, MOV, AVI, or MKV)
5. Observe the upload process

**Check Browser Developer Tools** (F12):
- Network tab: Look for POST to `/api/order-cancellation-requests/{id}/upload-video`
- Should see 200 response with updated request data
- Response should include `videoUrl: "/uploads/videos/..."` field

---

### Step 4: Verify Database Record
```sql
-- Connect to your PostgreSQL database
SELECT 
  id,
  "orderId",
  "userId",
  status,
  "videoUrl",
  "videoUploadedAt",
  "createdAt"
FROM "OrderCancellationRequest"
WHERE "videoUrl" IS NOT NULL
ORDER BY "createdAt" DESC
LIMIT 5;
```

**Expected**: Rows should appear with populated `videoUrl` field like `/uploads/videos/1234567-video.mp4`

---

### Step 5: Verify Files Exist on Server
After uploading, check the filesystem:

```bash
# List files in uploads/videos directory
ls -lah /uploads/videos/

# Check file size
ls -lh /uploads/videos/*.mp4

# Try to read file headers (should show video data, not empty)
head -c 100 /uploads/videos/[filename].mp4 | od -c
```

**Expected**: Video files should exist with proper file size (not 0 bytes)

---

### Step 6: Test Static File Serving
In browser, navigate directly to the video:
```
http://localhost:3000/uploads/videos/[actual-filename-from-db]
```

**Expected**: Browser should start playing or offer to download the video file

---

### Step 7: Check Admin Page Video Display
1. Go to Admin > Cancellations tab
2. Find request with video
3. Click to view request details
4. Video player should appear with controls

**Check Browser Console** (F12):
- Look for any JavaScript errors
- Check that `getFullVideoUrl()` is being called
- Verify the constructed URL is correct

---

## Common Issues & Solutions

### Issue: Directory doesn't exist
```bash
# Create the directory
mkdir -p /uploads/videos
chmod 755 /uploads/videos
```

### Issue: File uploaded but video.txt shows "Uploading..." forever
- Check browser Network tab for failed requests
- Check backend logs for upload errors
- Verify file size doesn't exceed 50MB limit

### Issue: Database shows videoUrl but admin page shows no video
- Verify `getFullVideoUrl()` is constructing correct URLs
- Test direct URL navigation (Step 6)
- Check browser console for 404 or CORS errors

### Issue: Video URL in database but not in API response
- Verify `getAllRequests()` method returns all fields (it does ✅)
- Check that API response includes the video data:
  ```
  GET /api/order-cancellation-requests?status=PENDING
  ```
  Response should include `videoUrl` field

---

## Database Query Helper

### View all cancellation requests with video status:
```sql
SELECT 
  id,
  "orderId",
  reason,
  status,
  CASE 
    WHEN "videoUrl" IS NOT NULL THEN 'Has Video'
    ELSE 'No Video'
  END as video_status,
  "videoUrl",
  "videoUploadedAt"
FROM "OrderCancellationRequest"
ORDER BY "createdAt" DESC;
```

### Count statistics:
```sql
SELECT 
  status,
  COUNT(*) as total,
  COUNT(CASE WHEN "videoUrl" IS NOT NULL THEN 1 END) as with_video
FROM "OrderCancellationRequest"
GROUP BY status;
```

---

## API Endpoints Reference

### List all cancellation requests:
```
GET /api/order-cancellation-requests?status=PENDING
```

### Upload video to request:
```
POST /api/order-cancellation-requests/:requestId/upload-video
Content-Type: multipart/form-data

Body:
- video: [file]
```

### Expected success response (200):
```json
{
  "id": "abc123",
  "orderId": "order456",
  "userId": "user789",
  "reason": "...",
  "status": "PENDING",
  "videoUrl": "/uploads/videos/1673456789-randomhash.mp4",
  "videoUploadedAt": "2024-01-20T12:30:45Z",
  "createdAt": "2024-01-20T12:15:00Z",
  "order": { ... }
}
```

---

## Quick Checklist

- [ ] Directory `/uploads/videos/` exists with write permissions
- [ ] Admin sidebar shows "Cancellations" menu item
- [ ] Admin page has "Cancellations" tab
- [ ] Can create a test cancellation request
- [ ] Upload POST request succeeds (HTTP 200)
- [ ] Database record has `videoUrl` populated
- [ ] Files exist in `/uploads/videos/` directory
- [ ] Direct URL to video works in browser
- [ ] Video player appears on Admin > Cancellations page
- [ ] getAllRequests API returns video data

---

## Debugging Tips

1. **Check Backend Logs**: Look for any errors during upload:
   ```
   npm run dev  # or your dev command
   # Watch console for error messages
   ```

2. **Network Inspector**: 
   - F12 > Network tab
   - Filter by "Fetch/XHR"
   - Look for upload-video request
   - Check response body for videoUrl

3. **Database Direct Check**:
   - Connect with pgAdmin or similar tool
   - Query OrderCancellationRequest table
   - Verify videoUrl field has data

4. **File Permissions**:
   - Ensure Node process has write access to `/uploads/videos/`
   - Check directory ownership: `ls -la /uploads/`

5. **MIME Type Issues**:
   - Verify video file format is one of: MP4, WebM, MOV, AVI, MKV
   - Middleware filters these types - others will be rejected
