# COUPON SYSTEM - SETUP & TESTING GUIDE

## 🚀 QUICK START

### Prerequisites
- Node.js installed
- Backend running on port 5000
- Database credentials configured
- Firebase auth working

---

## 📦 STEP 1: DATABASE SETUP

### Run Prisma Migration

```bash
# Navigate to backend directory
cd backend

# Run migration to create coupon tables
npx prisma migrate dev --name add_coupon_system

# Output should show:
# ✔ Generated Prisma Client (v5.x) to ./src/generated/prisma
# ✔ Created migration 'add_coupon_system'
# ✔ The migration has been applied
```

### Verify Migration Success

```bash
# Verify Prisma Client regenerated
ls src/generated/prisma/index.d.ts

# You should see the new Coupon and AppliedCoupon types
```

### Optional: Check Database Directly

```bash
# If using PostgreSQL, connect to your database:
psql -U postgres -d supplements_db

# List tables (you should see Coupon and AppliedCoupon):
\dt

# Describe Coupon table:
\d "Coupon"

# Exit:
\q
```

---

## ✅ STEP 2: BACKEND API TESTING

### Start Backend Server

```bash
# From backend directory
npm run dev

# Expected output:
# Backend running on port 5000
```

### Test 1: Create Coupon (Admin Only)

**Tool:** Postman, Thunder Client, or curl

**Request:**
```
POST http://localhost:5000/api/coupons/create
Content-Type: application/json
Authorization: Bearer {YOUR_FIREBASE_ADMIN_TOKEN}

Body:
{
  "trainerName": "John Doe",
  "discountPercent": 10,
  "maxUses": null,
  "expiryDate": "2026-12-31"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Coupon created successfully",
  "coupon": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "code": "JOHN_DOE_10",
    "trainerName": "John Doe",
    "discountPercent": 10,
    "isActive": true,
    "expiryDate": "2026-12-31",
    "createdAt": "2026-02-26T10:00:00Z"
  }
}
```

**Troubleshooting:**
- ❌ "Only admin can create coupons" → Check auth token is for admin@gmail.com
- ❌ "Trainer name is required" → Ensure trainerName is not empty
- ❌ 401 Unauthorized → Token is invalid or expired

### Test 2: Validate Coupon (Public)

**Request:**
```
POST http://localhost:5000/api/coupons/validate
Content-Type: application/json

Body:
{
  "couponCode": "JOHN_DOE_10"
}
```

**Expected Response (Valid):**
```json
{
  "success": true,
  "isValid": true,
  "coupon": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "code": "JOHN_DOE_10",
    "trainerName": "John Doe",
    "discountPercent": 10
  }
}
```

**Expected Response (Invalid):**
```json
{
  "success": true,
  "isValid": false,
  "error": "Invalid coupon code"
}
```

### Test 3: Get All Coupons (Admin)

**Request:**
```
GET http://localhost:5000/api/coupons
Authorization: Bearer {YOUR_FIREBASE_ADMIN_TOKEN}
```

**Expected Response:**
```json
{
  "success": true,
  "count": 1,
  "coupons": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "code": "JOHN_DOE_10",
      "trainerName": "John Doe",
      "discountPercent": 10,
      "usageCount": 0,
      "maxUses": null,
      "isActive": true,
      "expiryDate": "2026-12-31"
    }
  ]
}
```

### Test 4: Apply Coupon (Customer)

**Request:**
```
POST http://localhost:5000/api/coupons/apply
Content-Type: application/json
Authorization: Bearer {YOUR_FIREBASE_CUSTOMER_TOKEN}

Body:
{
  "couponCode": "JOHN_DOE_10",
  "orderId": "order-123",
  "cartTotal": 1000.00
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Coupon applied successfully",
  "coupon": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "code": "JOHN_DOE_10",
    "trainerName": "John Doe",
    "discountPercent": 10
  },
  "discountAmount": 100.00
}
```

### Test 5: Get Commission Report (Admin)

**Request:**
```
GET http://localhost:5000/api/coupons/trainer/John%20Doe/commission-report
Authorization: Bearer {YOUR_FIREBASE_ADMIN_TOKEN}
```

