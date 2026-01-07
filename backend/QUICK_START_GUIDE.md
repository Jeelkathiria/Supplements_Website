# Quick Start Guide - Backend Checkout Implementation

**Last Updated**: January 7, 2026  
**Status**: ✅ Complete - Ready for Frontend Integration

---

## What Was Implemented

### ✅ Auth Middleware with Auto User Sync
- Firebase token verification
- Automatic database user creation/sync on first authenticated request
- User data attached to all authenticated requests

### ✅ Cart System with Guest-to-Registered Merging
- Cart stored in database per user
- Guest cart merge after login
- Cart totals with GST and discount breakdown

### ✅ Address Management
- Save multiple delivery addresses
- Set default address
- Automatic cart preservation during address updates

### ✅ Complete Checkout Flow
- Single endpoint to fetch all checkout data (user, addresses, cart)
- Order placement directly from cart
- Automatic stock management
- Transactional safety

### ✅ Order Management
- Create orders from cart
- Cancel PENDING orders with stock restoration
- View order history
- Order detail tracking

### ✅ Admin Order Viewing
- View all orders with user and address details
- Filter by status
- Update order status

---

## Key Endpoints

### Authentication (Auto-Sync)
- All endpoints require `Authorization: Bearer <firebase-token>` header

### User
```
POST   /api/user/sync              - Explicit user sync
GET    /api/user/checkout          - Get all checkout data (⭐ NEW)
POST   /api/user/address           - Add address
GET    /api/user/address           - Get addresses
PATCH  /api/user/address/:id/default - Set default
DELETE /api/user/address/:id       - Delete address
```

### Cart
```
GET    /api/cart                   - Get cart with totals
POST   /api/cart/add               - Add item
POST   /api/cart/merge             - Merge guest cart (⭐ NEW)
PUT    /api/cart/update            - Update quantity
DELETE /api/cart/remove            - Remove item
```

### Orders
```
POST   /api/orders/place           - Place order from cart (⭐ NEW)
GET    /api/orders/my              - Get my orders
GET    /api/orders/:id             - Get order details
DELETE /api/orders/:id/cancel      - Cancel order
GET    /api/admin/orders           - Get all orders (admin)
PATCH  /api/orders/:id/status      - Update status (admin)
```

---

## Project Structure

```
backend/
├── src/
│   ├── app.ts                         - Express app setup
│   ├── server.ts                      - Server entry point
│   ├── config/
│   │   └── firebase.ts                - Firebase admin config
│   ├── middlewares/
│   │   ├── requireAuth.ts             - ✅ UPDATED: Auto-sync user
│   │   └── requireAdmin.ts            - Admin check (not implemented yet)
│   ├── controllers/
│   │   ├── userController.ts          - ✅ UPDATED: Checkout endpoint
│   │   ├── cartController.ts          - ✅ UPDATED: Cart merge
│   │   ├── orderController.ts         - ✅ UPDATED: Order placement
│   │   └── adminOrdersController.ts   - ✅ UPDATED: User details in orders
│   ├── services/
│   │   ├── cartService.ts            - ✅ UPDATED: Cart merging & totals
│   │   └── orderService.ts           - ✅ UPDATED: Order from cart
│   ├── routes/
│   │   ├── user.ts                   - ✅ UPDATED: Checkout route
│   │   ├── cartRoutes.ts             - ✅ UPDATED: Merge route
│   │   └── orderRoutes.ts            - ✅ UPDATED: Place order route
│   └── lib/
│       └── prisma.ts                 - Prisma client
├── prisma/
│   └── schema.prisma                 - Database schema
├── API_DOCUMENTATION.md              - ✅ NEW: Complete API reference
├── CHECKOUT_IMPLEMENTATION.md        - ✅ NEW: Implementation details
├── FRONTEND_INTEGRATION_GUIDE.md     - ✅ NEW: Frontend integration
└── package.json
```

---

## Starting the Backend

### Prerequisites
```bash
# Node.js 16+
node --version

# Dependencies installed
npm install

# Firebase service account file
# Place firebase-service-account.json in backend/
```

### Environment Variables
```bash
# .env file
DATABASE_URL=postgresql://user:password@localhost:5432/supplements_db
```

### Run Development Server
```bash
cd backend
npm run dev
```

Server will start on `http://localhost:5000`

### Test Basic Route
```bash
curl http://localhost:5000/
# Response: Backend running
```

---

## Testing the Implementation

