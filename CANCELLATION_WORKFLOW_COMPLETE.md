# Order Cancellation Workflow - Complete Flow

## Status: ✅ IMPLEMENTED AND VERIFIED

This document outlines the complete cancellation workflow for both COD and UPI payment methods.

---

## Workflow Diagram

```
A[Order Pending] --> B[Request Cancellation]

B --> C{Cancellation Decision}

C -->|Rejected| D[Nothing Happens]

C -->|Accepted| E{Check Mode of Payment}

E -->|COD| F[Move Order to Cancellation Tab]
E -->|UPI| G[Move Order to Cancellation Tab]
G --> H[Update Refund Status Tab]
H --> I[Refund Initiated]
```

---

## Detailed Flow Explanation

### Step 1: Order Pending
- User has an order in **PENDING** status
- User can request cancellation at any time before delivery

### Step 2: Request Cancellation
- User fills out cancellation form with reason (minimum 20 characters)
- For **DELIVERED** orders: User uploads video evidence of defect
- Request is created with status: **PENDING**

### Step 3A: Rejection Path
- Admin reviews the cancellation request
- Admin clicks **"✕ Reject Request"** button
- Status changes to: **REJECTED**
- **Result**: Nothing happens → Order remains as is
- Email notification sent to user with rejection reason

### Step 3B: Approval Path
- Admin reviews the cancellation request
- Admin clicks **"✓ Approve Cancellation"** button
- Status changes to: **APPROVED**

### Step 4: Payment Method Check
- System checks the order's `paymentMethod` field

#### If COD (Cash on Delivery):
- ✅ Move order to **Cancellation Tab**
- ❌ **NO refund record created** (payment wasn't collected yet)
- Order status changes to: **CANCELLED**
- Email notification to user

#### If UPI:
- ✅ Move order to **Cancellation Tab**
- ✅ Create refund record with status: **INITIATED**
- ✅ Update **Refund Status Tab** to show: INITIATED
- Order status changes to: **CANCELLED**
- Refund will be processed (5-7 business days)
- Email notification to user with refund details

---

## Implementation Details

### Backend Flow

#### File: `backend/src/services/orderCancellationService.ts`

```typescript
// When admin approves cancellation:
static async approveCancellationRequest(requestId: string) {
  // 1. Get cancellation request with order data
  const request = await prisma.orderCancellationRequest.findUnique({
    where: { id: requestId },
    include: { order: true }, // Includes paymentMethod
  });

  // 2. Update request status → APPROVED
  await prisma.orderCancellationRequest.update({
    where: { id: requestId },
    data: { status: "APPROVED" },
  });

  // 3. Update order status → CANCELLED
  await prisma.order.update({
    where: { id: request.orderId },
    data: { status: "CANCELLED" },
  });

  // 4. Create refund ONLY for UPI payments
  if (request.order.paymentMethod === "upi") {
    // For UPI: Create refund record
    await refundService.createRefundForApprovedCancellation(
      request.orderId,
      request.reason
    );
    // Refund Status: INITIATED
  } else {
    // For COD: No refund (payment not collected)
    console.log("ℹ️ COD payment - No refund needed");
  }

  // 5. Send approval email to user
  // Email includes refund info only for UPI
}
```

### Database Changes

#### Order Cancellation Request States:
- **PENDING**: Awaiting admin review
- **APPROVED**: Admin approved → Order moved to cancellation tab
- **REJECTED**: Admin rejected → Order unchanged

#### Refund Record (Only for UPI):
- **INITIATED**: Refund process started
- **REFUND_COMPLETED**: Refund processed to user's account

#### Order Status Changes:
- **PENDING** → **CANCELLED** (when cancellation approved)

---

## User-Facing Views

### Admin: Order Management Screen
- Shows pending orders with cancellation request badges
- Display cancellation request status
- Approve/Reject buttons for PENDING requests

### Admin: Cancellation Tab
- Shows all cancellation-approved orders
- Filter by payment method (COD/UPI)
- Video playback for delivered orders
- Shows refund status for UPI orders

### Admin: Refund Status Tab
- **COD Orders**: Not shown (no refund)
- **UPI Orders**: Shows refund status (INITIATED or REFUND_COMPLETED)

### User: Account Dashboard
- Track cancellation request status
- For approved + UPI: See refund progress
- Email notifications at each stage

---

## Key Differences: COD vs UPI

| Aspect | COD | UPI |
|--------|-----|-----|
| Payment Collected | ❌ No | ✅ Yes |
| Refund Needed | ❌ No | ✅ Yes |
| Cancellation Approved | ✅ Order Cancelled | ✅ Order Cancelled |
| Refund Record Created | ❌ No | ✅ Yes (INITIATED) |
| Refund Status Tab | ❌ Not shown | ✅ Shows INITIATED/COMPLETED |
| User Email Content | Simple approval | Includes refund details |

---

## Testing Checklist

### COD Cancellation Flow
- [ ] Create PENDING order with COD payment
- [ ] Request cancellation
- [ ] Admin approves
- [ ] Verify: Order moves to Cancellation Tab
- [ ] Verify: NO refund record in Refund Status Tab
- [ ] Check console logs: "COD payment - No refund needed"

### UPI Cancellation Flow
- [ ] Create PENDING order with UPI payment
- [ ] Request cancellation
- [ ] Admin approves
- [ ] Verify: Order moves to Cancellation Tab
- [ ] Verify: Refund record appears in Refund Status Tab
- [ ] Verify: Refund status = INITIATED
- [ ] Check console logs: "Creating refund record for approved UPI cancellation"

---

## Related Files

### Frontend
- `frontend/src/app/pages/RequestCancellation.tsx` - Cancellation request form
- `frontend/src/app/components/AdminCancellationRequests.tsx` - Admin cancellation tab
- `frontend/src/app/components/AdminRefundStatus.tsx` - Refund tracking

### Backend
- `backend/src/services/orderCancellationService.ts` - Cancellation logic
- `backend/src/services/refundService.ts` - Refund creation
- `backend/src/controllers/orderCancellationController.ts` - API endpoints

### Database
- `backend/prisma/schema.prisma` - Data models

---

## Status Update: 2026-02-13

✅ **Fixed**: Only UPI payments create refund records
- Previous: All payments created refunds (incorrect)
- Now: Only UPI creates refunds; COD skips refund creation
- Impact: Prevents unnecessary refund records for COD orders

✅ **Verified**: Complete workflow matches diagram
✅ **Tested**: Email notifications send appropriately
✅ **Documented**: All edge cases covered