**Expected Response:**
```json
{
  "success": true,
  "report": {
    "trainerName": "John Doe",
    "reportDate": "2026-02-26T10:30:00Z",
    "totalCouponsIssued": 1,
    "totalUsages": 1,
    "totalDiscountGiven": 100.00,
    "couponDetails": [
      {
        "code": "JOHN_DOE_10",
        "discountPercent": 10,
        "usageCount": 1,
        "totalDiscountAmount": 100.00,
        "isActive": true
      }
    ],
    "commissionNote": "This data can be used to calculate trainer commission offline"
  }
}
```

---

## 🎨 STEP 3: FRONTEND TESTING

### 1. Test Admin Coupon Component

```typescript
// In your Admin.tsx component, temporarily test:
import { AdminCoupon } from '../components/AdminCoupon';

export const Admin = () => {
  return <AdminCoupon />;
};
```

**Manual Tests:**
- [ ] Create coupon with valid data
- [ ] See success toast "Coupon created: CODE"
- [ ] Verify coupon appears in list
- [ ] Search by trainer name
- [ ] Filter by active/inactive
- [ ] Copy coupon code to clipboard
- [ ] Deactivate coupon
- [ ] Reactivate coupon

### 2. Test Checkout Coupon Input

```typescript
// In your Checkout.tsx component, test:
import { CheckoutCouponInput } from '../components/CheckoutCouponInput';

export const CheckoutTest = () => {
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  return (
    <div>
      <CheckoutCouponInput
        cartTotal={1299.99}
        onCouponApplied={(data) => setAppliedCoupon(data)}
        onCouponRemoved={() => setAppliedCoupon(null)}
      />
      
      {appliedCoupon && (
        <div>
          <p>Code: {appliedCoupon.code}</p>
          <p>Discount: ₹{appliedCoupon.discountAmount}</p>
        </div>
      )}
    </div>
  );
};
```

**Manual Tests:**
- [ ] Enter valid coupon code → Success message
- [ ] See discount amount calculated
- [ ] Enter invalid code → Error message shown
- [ ] Click "Change" → Can edit coupon
- [ ] Click X button → Coupon removed
- [ ] Enter code, press Enter → Should apply

---

## 🧪 STEP 4: END-TO-END SCENARIO TEST

### Scenario: New Trainer Gets Coupon, Customer Uses It

#### Part 1: Admin Creates Coupon
1. Go to `/admin` in browser
2. Click "🎟️ Coupons" tab
3. Click "Create Coupon" button
4. Fill form:
   - Trainer Name: **Sarah Smith**
   - Discount %: **10**
   - Max Uses: (empty)
   - Expiry: (empty)
5. Click "Create Coupon"
6. ✅ See success: "Coupon created: SARAH_SMITH_10"
7. Copy the code to clipboard

#### Part 2: Customer Applies Coupon
1. Add items to cart (e.g., 1299.99)
2. Go to checkout
3. Scroll to "Apply Coupon Code" section
4. Paste coupon code: `SARAH_SMITH_10`
5. Click "Apply"
6. ✅ See success message
7. ✅ See discount: -₹129.99 (10% off)
8. ✅ New total: ₹1169.99

#### Part 3: Verify Database Records

```sql
-- Check 1: Coupon exists
SELECT * FROM "Coupon" WHERE "trainerName" = 'Sarah Smith';

-- Check 2: Applied coupon record created
SELECT * FROM "AppliedCoupon" WHERE "trainerName" = 'Sarah Smith';

-- Check 3: Order references coupon
SELECT id, "couponCode", "totalAmount", "discount" 
FROM "Order" 
WHERE "couponCode" = 'SARAH_SMITH_10';
```

---

## 📊 DATABASE INSPECTION QUERIES

### View All Coupons
```sql
SELECT 
  id, 
  code, 
  "trainerName", 
  "discountPercent", 
  "usageCount", 
  "isActive", 
  "createdAt"
FROM "Coupon"
ORDER BY "createdAt" DESC;
```