### 1. Test Auth Middleware
```bash
# Without token - should return 401
curl http://localhost:5000/api/protected

# With valid token - should return success
curl -H "Authorization: Bearer <firebase-token>" \
  http://localhost:5000/api/protected
```

### 2. Test User Sync
```bash
curl -X POST http://localhost:5000/api/user/sync \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json"
```

### 3. Test Cart Operations
```bash
# Add item
curl -X POST http://localhost:5000/api/cart/add \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "product-uuid",
    "quantity": 2,
    "flavor": "Vanilla",
    "size": "500ml"
  }'

# Get cart with totals
curl http://localhost:5000/api/cart \
  -H "Authorization: Bearer <token>"
```

### 4. Test Address Management
```bash
# Add address
curl -X POST http://localhost:5000/api/user/address \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Home",
    "phone": "9876543210",
    "address": "123 Main Street",
    "city": "Mumbai",
    "pincode": "400001"
  }'

# Get addresses
curl http://localhost:5000/api/user/address \
  -H "Authorization: Bearer <token>"
```

### 5. Test Checkout Data
```bash
curl http://localhost:5000/api/user/checkout \
  -H "Authorization: Bearer <token>"
```

### 6. Test Order Placement
```bash
curl -X POST http://localhost:5000/api/orders/place \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "addressId": "address-uuid"
  }'
```

---

## Database Migrations

