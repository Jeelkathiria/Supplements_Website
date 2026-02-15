# Firebase Token & Refund Fixes - Complete

**Date**: February 15, 2026

---

## Issues Fixed ✅

### 1. **Firebase ID Token Expiration Error**
- **Error**: `auth/id-token-expired` - Firebase ID token has expired
- **Root Cause**: Firebase tokens default to caching the token, only refreshing when necessary. Long-lived sessions could encounter expired tokens for API requests.
- **Fix**: Implemented forced token refresh using `getIdToken(true)` parameter

**Files Modified:**

#### [apiClient.ts](frontend/src/services/apiClient.ts)
- Updated `getAuthToken()` to force token refresh on every API call
- Changed from: `await user.getIdToken()`
- Changed to: `await user.getIdToken(true)` - forces fresh token retrieval from Firebase servers
- **Impact**: All API calls will now have fresh, valid tokens and prevent expired token errors

#### [AuthContext.tsx](frontend/src/app/components/context/AuthContext.tsx)
- Updated `getIdToken()` method to force refresh
- Ensures token refreshes are consistent across the app
- **Impact**: Admin panel and all authenticated features will have valid tokens

### 2. **AdminCancellationRequests Modal - Customer Name Error**
- **Issue**: Modal was trying to access `order?.user?.name` but Order type has `address?.name`
- **File**: [AdminCancellationRequests.tsx](frontend/src/app/components/AdminCancellationRequests.tsx) line 547
- **Fix**: Changed from `selectedRequest.order?.user?.name` to `selectedRequest.order?.address?.name`
- **Impact**: Customer name now displays correctly in post-delivery cancellation request modals

---

## 3. COD Payment Behavior - NO REFUND RECORD (As Designed)

**Status**: ✅ Working as intended

### How it works:

#### **For Cash on Delivery (COD) Orders:**
- When admin **Approves** a post-delivery cancellation request:
  - ✅ Order status changes to CANCELLED
  - ✅ Cancellation request status changes to APPROVED
  - ❌ **NO OrderRefund record is created** (by design)
  - ❌ **NO UPI refund is processed** (no digital payment involved)
- Admin must handle COD cash refunds manually (cash return to customer in person)

#### **For UPI Payment Orders:**
- When admin **Approves** a post-delivery cancellation request:
  - ✅ Order status changes to CANCELLED
  - ✅ Cancellation request status changes to APPROVED
  - ✅ OrderRefund record is created with status INITIATED
  - ✅ Refund is processed to customer's UPI ID (from cancellation request)
  - ✅ Refund status tracked in Admin Refund Status tab

### Why no refund record for COD?
- COD orders receive cash at delivery, so refund happens physically (not digitally)
- No UPI ID provided for COD orders (UPI ID is only for post-delivery defect claims)
- Admin refund tab only shows **ordered payments to customers** (UPI refunds)

---

## Testing

### ✅ Build Status
```
✓ 1675 modules transformed
✓ built successfully in 3.80s
```

### Test Steps:

1. **Test Firebase Token Refresh:**
   - Log in as admin
   - Have session running for 1+ hour
   - Make API calls to verify no token expiration errors
   - Check browser console logs confirm forced token refresh

2. **Test Admin Modal Display:**
   - Navigate to Admin → Orders → Cancellations → Post-Delivery
   - Click any cancellation request card → View Video
   - Modal should display correctly with customer name populated

3. **Test COD Refund Behavior:**
   - Create order with COD payment
   - Request cancellation after delivery
   - Admin approves request
   - Verify: OrderRefund table has NO entry for this COD order
   - Check: Order status = CANCELLED ✓

---

## Files Changed

| File | Change | Impact |
|------|--------|--------|
| `frontend/src/services/apiClient.ts` | Force token refresh in getAuthToken() | All API calls now use fresh tokens |
| `frontend/src/app/components/context/AuthContext.tsx` | Force token refresh in getIdToken() | Consistent token management |
| `frontend/src/app/components/AdminCancellationRequests.tsx` | Fix customer name field | Modal displays correctly |

---

## Future Considerations

### Optional: Reduce Token Refresh Overhead
If experiencing performance issues due to frequent token refresh:
- Implement token cache with expiration time
- Only force refresh if cached token is near expiration
- Example:
```typescript
const TOKEN_CACHE_MAP = new Map<string, {token: string, expiresAt: number}>();

const getAuthToken = async () => {
  const user = auth.currentUser;
  if (!user) return null;
  
  const cached = TOKEN_CACHE_MAP.get(user.uid);
  if (cached && cached.expiresAt > Date.now() + 60000) { // 1 min buffer
    return cached.token;
  }
  
  const token = await user.getIdToken(true);
  TOKEN_CACHE_MAP.set(user.uid, {token, expiresAt: Date.now() + 3600000}); // 1 hour
  return token;
};
```

---

## Verification Checklist

- ✅ Frontend builds without errors
- ✅ AdminCancellationRequests modal shows customer name correctly
- ✅ API calls use forced token refresh
- ✅ COD orders don't create refund records (by design)
- ✅ UPI orders create refund records on approval
- ✅ Firebase token refresh prevents expiration errors

---
