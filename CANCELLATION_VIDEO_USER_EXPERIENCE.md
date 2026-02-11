# Order Cancellation Video Feature - User Experience Guide

## What Users Will See

### 1. PENDING Order Cancellation

**Status**: Order placed but not yet shipped

**User sees**:
```
┌─────────────────────────────────────────┐
│  Request Order Cancellation              │
│  Please provide a reason for your        │
│  cancellation request                    │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Order Summary                            │
│  Order ID: ORD-12345                     │
│  Order Date: Feb 1, 2026                 │
│  Items: 1 item                           │
│  Total Amount: ₹1,499                    │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Reason for Cancellation *               │
│  ┌─────────────────────────────────────┐ │
│  │ Please tell us why you want to       │ │
│  │ cancel this order...                 │ │
│  └─────────────────────────────────────┘ │
│  Minimum 10 characters required  25/500 │
└─────────────────────────────────────────┘

NO VIDEO SECTION (because order is not delivered)

┌─────────────────────────────────────────┐
│  ⓘ What happens next?                   │
│  • Your request will be reviewed by      │
│    our team                              │
│  • You can track the status anytime     │
│  • Approval typically takes 1-2 business│
│    days                                  │
│  • Refund will be processed after       │
│    approval                              │
└─────────────────────────────────────────┘

[Cancel]              [Submit Request]
```

---

### 2. SHIPPED Order Cancellation Attempt

**Status**: Order in transit

**User tries to cancel and sees**:
```
┌─────────────────────────────────────────┐
│  ⚠️  Cannot Cancel During Shipment       │
│                                          │
│  Your order is currently in transit.     │
│  Once your order is delivered and if     │
│  you find any defects, you can then      │
│  request cancellation by uploading a     │
│  video showing the damage during         │
│  unpacking.                              │
│                                          │
│                [Back to Orders]          │
└─────────────────────────────────────────┘
```

**No cancellation form shown** ❌
**Cannot proceed** ❌

---

### 3. DELIVERED Order Cancellation (MAIN FEATURE)

**Status**: Order delivered

**User sees**:
```
┌─────────────────────────────────────────┐
│  Request Order Cancellation              │
│  Please provide a reason for your        │
│  cancellation request                    │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Order Summary                            │
│  Order ID: ORD-12345                     │
│  Order Date: Feb 1, 2026                 │
│  Items: 1 item                           │
│  Total Amount: ₹1,499                    │
│  Status: DELIVERED                       │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Reason for Cancellation *               │
│  ┌─────────────────────────────────────┐ │
│  │ Please tell us why you want to       │ │
│  │ cancel this order...                 │ │
│  └─────────────────────────────────────┘ │
│  Minimum 10 characters required  25/500 │
└─────────────────────────────────────────┘

╔═════════════════════════════════════════╗
║ 🎥 VIDEO EVIDENCE REQUIRED               ║
║                                         ║
║ To process your cancellation request    ║
║ for a delivered order, please record    ║
║ and upload a video showing any defects  ║
║ found during unpacking. This video is   ║
║ mandatory for defect claims.            ║
║                                         ║
║ ┌─────────────────────────────────────┐ ║
║ │  📤 Upload Video                    │ ║
║ │  MP4, WebM, MOV, AVI, MKV          │ ║
║ │  (Max 50MB)                         │ ║
║ │                                     │ ║
║ │ (Click to select video)             │ ║
║ └─────────────────────────────────────┘ ║
╚═════════════════════════════════════════╝

OR (after video selected)

╔═════════════════════════════════════════╗
║ 🎥 VIDEO EVIDENCE REQUIRED               ║
║                                         ║
║ To process your cancellation request    ║
║ for a delivered order, please record    ║
║ and upload a video showing any defects  ║
║ found during unpacking. This video is   ║
║ mandatory for defect claims.            ║
║                                         ║
║ ┌─────────────────────────────────────┐ ║
║ │  ▶️  unpacking-video.mp4             │ ║
║ │  12.5 MB                        ✕   │ ║
║ └─────────────────────────────────────┘ ║
╚═════════════════════════════════════════╝

┌─────────────────────────────────────────┐
│  ⓘ What happens next?                   │
│  • Your request will be reviewed by      │
│    our team                              │
│  • Video evidence will be verified      │
│  • You can track the status anytime     │
│  • Approval typically takes 1-2 business│
│    days                                  │
│  • Refund will be processed after       │
│    approval                              │
└─────────────────────────────────────────┘

[Cancel]              [Submit Request]
  (enabled)            (enabled after video)
```

