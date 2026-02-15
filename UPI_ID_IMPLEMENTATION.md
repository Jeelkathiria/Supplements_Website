# Order Cancellation - UPI ID Implementation

## Status: ✅ COMPLETED

This document outlines the implementation of UPI ID collection and storage for order cancellation requests, particularly for delivered orders requiring refunds.

---

## Overview

When a user requests cancellation for a **DELIVERED order**, they now must provide their **UPI ID** for refund processing. This UPI ID is:
- ✅ Compulsory for delivered orders
- ✅ Validated for correct format (username@bankname)
- ✅ Stored in OrderCancellationRequest table
- ✅ Transferred to OrderRefund table when refund is created
- ✅ Displayed in Admin panels for reference

---

## Database Changes

### 1. OrderCancellationRequest Table
**Field Added**: `upiId` (optional TEXT)

```prisma
model OrderCancellationRequest {
  // ... existing fields
  
  // UPI ID for refunds (required for delivered orders requesting cancellation)
  upiId     String?                   // UPI ID for refund processing
  
  // ... rest of model
}
```

**Migration**: `20260213_add_upi_id_to_cancellation_request`

### 2. OrderRefund Table
**Field Added**: `upiId` (optional TEXT)

```prisma
model OrderRefund {
  // ... existing fields
  
  upiId     String?       // UPI ID where refund should be processed
  
  // ... rest of model
}
```

**Migration**: `20260213_add_upi_id_to_refund`

---

## Frontend Changes

### 1. RequestCancellation.tsx (User Form)

**New State Added**:
```typescript
const [upiId, setUpiId] = useState('');
```

**UPI ID Field** (only shown for DELIVERED orders):
- Input field with placeholder: "e.g., yourname@upi or yourname@paytm"
- Format help text: "Format: username@bankname (e.g., john@upi, jane@paytm)"
- Green styling to indicate importance for refunds
- Compulsory validation with regex: `/^[a-zA-Z0-9._-]+@[a-zA-Z]{3,}$/`

**Validation Rules**:
```typescript
// For DELIVERED orders:
if (!upiId.trim()) {
  toast.error('UPI ID is required for refund processing');
  return;
}

// UPI format validation
const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z]{3,}$/;
if (!upiRegex.test(upiId.trim())) {
  toast.error('Please enter a valid UPI ID (e.g., yourname@upi)');
  return;
}
```

**Submit Button Logic**:
- Disabled if DELIVERED order lacks UPI ID
- Updated validation: `!upiId.trim()` for delivered orders

### 2. OrderCancellationService.ts
**Interface Updated**:
```typescript
export interface OrderCancellationRequest {
  // ... existing fields
  upiId?: string;
}
```

**Method Updated**:
```typescript
static async createCancellationRequest(
  orderId: string,
  reason: string,
  upiId?: string  // New parameter
): Promise<OrderCancellationRequest>
```

**Request Body**:
```typescript
body: JSON.stringify({
  orderId,
  reason,
  ...(upiId && { upiId }), // Only include if provided
})
```

---

## Backend Changes

### 1. OrderCancellationController.ts

**Updated createRequest Method**:
```typescript
static async createRequest(req: Request, res: Response) {
  const { orderId, reason, upiId } = req.body; // Added upiId
  
  // ... validation ...
  
  const request = await OrderCancellationService.createCancellationRequest(
    orderId,
    userId,
    trimmedReason,
    upiId  // Pass to service
  );
}
```

### 2. OrderCancellationService.ts

**Updated createCancellationRequest Method**:
```typescript
static async createCancellationRequest(
  orderId: string,
  userId: string,
  reason: string,
  upiId?: string  // New parameter
)
```

**Database Storage**:
```typescript
const request = await prisma.orderCancellationRequest.create({
  data: {
    orderId,
    userId,
    reason,
    ...(upiId && { upiId }), // Store if provided
  },
  include: { order: true }
});
```

**Updated approveCancellationRequest Method**:
```typescript
// When creating refund, pass UPI ID from request
await refundService.createRefundForApprovedCancellation(
  request.orderId,
  request.reason,
  request.upiId  // Pass stored UPI ID
);
```

### 3. RefundService.ts

**Updated createRefundForApprovedCancellation Method**:
```typescript
export const createRefundForApprovedCancellation = async (
  orderId: string,
  reason: string,
  upiId?: string  // New parameter
)
```

**Store in Refund Record**:
```typescript
const refund = await prisma.orderRefund.create({
  data: {
    orderId,
    refundAmount: order.totalAmount,
    reason,
    status: RefundStatus.INITIATED,
    ...(upiId && { upiId }), // Store UPI ID
  }
});
```

**Logging**:
```typescript
console.log("✅ Refund created successfully:", refund.id, "for UPI:", upiId);
```

---

## Admin Panel Updates

### 1. AdminCancellationRequests.tsx