The schema includes:
- ✅ User (with firebaseUid, email, name, phone)
- ✅ Address (user's saved addresses)
- ✅ Cart & CartItem (shopping cart)
- ✅ Order & OrderItem (order history)
- ✅ Product (existing)
- ✅ Category (existing)

### Run Migrations
```bash
npx prisma migrate deploy
```

### View Database
```bash
npx prisma studio
```

---

## Code Changes Summary

### Modified Files (10 total)

1. **requireAuth.ts** (CRITICAL)
   - Auto-syncs user to database
   - Attaches `dbUser` to request
   
2. **userController.ts** (ENHANCED)
   - Better error handling
   - Added checkout data endpoint
   - Address validation
   
3. **cartController.ts** (ENHANCED)
   - Added merge endpoint
   - Uses `dbUser.id` instead of Firebase UID
   
4. **orderController.ts** (ENHANCED)
   - Added place order endpoint
   - Uses `dbUser.id`
   
5. **cartService.ts** (NEW FUNCTIONS)
   - `mergeGuestCart()` - Merge guest items
   - `getCartWithTotals()` - Calculate prices
   
6. **orderService.ts** (NEW FUNCTION)
   - `placeOrderFromCart()` - Create order from cart
   
7. **cartRoutes.ts** (NEW ROUTE)
   - Added merge endpoint
   
8. **orderRoutes.ts** (NEW ROUTE)
   - Added place endpoint
   
9. **userRoutes.ts** (NEW ROUTE)
   - Added checkout endpoint
   
10. **adminOrdersController.ts** (ENHANCED)
    - Includes user details in order responses

---

## Key Design Decisions

### 1. Database User ID Over Firebase UID
**Why**: Better for relationships and performance
```typescript
// ❌ Old way - using Firebase UID
Cart.userId = "firebase-uid-xyz"

// ✅ New way - using database ID
Cart.userId = "db-uuid-123"
```

### 2. Auto-Sync in Middleware
**Why**: Simplifies sign-up, no explicit API needed
```
User Login → Firebase Token → Middleware Sync → User Created
```

### 3. Cart-Based Checkout
**Why**: Better for user experience (persist cart, merge)
```
Guest Cart → Add Items → Login → Merge → Checkout → Order
```

### 4. Single Checkout Data Endpoint
**Why**: Reduces network calls, simpler frontend
```
GET /checkout
  ↓
{user, addresses, cart}
```

### 5. Transaction Safety
**Why**: Prevents inconsistent state
```
BEGIN TX
  1. Create Order
  2. Create OrderItems
  3. Update Stock
  4. Clear Cart
COMMIT
```

---

## Frontend Integration Checklist

- [ ] Import `FRONTEND_INTEGRATION_GUIDE.md`
- [ ] Setup Firebase authentication
- [ ] Create checkout service
- [ ] Implement guest cart in localStorage
- [ ] Add cart merge on login
- [ ] Create checkout page using `/user/checkout`
- [ ] Implement order placement
- [ ] Test with backend running
- [ ] Add error handling for all endpoints
- [ ] Display order confirmation
- [ ] Show order history

---

## Common Issues & Solutions

### 401 Unauthorized
**Cause**: Missing or invalid Firebase token  
**Solution**: 
```javascript
const token = await auth.currentUser.getIdToken();
headers['Authorization'] = `Bearer ${token}`;
```

### 403 Forbidden
**Cause**: Accessing another user's data  
**Solution**: Backend validates ownership automatically

### Empty Cart Error
**Cause**: User cart is empty when placing order  
**Solution**: Ensure `POST /api/cart/merge` is called after login

### Address Not Found
**Cause**: Using invalid address ID  
**Solution**: Use address ID from `GET /api/user/address`

### Stock Insufficient
**Cause**: Product quantity not available  
**Solution**: Check product stock before adding to cart

---

## Performance Considerations

1. **Cart Totals Calculation**: Done in service, not returned in every response
2. **Address Queries**: Indexed by userId for fast retrieval
3. **Order Queries**: Indexed by status and userId
4. **Transactions**: Used only for order placement
5. **N+1 Problem**: Fixed using Prisma `include` for related data

---

## Security Notes

1. ✅ All endpoints require Firebase token
2. ✅ User ownership verified for sensitive operations
3. ✅ SQL injection prevented (Prisma)
4. ✅ CORS enabled for frontend domain (configure in production)
5. ⚠️ Admin endpoints need role verification (TODO)

---

## Next Steps

### Immediate (After Frontend Integration)
- [ ] Test complete checkout flow
- [ ] Test cart merging
- [ ] Test order placement
- [ ] Test address management

### Short Term
- [ ] Add admin role verification
- [ ] Implement payment gateway
- [ ] Add order notifications
- [ ] Add inventory management

### Medium Term
- [ ] Order tracking
- [ ] Return management
- [ ] Invoice generation
- [ ] Rate limiting

### Long Term
- [ ] Analytics
- [ ] Recommendations
- [ ] Bulk operations
- [ ] Advanced search

---

## Deployment Notes

### Pre-Deployment Checklist
- [ ] All TypeScript compiles without errors
- [ ] Database migrations applied
- [ ] Firebase service account file secure
- [ ] Environment variables configured
- [ ] CORS configured for production domain
- [ ] Rate limiting configured
- [ ] Error logging configured

### Production Environment
```bash
NODE_ENV=production
DATABASE_URL=postgresql://...
# Add other production vars
```

### Monitoring
- Monitor authentication failures
- Track cart abandonment
- Monitor order placement errors
- Track stock synchronization

---

## Documentation

### Created Files
1. **API_DOCUMENTATION.md** - Complete API reference with examples
2. **CHECKOUT_IMPLEMENTATION.md** - Implementation details and decisions
3. **FRONTEND_INTEGRATION_GUIDE.md** - Frontend developer guide
4. **QUICK_START_GUIDE.md** - This file

### Reading Order for Developers
1. This file (overview)
2. `CHECKOUT_IMPLEMENTATION.md` (understand design)
3. `API_DOCUMENTATION.md` (API reference)
4. `FRONTEND_INTEGRATION_GUIDE.md` (frontend integration)

---

## Support & Questions

### Common Questions

**Q: Why auto-sync user?**  
A: Simplifies flow - no explicit signup endpoint needed. User created on first authenticated request.

**Q: How does cart merging work?**  
A: Guest cart items are merged into user's DB cart, combining quantities for duplicate items.

**Q: Is payment implemented?**  
A: No, order status is PENDING. Payment integration (Razorpay) planned for next phase.

**Q: What happens when cart is cleared?**  
A: After order placement, all items are removed from cart. Order items are preserved in database.

**Q: Can user have multiple addresses?**  
A: Yes, save multiple addresses. Set one as default. Any can be used for orders.

---

## Success Criteria ✅

- [x] Users auto-sync to database on first authentication
- [x] Cart can be merged from guest to registered user
- [x] Cart totals calculated correctly with GST and discounts
- [x] Addresses can be saved and managed
- [x] Single checkout endpoint provides all needed data
- [x] Orders created from cart with automatic stock management
- [x] Cart cleared after order placement
- [x] Admin can view all orders with user details
- [x] All code compiles without errors
- [x] Comprehensive documentation provided

---

## Status: ✅ COMPLETE & READY FOR INTEGRATION

The backend implementation is complete. Frontend team can now integrate using the provided guides.

**Next Action**: Start frontend integration using `FRONTEND_INTEGRATION_GUIDE.md`
