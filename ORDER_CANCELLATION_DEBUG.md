# Order Cancellation - Debug Checklist

When you see: `400 (Bad Request)` error

Follow these steps in order:

## Step 1: Check Browser Console (F12)

You should see logs like:
```
Creating cancellation request: { orderId: "abc123", reasonWordCount: 25, reasonLength: 145 }
API Error Response: { status: 400, message: "..." }
Cancellation request error: Error: [error message]
```

**If you see this** → Go to Step 2
**If you don't see this** → Backend service might be broken, check imports

---

## Step 2: Read the Error Message

Look at the exact error in the toast notification and browser console.

### Common Errors:

**"Reason must be at least 20 words. Current: X words."**
- ✓ This means backend received the request but validation failed
- ✓ Add more words to your reason
- ✓ Check browser console for exact word count

**"Order not found"**
- ✗ Migration not run OR table doesn't exist
- Run: `npx prisma migrate deploy`

**"You can only cancel your own orders"**
- ✓ This is correct behavior
- ✓ Make sure you're logged in as the user who placed the order

**"Cancellation request already exists for this order"**
- ✓ This is correct behavior
- ✓ Use a different order to test

**"Unauthorized"**
- ✗ Not logged in OR Firebase token invalid
- Fix: Log out and log back in

---

## Step 3: Check Backend Console

When you submit a request, you should see in backend terminal:

```
Create cancellation request: { orderId: 'xxx', reason: '...', userId: 'yyy', body: {...} }
OrderCancellationService.createCancellationRequest: { orderId: 'xxx', userId: 'yyy', reasonLength: 145 }
Word count: 25
Checking order: xxx
Order found. Checking ownership: { orderUserId: 'yyy', requestUserId: 'yyy' }
Checking for existing cancellation request: xxx
Creating new cancellation request
Cancellation request created: req-id-123
```

### If You See Errors:

**"Word count: 5"** (too low)
- User didn't enter 20+ words
- This is expected, tell user to add more

**"Order not found"**
- Order doesn't exist in database
- Check if user is on correct order detail page

**"You can only cancel your own orders"**
- userId in request ≠ order.userId
- Check if user is logged in correctly

---

## Step 4: Check Database

### Using Prisma Studio:
```bash
npx prisma studio
```

1. Check `Order` table - does the order exist?
2. Check `OrderCancellationRequest` table - is it empty?
3. Try creating a test entry manually

### Using psql (PostgreSQL):
```bash
psql -U youruser -d yourdatabase

SELECT * FROM "Order" WHERE id = 'xxx';
SELECT * FROM "OrderCancellationRequest";
SELECT * FROM "OrderCancellationRequest" WHERE "orderId" = 'xxx';
```

---

## Step 5: Verify Migration

```bash
cd backend
npx prisma migrate status
```

You should see:
```
5 migrations found in prisma/migrations

✓ 20260104072650_init
✓ 20260104082600_make_category_id_optional
✓ ... other migrations ...
✓ 20260204_add_order_cancellation_request

Database schema is up to date!
```

If the migration shows as pending (✗), run:
```bash
npx prisma migrate deploy
```

---

## Step 6: Network Request Check

1. Open DevTools (F12)
2. Go to Network tab
3. Submit cancellation request
4. Look for POST request to `/api/order-cancellation-requests`

### Check Request:
- Method: POST ✓
- Headers:
  - `Content-Type: application/json` ✓
  - `Authorization: Bearer eyJhbGc...` ✓
- Body: `{"orderId":"xxx","reason":"..."}`✓

### Check Response:
- Status: 201 (success) or 400 (bad request)
- Body shows error message

---

## Complete Troubleshooting Flow

```
Start
│
├─→ Is 20+ words entered?
│   ├─ No  → Add more words
│   └─ Yes → Continue
│
├─→ Are you logged in?
│   ├─ No  → Log in
│   └─ Yes → Continue
│
├─→ Does the order belong to you?
│   ├─ No  → Use your own order
│   └─ Yes → Continue
│
├─→ Have you already submitted a request for this order?
│   ├─ Yes → Use a different order
│   └─ No  → Continue
│
├─→ Check backend console - does it say "Order not found"?
│   ├─ Yes → Migration not run. Run: npx prisma migrate deploy
│   └─ No  → Continue
│
├─→ Check browser console for exact error
│   ├─ Share error message → See "Common Errors" above
│   └─ No error → Backend might not be running
│
└─→ Check if backend is running (should see logs when submitting)
    ├─ No logs → Restart backend: npm run dev
    └─ Logs show error → Fix based on error message
```

---

## Quick Fixes (Try In Order)

1. **Refresh page**: F5 or Ctrl+R
2. **Log out and log back in**: Clears Firebase token
3. **Restart backend**: Stop and run `npm run dev`
4. **Run migration**: `npx prisma migrate deploy && npx prisma generate`
5. **Clear browser cache**: Ctrl+Shift+Delete
6. **Check database**: `npx prisma studio`

---

## Getting Help

When asking for help, please provide:

1. **Browser Console** (F12 → Console):
   - Screenshot or paste the logs

2. **Backend Console**:
   - Screenshot or paste the logs when submitting

3. **Error Message**:
   - Exact text from the toast notification

4. **Steps to Reproduce**:
   - What order are you using?
   - How many words in reason?
   - Are you logged in?

5. **Network Tab** (F12 → Network → POST request):
   - Status code
   - Response body