### View Coupon Usage
```sql
SELECT 
  c.code,
  c."trainerName",
  COUNT(ac.id) as "totalUsages",
  SUM(ac."discountAmount") as "totalDiscountGiven",
  c."createdAt"
FROM "Coupon" c
LEFT JOIN "AppliedCoupon" ac ON c.id = ac."couponId"
GROUP BY c.id, c.code, c."trainerName"
ORDER BY "totalUsages" DESC;
```

### View Trainer Commission Data
```sql
SELECT 
  "trainerName",
  COUNT(*) as "totalUsages",
  SUM("discountAmount") as "totalDiscount",
  ROUND(SUM("discountAmount") * 5.0 / 100, 2) as "commission5percent",
  ROUND(SUM("discountAmount") * 10.0 / 100, 2) as "commission10percent"
FROM "AppliedCoupon"
WHERE "appliedDate" >= '2026-01-01'
GROUP BY "trainerName"
ORDER BY "totalDiscount" DESC;
```

### View All Applied Coupons (Audit Trail)
```sql
SELECT 
  ac.id,
  ac."couponId",
  c.code,
  ac."orderId",
  ac."userId",
  ac."discountAmount",
  ac."trainerName",
  ac."appliedDate"
FROM "AppliedCoupon" ac
JOIN "Coupon" c ON ac."couponId" = c.id
ORDER BY ac."appliedDate" DESC
LIMIT 50;
```

---

## 🐛 DEBUGGING TIPS

### Issue: Coupon not found in admin list
**Solution:**
```bash
# Check if migration ran successfully
npx prisma migrate status

# Regenerate Prisma client
npx prisma generate

# Restart backend server
npm run dev
```

### Issue: "User not authenticated" error
**Solution:**
- Verify Firebase token is valid
- Check token isn't expired
- Ensure Authorization header format: `Bearer {token}`

### Issue: Discount not calculated correctly
**Solution:**
```typescript
// Verify calculation
const cartTotal = 1299.99;
const discountPercent = 10;
const discount = (cartTotal * discountPercent) / 100;
console.log(discount); // Should be 129.99
```

### Issue: Database constraints error
**Solution:**
```bash
# Reset database (WARNING: Deletes all data)
npx prisma migrate reset

# Or migrate with fresh schema
npx prisma migrate dev --name reset_coupon
```

---

## ✅ FINAL CHECKLIST

### Database
- [ ] Prisma migration completed
- [ ] Coupon table created
- [ ] AppliedCoupon table created
- [ ] Indexes created
- [ ] Relationships configured

### Backend
- [ ] couponService.ts working
- [ ] couponController.ts endpoints responding
- [ ] couponRoutes.ts registered in app.ts
- [ ] All API tests passing
- [ ] Error handling working

### Frontend - Admin
- [ ] AdminCoupon component created
- [ ] Can create coupons
- [ ] Can view coupon list
- [ ] Can deactivate/reactivate
- [ ] Can view commission reports

### Frontend - Checkout
- [ ] CheckoutCouponInput component created
- [ ] Can validate codes
- [ ] Can apply coupons
- [ ] Discount calculated correctly
- [ ] Can remove applied coupon

### Integration
- [ ] Admin.tsx includes coupon tab
- [ ] Checkout.tsx includes coupon input
- [ ] Order service includes couponCode parameter
- [ ] End-to-end flow works

### Documentation
- [ ] All APIs documented
- [ ] Error messages clear
- [ ] Code comments present
- [ ] Testing procedures documented

---

## 🎉 READY FOR PRODUCTION?

Before going live:

1. **Test with real data** - Use actual trainer/influencer names
2. **Load test** - Test with hundreds of coupons
3. **Security review** - Check authorization logic
4. **User testing** - Get customer feedback on UI/UX
5. **Database backup** - Ensure backups before migration
6. **Monitoring** - Set up error tracking for APIs
7. **Analytics** - Track coupon usage metrics

---

**Need Help?** Check the logs:
```bash
# Backend logs
tail -f logs/backend.log

# Frontend console
Open DevTools → Console tab

# Database logs
check PostgreSQL logs
```

Good luck! 🚀
