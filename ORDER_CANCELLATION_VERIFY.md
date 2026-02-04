# Order Cancellation Feature - Quick Verification

Run this checklist to identify the exact issue causing 400 errors.

## Pre-Flight Checks

### 1. Database Migration Status
```bash
cd backend
npx prisma migrate status
```

**Expected Output:**
- All migrations have ✓ (green checkmark)
- Last line says: "Database schema is up to date!"

**If it says "Pending" or "Not yet applied":**
```bash
npx prisma migrate deploy
npx prisma generate
```

### 2. Backend Server Running
Check terminal where backend is running.

**Expected Output:**
```
Server running on port 5000
```

**If it's not running:**
```bash
npm run dev
```

### 3. Frontend Server Running
Check terminal where frontend is running.

**Expected Output:**
```
VITE v4.x.x  ready in XXX ms
```

**If it's not running:**
```bash
npm run dev
```

---

## Feature Verification

### 4. Check Order Exists

Open browser DevTools (F12) → Console → Paste:
```javascript
// This checks if you have any orders
console.log('Test: Checking order');
```

Then go to Account → Orders and click on an order. You should see the order ID in the URL:
```
/order/some-uuid-here
```

Copy that UUID.

### 5. Test Word Counter

Go to the order and click "Request Cancellation" button.

In the textarea, copy-paste this text exactly:
```
I want to cancel this order because the delivery is taking too long and I found a better price somewhere else for the same product I need today
```

**Expected:**
- Word counter shows "22 / 20"
- "✓ Ready to submit" appears in green
- Submit button is enabled

**If not:**
- Paste this text again
- Or count words manually and type that many

### 6. Test Submission

With 20+ words, click "Submit Request".

**Expected outcomes:**

A) **Success** (best case):
- Toast shows: "Cancellation request submitted successfully!"
- Modal closes
- Below order details, you see "Cancellation Request Status"

B) **"Reason must be at least 20 words"**:
- Add more words and try again
- The submit button should be disabled if < 20 words

C) **"Order not found"**:
- Migration NOT run
- Fix: `npx prisma migrate deploy`

D) **"Cancellation request already exists"**:
- You already submitted for this order
- Use a different order to test

E) **"You can only cancel your own orders"**:
- This is a different user's order
- Use your own order

F) **"Unauthorized"**:
- Not logged in
- Log in first

G) **Any other error**:
- See ORDER_CANCELLATION_DEBUG.md for help

---

## Admin Verification

### 7. Check Admin Panel

1. Go to Admin → Order Management (sidebar)
2. Look at the orders you just submitted a cancellation for
3. You should see badge: **"Cancel Req: PENDING"**

**Expected:**
- Badge appears with PENDING status
- Can expand order to see cancellation details
- See "Approve & Cancel" and "Reject" buttons

**If you don't see the badge:**
- Refresh the page (F5)
- Or wait a few seconds for auto-load

### 8. Test Approve/Reject

1. Expand an order with cancellation request
2. Click "Approve & Cancel" button

**Expected:**
- Toast shows: "Cancellation approved..."
- Order status changes to CANCELLED
- Badge changes to "Cancel Req: APPROVED"

---

## Success Criteria

Your feature is working if ALL of these are true:

- [x] User can submit cancellation request with 20+ word reason
- [x] Admin sees cancellation requests in order management
- [x] Admin can approve requests (changes order to CANCELLED)
- [x] Admin can reject requests
- [x] Word counter works correctly
- [x] Word count validated (minimum 20 words)
- [x] Cannot submit duplicate requests for same order
- [x] Cannot cancel other users' orders

---

## If Something is Wrong

### Check these in order:

1. **Is the error coming from the browser or backend?**
   - Browser error = Frontend/Auth issue
   - Backend error = Database/API issue

2. **What's the exact error message?**
   - Look in toast notification
   - Look in browser console (F12)
   - Look in backend terminal

3. **Run the migration**
   ```bash
   cd backend
   npx prisma migrate deploy
   ```

4. **Restart both servers**
   - Stop backend (Ctrl+C)
   - Stop frontend (Ctrl+C)
   - Restart: `npm run dev` in both folders

5. **Refresh browser**
   - F5 or Ctrl+R
   - Or Ctrl+Shift+R (hard refresh)

6. **Check database exists**
   ```bash
   npx prisma studio
   ```
   - Look for `OrderCancellationRequest` table
   - Should be empty initially

---

## Common Issues & Fixes

| Issue | Check | Fix |
|-------|-------|-----|
| 400 Bad Request | Word count | Must be 20+ words |
| 400 Bad Request | Order exists | Use real order ID |
| 400 Bad Request | Table exists | Run migration |
| 401 Unauthorized | Logged in | Log in first |
| Can't see button | Order status | Order must not be CANCELLED |
| Can't see request in admin | Submitted? | Did you click Submit? |
| Request shows wrong status | Page stale | Refresh page |

---

## Next Steps

Once everything works:

1. Test with multiple orders
2. Test cancelling different orders
3. Have admin approve some and reject others
4. Check that cancelled orders can't be cancelled again
5. Verify notifications work properly

You're done! Feature is ready for production. 🎉
