# Order Cancellation Feature - Setup & Troubleshooting Guide

## Quick Setup Instructions

### Step 1: Run Database Migration

```bash
cd backend
npx prisma migrate deploy
npx prisma generate
```

This will:
- Create the `OrderCancellationRequest` table
- Create the `CancellationRequestStatus` enum
- Generate Prisma client types

### Step 2: Restart Backend Server

```bash
npm run dev
```

The backend should start without errors. You should see console output confirming tables are created.

### Step 3: Test the Feature

#### On User Side:
1. Go to Account → Orders → Click on an order
2. You should see a red **"Request Order Cancellation"** button
3. Click it to open the cancellation form
4. Enter a reason (minimum 20 words)
5. Watch the word counter update
6. Click "Submit Request" once you have 20+ words
7. You should see: "Cancellation request submitted successfully!"

#### On Admin Side:
1. Go to Admin Panel → Order Management (via sidebar)
2. Look for orders with a badge: **"Cancel Req: PENDING"**
3. Expand the order to see:
   - Cancellation request details
   - Full reason text
   - Request date
4. Click **"Approve & Cancel"** or **"Reject"** button

---

## Troubleshooting

### Issue 1: 400 Bad Request Error

**Symptom**: When submitting cancellation request, you get error: "POST /api/order-cancellation-requests 400 (Bad Request)"

**Solutions**:

1. **Migration not run**
   - Check: Is `OrderCancellationRequest` table in your database?
   - Fix: Run `npx prisma migrate deploy` in backend folder

2. **Less than 20 words**
   - Check: Counter shows < 20 words?
   - Fix: Add more words (button should be disabled anyway)
   - Note: Words are counted by splitting on whitespace, so "hello world" = 2 words

3. **Order doesn't exist**
   - Check: Is the order ID valid?
   - Fix: Make sure you're on a real existing order

4. **Server not restarted**
   - Fix: Restart backend server after migration

---

### Issue 2: 401 Unauthorized Error

**Symptom**: "POST /api/order-cancellation-requests 401 (Unauthorized)"

**Solutions**:

1. **Not logged in**
   - Check: Are you logged in to user account?
   - Fix: Log in first before trying to submit cancellation

2. **Firebase token not valid**
   - Fix: Log out and log back in
   - Check browser console for auth errors

---

### Issue 3: Cannot see "Request Cancellation" Button

**Symptom**: The red cancellation button doesn't appear on order detail page

**Solutions**:

1. **Order already cancelled**
   - Button won't show if order status is CANCELLED
   - This is expected behavior

2. **Cancellation request already exists**
   - Button won't show if request already submitted
   - You can still see the request status

3. **Page not refreshed**
   - Try: Refresh the page (F5 or Ctrl+R)

---

### Issue 4: Word Counter Shows Wrong Count

**Symptom**: Counter says 5 words when you typed "hello world test" (3 words)

**Solutions**:

1. **Extra spaces**
   - The counter splits on any whitespace (spaces, tabs, newlines)
   - "hello  world" (2 spaces) counts as 2 words ✓
   - Extra spaces are filtered out

2. **Test the counter**
   - Type exactly: "hello world test" → should show 3
   - Add more words until it shows 20+

---

### Issue 5: Admin Can't See Cancellation Requests

**Symptom**: No cancellation requests showing in Admin Orders

**Solutions**:

1. **Requests not submitted yet**
   - Make sure a user submitted a cancellation request first
   - Submit one as a test user

2. **Admin view not refreshed**
   - Refresh the admin panel (F5)
   - Cancellation requests auto-load but sometimes need manual refresh

3. **Filtering by status**
   - If you selected "Shipped", "Delivered", or "Cancelled" tab
   - Switch to "All Orders" to see orders with cancellation requests

---

## Database Verification

To verify the migration was applied correctly:

### PostgreSQL (using psql):
```sql
\dt OrderCancellationRequest
\d OrderCancellationRequest
```

Should show the table with columns: id, orderId, userId, reason, status, createdAt, updatedAt

### Prisma:
```bash
npx prisma studio
```

Open the browser interface and check the `OrderCancellationRequest` table.

---

## Testing Checklist

- [ ] Migration has run successfully
- [ ] Backend server restarted
- [ ] Can see "Request Cancellation" button on order detail
- [ ] Word counter works (updates as you type)
- [ ] Submit button only enables with 20+ words
- [ ] Successful submission shows success toast
- [ ] Cancellation request appears in admin panel within a few seconds
- [ ] Admin can approve/reject requests
- [ ] Approved requests change order status to CANCELLED

---

## Common Error Messages & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| "Order not found" | Invalid order ID | Use real order ID |
| "You can only cancel your own orders" | Wrong user ID | Log in as correct user |
| "Cancellation request already exists for this order" | Request already submitted | Use different order |
| "Reason must be at least 20 words" | Too few words | Add more words |
| "Not authenticated" | Not logged in | Log in first |
| "Unauthorized" | No valid token | Re-login |

---

## Console Logs to Check

Open browser DevTools (F12) and check Console tab:

You should see logs like:
```
Creating cancellation request: { orderId: "xxx", reasonWordCount: 25, reasonLength: 145 }
```

In backend terminal, you should see:
```
Create cancellation request: { orderId: 'xxx', reason: '...', userId: 'yyy', body: {...} }
```

These logs help debug issues. Share them if you encounter problems.

---

## Need More Help?

1. Check the browser console (F12 → Console)
2. Check the backend terminal for error messages
3. Check database: `npx prisma studio`
4. Verify migration: `npx prisma migrate status`
5. Try resetting:
   - Restart backend
   - Clear browser cache
   - Log out and log back in
