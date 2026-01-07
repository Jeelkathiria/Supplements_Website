# Supplements Backend - API Documentation

## Authentication
All authenticated endpoints require the `Authorization` header with Firebase ID token:
```
Authorization: Bearer <firebase-id-token>
```

The `requireAuth` middleware automatically:
- Verifies the Firebase token
- Syncs the user to the database (creates if doesn't exist)
- Attaches user data to `req.user.dbUser`

---

## User Management

### 1. Sync User (POST /api/user/sync)
- **Auth**: Required
- **Purpose**: Explicitly sync authenticated user to database
- **Response**: User object with id, firebaseUid, email, name

```json
{
  "id": "uuid",
  "firebaseUid": "firebase-uid",
  "email": "user@example.com",
  "name": "John Doe",
  "phone": null,
  "createdAt": "2025-01-07T10:00:00Z",
  "updatedAt": "2025-01-07T10:00:00Z"
}
```

---

## Address Management

### 2. Add Address (POST /api/user/address)
- **Auth**: Required
- **Body**:
```json
{
  "name": "Home",
  "phone": "9876543210",
  "address": "123 Main Street",
  "city": "Mumbai",
  "pincode": "400001",
  "state": "Maharashtra"
}
```
- **Response**: Created address object with id and timestamps

### 3. Get Addresses (GET /api/user/address)
- **Auth**: Required
- **Response**: Array of user addresses (most recent first)

### 4. Set Default Address (PATCH /api/user/address/:id/default)
- **Auth**: Required
- **Response**: Updated address with isDefault = true

### 5. Delete Address (DELETE /api/user/address/:id)
- **Auth**: Required
- **Response**: Success confirmation

---

## Checkout Data

### 6. Get Checkout Data (GET /api/user/checkout)
- **Auth**: Required
- **Purpose**: Fetch all data needed for checkout page
- **Response**:
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "phone": null
  },
  "addresses": [
    {
      "id": "uuid",
      "userId": "uuid",
      "name": "Home",
      "phone": "9876543210",
      "address": "123 Main Street",
      "city": "Mumbai",
      "pincode": "400001",
      "state": "Maharashtra",
      "isDefault": true,
      "createdAt": "2025-01-07T10:00:00Z",
      "updatedAt": "2025-01-07T10:00:00Z"
    }
  ],
  "cart": {
    "id": "uuid",
    "userId": "uuid",
    "items": [
      {
        "id": "uuid",
        "cartId": "uuid",
        "productId": "uuid",
        "quantity": 2,
        "flavor": "Vanilla",
        "size": "500ml",
        "unitPrice": 550.50,
        "totalPrice": 1101.00,
        "gstAmount": 198.18,
        "discountAmount": 0,
        "product": {
          "id": "uuid",
          "name": "Protein Powder",
          "basePrice": 500,
          "discountPercent": 0,
          "gstPercent": 18,
          "finalPrice": 550.50,
          "imageUrls": ["url1", "url2"]
        }
      }
    ],
    "totals": {
      "subtotal": 1101.00,
      "gst": 198.18,
      "discount": 0,
      "grandTotal": 1101.00
    },
    "createdAt": "2025-01-07T10:00:00Z",
    "updatedAt": "2025-01-07T10:00:00Z"
  }
}
```

---

## Cart Management

### 7. Get Cart (GET /api/cart)
- **Auth**: Required
- **Response**: Cart with items and calculated totals (same structure as checkout cart)

### 8. Add Item to Cart (POST /api/cart/add)
- **Auth**: Required
- **Body**:
```json
{
  "productId": "uuid",
  "quantity": 2,
  "flavor": "Vanilla",
  "size": "500ml"
}
```
- **Response**: Added/updated cart item with product details

### 9. Merge Guest Cart (POST /api/cart/merge)
- **Auth**: Required
- **Purpose**: Merge guest cart items to user's DB cart after login
- **Body**:
```json
{
  "cartItems": [
    {
      "productId": "uuid",
      "quantity": 2,
      "flavor": "Vanilla",
      "size": "500ml"
    }
  ]
}
```
- **Response**: Merged cart with all items combined
- **Note**: If same product exists, quantities are added together

### 10. Update Cart Item (PUT /api/cart/update)
- **Auth**: Required
- **Body**:
```json
{
  "productId": "uuid",
  "quantity": 5
}
```
- **Response**: Updated cart item

### 11. Remove Item from Cart (DELETE /api/cart/remove)
- **Auth**: Required
- **Body**:
```json
{
  "productId": "uuid"
}
```
- **Response**: Success confirmation

---

## Order Management

### 12. Place Order from Cart (POST /api/orders/place)
- **Auth**: Required
- **Purpose**: Create order from current cart items
- **Body**:
```json
{
  "addressId": "uuid"
}
```
- **Response**: Created order object with order items
- **Actions**:
  - Creates Order with PENDING status
  - Converts cart items to order items
  - Decrements product stock
  - Clears user's cart

```json
{
  "id": "uuid",
  "userId": "uuid",
  "status": "PENDING",
  "totalAmount": 1101.00,
  "gstAmount": 198.18,
  "discount": 0,
  "items": [
    {
      "id": "uuid",
      "orderId": "uuid",
      "productId": "uuid",
      "quantity": 2,
      "price": 550.50,
      "flavor": "Vanilla",
      "size": "500ml",
      "product": {
        "id": "uuid",
        "name": "Protein Powder",
        "basePrice": 500,
        "discountPercent": 0,
        "gstPercent": 18,
        "finalPrice": 550.50
      }
    }
  ],
  "addressId": "uuid",
  "address": {
    "id": "uuid",
    "userId": "uuid",
    "name": "Home",
    "phone": "9876543210",
    "address": "123 Main Street",
    "city": "Mumbai",
    "pincode": "400001",
    "state": "Maharashtra",
    "isDefault": true,
    "createdAt": "2025-01-07T10:00:00Z",
    "updatedAt": "2025-01-07T10:00:00Z"
  },
  "createdAt": "2025-01-07T10:00:00Z",
  "updatedAt": "2025-01-07T10:00:00Z"
}
```

### 13. Get My Orders (GET /api/orders/my)
- **Auth**: Required
- **Response**: Array of user's orders with items and addresses

### 14. Get Order by ID (GET /api/orders/:orderId)
- **Auth**: Required
- **Response**: Single order with full details
- **Authorization**: Only order owner can view

### 15. Cancel Order (DELETE /api/orders/:orderId/cancel)
- **Auth**: Required
- **Purpose**: Cancel a PENDING order and restore stock
- **Authorization**: Only order owner can cancel
- **Constraints**: Can only cancel PENDING orders

### 16. Create Checkout (Legacy) (POST /api/orders/checkout)
- **Auth**: Required
- **Body**:
```json
{
  "cartItems": [
    {
      "productId": "uuid",
      "quantity": 2,
      "price": 550.50,
      "flavor": "Vanilla",
      "size": "500ml"
    }
  ],
  "shippingAddress": {
    "name": "Home",
    "phone": "9876543210",
    "address": "123 Main Street",
    "city": "Mumbai",
    "pincode": "400001"
  }
}
```
- **Response**: Created order
- **Note**: Creates a new address and order in one call (alternative to cart-based checkout)

---

## Admin Functions

### 17. Get All Orders (GET /api/admin/orders) or (GET /api/orders)
- **Auth**: Required
- **Query**: `?status=PENDING|PAID|SHIPPED|DELIVERED|CANCELLED`
- **Response**: All orders with user details and items
- **Note**: Currently no admin role check (implement in frontend/middleware)

```json
[
  {
    "id": "uuid",
    "userId": "uuid",
    "status": "PENDING",
    "totalAmount": 1101.00,
    "gstAmount": 198.18,
    "discount": 0,
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "phone": "9876543210"
    },
    "items": [...],
    "address": {...},
    "createdAt": "2025-01-07T10:00:00Z",
    "updatedAt": "2025-01-07T10:00:00Z"
  }
]
```

### 18. Update Order Status (PATCH /api/orders/:orderId/status) or (PATCH /api/admin/orders/:orderId/status)
- **Auth**: Required
- **Body**:
```json
{
  "status": "PAID|SHIPPED|DELIVERED|CANCELLED"
}
```
- **Response**: Updated order with new status
- **Note**: Currently no admin role check (implement in frontend/middleware)

---

## Error Responses

### 401 Unauthorized
```json
{
  "message": "No token" | "Invalid token" | "User not authenticated"
}
```

### 400 Bad Request
```json
{
  "message": "Invalid request body | Missing required fields"
}
```

### 403 Forbidden
```json
{
  "message": "Unauthorized | Address not found or unauthorized"
}
```

### 404 Not Found
```json
{
  "message": "Order not found | Address not found | Product not found"
}
```

### 500 Internal Server Error
```json
{
  "message": "Failed to [action]"
}
```

---

## Key Features

1. **Automatic User Sync**: Users are automatically created/synced when they first authenticate
2. **Cart Merging**: Guest carts can be merged into DB carts after login
3. **Price Calculation**: All prices include base price, discount, and GST calculations
4. **Transaction Safety**: Order placement uses database transactions for data consistency
5. **Stock Management**: Stock is automatically decremented on order placement and restored on cancellation
6. **Address Management**: Users can save multiple addresses with one default address
7. **Order Status Tracking**: Orders track status from PENDING through DELIVERED or CANCELLED

---

## Checkout Flow

1. User adds items to cart (local/guest cart on frontend)
2. User logs in with Firebase
3. Frontend calls `POST /api/cart/merge` to sync guest cart to DB
4. Frontend calls `GET /api/user/checkout` to fetch all checkout data
5. User selects/adds delivery address
6. User calls `POST /api/orders/place` with addressId
7. Order is created with status PENDING
8. Cart is cleared
9. User can view order in `GET /api/orders/my`

---

## Future Enhancements

- Payment integration (Razorpay)
- Admin role verification middleware
- Order tracking with notifications
- Order history export
- Bulk order operations
- Return/refund management