**Video is MANDATORY** ⚠️
**Submit button disabled until video selected** 🔒

---

### 4. CANCELLED Order Cancellation Attempt

**Status**: Already cancelled

**User sees**:
```
┌─────────────────────────────────────────┐
│  ❌ This order is already cancelled     │
│                                          │
│  [Back to Orders]                        │
└─────────────────────────────────────────┘
```

**Cannot proceed** ❌

---

## User Actions for DELIVERED Order

### Step 1: Record Video During Unpacking
```
User unpacks the order and finds defect
    ↓
Uses phone/camera to record unpacking
    ↓
Shows defect clearly in video
    ↓
Has video file (MP4, WebM, MOV, AVI, or MKV)
```

### Step 2: Navigate to Cancellation Page
```
Goes to Account → Orders
    ↓
Clicks "Cancel" on delivered order
    ↓
Sees cancellation form with video section
```

### Step 3: Fill Reason
```
Writes reason for cancellation:
"Product arrived with damaged packaging
 and scratches on the surface as shown
 in the attached video"
    ↓
Minimum 10 characters ✓
```

### Step 4: Select Video File
```
Clicks "Upload Video"
    ↓
Selects video file from device
    ↓
System validates:
  • File type: MP4? ✓
  • File size: < 50MB? ✓
    ↓
Video preview shown with filename and size
```

### Step 5: Submit Request
```
Clicks "Submit Request"
    ↓
Form validation:
  ✓ Reason filled
  ✓ Video selected
  ↓
Request sent to backend
  ↓
Video uploaded to server
  ↓
Both stored with timestamps
  ↓
Success message shown
  ↓
Redirected to cancellation ticket
```

### Step 6: Track Status
```
Navigates to Cancellation Ticket
    ↓
Sees request status: PENDING
    ↓
Sees uploaded video:
  "Uploaded on Feb 5, 2026 at 2:30 PM"
    ↓
Can play video to verify it was uploaded
    ↓
Admin reviews video and makes decision
    ↓
User gets notification: APPROVED or REJECTED
```

---

## Success Toast Messages

### When Cancellation Request Created
```
✓ Cancellation request submitted successfully
```

### When Video Uploaded
```
✓ Video uploaded successfully
```

### When Both Complete
```
Redirected to cancellation ticket page
Shows: "Your request has been submitted"
```

---

## Error Toast Messages

### Invalid Video Format
```
✗ Invalid file type. Please upload MP4, WebM, 
  MOV, AVI, or MKV format.
```

### Video Too Large
```
✗ File size must be less than 50MB
```

### Shipped Order
```
✗ Once delivered and order damaged, then you can cancel
```

### Missing Required Fields
```
✗ Video evidence is required for delivered orders
✗ Reason must be at least 10 characters
```

---

## Order Status Flow Diagram

```
                    ┌─ Delivered
                    │  ├─ Can cancel
                    │  ├─ Video REQUIRED
                    │  └─ Submit → Review
                    │
Order Created → Paid ┼─ Shipped
                    │  ├─ Cannot cancel
                    │  ├─ Must wait for delivery
                    │  └─ Show error message
                    │
                    └─ Cancelled
                       └─ Cannot cancel again
```

---

## Mobile Experience