**Display UPI ID in Modal**:
```tsx
{selectedRequest.upiId && (
  <div className="col-span-2">
    <span className="text-neutral-600">UPI ID (For Refund):</span>
    <p className="font-mono font-semibold text-neutral-900 p-2 bg-green-50 rounded mt-1">
      {selectedRequest.upiId}
    </p>
  </div>
)}
```

Where it appears: Cancellation Request Details modal

### 2. AdminRefundStatus.tsx

**Updated Refund Interface**:
```typescript
interface Refund {
  // ... existing fields
  upiId?: string;
}
```

**Table Column Added**: "UPI ID"

**Display Format**:
- If UPI ID exists: Green badge with monospace font
- If not provided: Gray italic text "Not provided"

**Table Headers**: Added between "Refund Amount" and "Reason"

**Row Display**:
```tsx
<td className="px-6 py-4 text-sm font-mono text-neutral-700">
  {refund.upiId ? (
    <span className="inline-block px-2 py-1 bg-green-50 text-green-800 rounded text-xs font-medium">
      {refund.upiId}
    </span>
  ) : (
    <span className="text-neutral-400 text-xs italic">Not provided</span>
  )}
</td>
```

---

## User Workflow

### For DELIVERED Orders:

```
1. User opens "Request Cancellation" for DELIVERED order
   ↓
2. Form shows:
   - Reason textarea (required, 10+ chars)
   - UPI ID input (REQUIRED, with validation)
   - Video upload (REQUIRED)
   ↓
3. User fills:
   - Reason: "Bottle was broken during delivery..."
   - UPI ID: "yourname@upi" or "yourname@paytm"
   - Video: Uploads video showing defect
   ↓
4. UPI ID is stored in OrderCancellationRequest.upiId
   ↓
5. Admin reviews and approves
   ↓
6. UPI ID is transferred to OrderRefund.upiId
   ↓
7. Refund is marked as INITIATED with UPI destination
   ↓
8. Admin marks refund as REFUND_COMPLETED
   ↓
9. Finance team processes refund to stored UPI ID
```

### For PENDING/SHIPPED Orders:

```
No UPI ID input shown (payment not yet collected)
```

---

## Files Modified

### Frontend
- ✅ `frontend/src/app/pages/RquesTCancellation.tsx` - User form
- ✅ `frontend/src/services/orderCancellationService.ts` - Frontend service
- ✅ `frontend/src/app/components/AdminCancellationRequests.tsx` - Admin view
- ✅ `frontend/src/app/components/AdminRefundStatus.tsx` - Refund tracking

### Backend
- ✅ `backend/prisma/schema.prisma` - Database schema
- ✅ `backend/src/controllers/orderCancellationController.ts` - API controller
- ✅ `backend/src/services/orderCancellationService.ts` - Core service
- ✅ `backend/src/services/refundService.ts` - Refund service

### Migrations
- ✅ `backend/prisma/migrations/20260213_add_upi_id_to_cancellation_request/migration.sql`
- ✅ `backend/prisma/migrations/20260213_add_upi_id_to_refund/migration.sql`

---

## Testing Checklist

### Form Validation
- [ ] Non-delivered orders: No UPI ID field shown
- [ ] Delivered order: UPI ID field visible and compulsory
- [ ] Submit disabled if UPI ID empty
- [ ] Submit disabled if UPI ID format invalid
- [ ] Valid formats accepted: "john@upi", "jane@paytm", "user@okhdfcbank"

### Data Storage
- [ ] UPI ID stored in OrderCancellationRequest
- [ ] UPI ID accessible in cancellation request queries
- [ ] UPI ID transferred to OrderRefund on approval

### Admin View - Cancellations
- [ ] UPI ID displays in cancellation request details modal
- [ ] Shows in green badge with monospace font
- [ ] Correct UPI ID value displayed

### Admin View - Refunds
- [ ] UPI ID column shows in refund table
- [ ] Shows green badge if present
- [ ] Shows "Not provided" in italic gray if missing
- [ ] UPI ID visible when marking refund as complete

### End-to-End Flow
- [ ] Create DELIVERED order with UPI payment
- [ ] Request cancellation with UPI ID
- [ ] Admin approves
- [ ] UPI ID visible in refund record
- [ ] Admin marks refund complete with UPI destination visible

---

## Data Privacy & Security

⚠️ **Important Notes**:
- UPI IDs are stored in plaintext in database
- For production, consider:
  - Encryption at rest for sensitive fields
  - Audit logging for UPI ID access
  - Restricted admin access to UPI ID viewing
  - Data retention policies

---

## Future Enhancements

- [ ] Automatic refund processing integration
- [ ] UPI ID masking in logs (show only last 4 chars)
- [ ] Email verification of UPI ID before submission
- [ ] Support for multiple refund destinations
- [ ] Refund status tracking per UPI account
- [ ] Failed refund retry mechanism

---

## Status Timeline

- **2026-02-13**: Implementation completed
  - Database migrations created
  - Frontend form with UPI ID validation
  - Backend API updated
  - Admin views enhanced
  - All integration points completed