### Video Upload on Mobile
```
User opens cancellation form on phone
    ↓
Clicks "Upload Video"
    ↓
Mobile file picker opens
    ↓
Options:
  • Record new video
  • Choose from gallery
  • Choose from files
    ↓
Selects video (MP4 from phone camera)
    ↓
Preview shows on form
    ↓
Submits with video
    ↓
Uploads to backend
```

### Responsive Design
- ✅ Form adapts to mobile screen
- ✅ Video section stacks vertically
- ✅ Touch-friendly buttons
- ✅ Upload progress visible
- ✅ Error messages readable

---

## Accessibility Features

- ✓ Clear instructions for video upload
- ✓ Orange highlight for mandatory section
- ✓ Icon + text labels for clarity
- ✓ Error messages in plain language
- ✓ Form validation with helpful feedback
- ✓ Keyboard navigation support
- ✓ Screen reader friendly labels

---

## Timeline Example

```
Feb 1: User places order
Feb 2: Order shipped
Feb 5: Order delivered
    └─ User finds defect in packaging

Feb 5, 2:15 PM: User navigates to cancellation
    └─ Sees video section (only for delivered)

Feb 5, 2:20 PM: User records unpacking video
    └─ Shows damage clearly
    └─ File: "video-1707124800000-987654321.mp4"

Feb 5, 2:25 PM: User submits cancellation with video
    └─ Reason: "Damaged packaging"
    └─ Video: Uploaded successfully
    └─ Status: PENDING

Feb 5, 2:30 PM: Success message
    └─ Redirected to ticket page
    └─ Video visible for playback

Feb 6-7: Admin reviews video
    └─ Watches unpacking video
    └─ Verifies damage claim
    └─ Approves cancellation

Feb 7: User notified of approval
    └─ Order status: CANCELLED
    └─ Refund process started

Feb 9: Refund processed
    └─ Amount returned to account
```

---

## Visual Elements

### Video Upload Section (DELIVERED Orders Only)
```
┌─ Orange background (warning color)
├─ Header: "🎥 VIDEO EVIDENCE REQUIRED"
├─ Description: Explains why video is needed
├─ Upload area:
│  ├─ Icon: 📤 (upload)
│  ├─ Text: "Upload Video"
│  ├─ Supported formats: MP4, WebM, MOV, AVI, MKV
│  └─ File size limit: (Max 50MB)
└─ File preview (after selection):
   ├─ Icon: ▶️ (play)
   ├─ Filename: "unpacking-video.mp4"
   ├─ File size: "12.5 MB"
   └─ Button: ✕ (remove)
```

### Status Messages
```
PENDING order  → No video section (neutral)
SHIPPED order  → Yellow warning block (blocking)
DELIVERED      → Orange video section (mandatory)
CANCELLED      → Red error message (blocking)
```

---

## What Admin Sees

### Cancellation Ticket for DELIVERED Order
```
┌──────────────────────────────────────────┐
│  Cancellation Request Details             │
│  Request ID: REQ-12345                    │
│  Order ID: ORD-67890                      │
│  Status: PENDING                          │
│  Reason: Damaged packaging...             │
│  Video Uploaded: Yes ✓                    │
│  Upload Date: Feb 5, 2026 2:25 PM         │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│  Uploaded Evidence                        │
│  ┌──────────────────────────────────────┐ │
│  │ ▶️ video-1707124800000-123456789.mp4 │ │
│  │ [Video player with controls]         │ │
│  │ Duration: 1:23 | Size: 12.5 MB      │ │
│  └──────────────────────────────────────┘ │
│  Uploaded on Feb 5, 2026 at 2:25 PM      │
└──────────────────────────────────────────┘

[Watch Video]  [Approve]  [Reject]
```

---

## Conclusion

The video upload feature provides:

✅ **Clear blocking** for orders in shipment
✅ **Mandatory requirement** for delivered orders
✅ **Easy upload** with validation
✅ **Transparent process** with clear messaging
✅ **Quality control** through video evidence
✅ **Mobile friendly** experience
✅ **Accessible** to all users

Users now know exactly what's needed and when to upload video evidence for their cancellation requests!
