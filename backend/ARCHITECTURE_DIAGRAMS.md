# System Architecture & Flow Diagrams

## 1. Authentication & User Sync Flow

```
┌─────────────────┐
│  User Logs In   │
│  (Firebase)     │
└────────┬────────┘
         │
         ▼
┌──────────────────────────┐
│  Firebase Returns        │
│  ID Token                │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│  Frontend Sends API      │
│  Request with Token      │
│  Authorization: Bearer.. │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│  requireAuth Middleware          │
│  ✓ Verify Firebase Token         │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│  Check if User Exists in DB      │
│  SELECT * FROM User              │
│  WHERE firebaseUid = ?           │
└────────┬─────────────────────────┘
         │
    ┌────┴────┐
    │          │
   YES        NO
    │          │
    │          ▼
    │  ┌──────────────────────────┐
    │  │ Create User in DB        │
    │  │ INSERT INTO User         │
    │  │ (firebaseUid, email...) │
    │  └──────┬───────────────────┘
    │         │
    └────┬────┘
         │
         ▼
┌──────────────────────────────────┐
│  Attach dbUser to Request        │
│  req.user.dbUser = {             │
│    id: "db-uuid",                │
│    firebaseUid: "fb-uid",        │
│    email: "user@email.com"       │
│  }                               │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│  Execute Route Handler           │
│  All Routes Use req.user.dbUser │
└──────────────────────────────────┘
```

---

## 2. Cart Merge Flow (Guest → Registered)

```
BEFORE LOGIN (Guest):
┌─────────────────────┐
│  localStorage:      │
│  guestCart: [       │
│    {                │
│      productId: 1   │
│      quantity: 2    │
│      flavor: "Van"  │
│    }                │
│  ]                  │
└─────────────────────┘

AFTER LOGIN:
┌─────────────────────┐
│  1. User Logs In    │
│  2. Frontend Calls  │
│     POST /cart/merge│
│     Body: guestCart │
└────────┬────────────┘
         │
         ▼
┌──────────────────────────────────┐
│  Backend Cart Merge Service      │
│  For each item in guestCart:     │
│    UPSERT CartItem by:           │
│      cartId + productId          │
│    If insert: quantity = qty     │
│    If update: quantity += qty    │
└────────┬─────────────────────────┘
         │
         ▼
┌─────────────────────┐
│  DB Cart:           │
│  item 1: qty 2      │ ✓ Merged
│  item 2: qty 1      │
│  item 3: qty 3      │ ✓ New
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  localStorage:      │
│  guestCart: []      │ ✓ Cleared
└─────────────────────┘
```

---

## 3. Checkout Page Data Flow

```
┌──────────────────────────────────────────────────────────────┐
│  Checkout Page Component                                     │
│  useEffect on mount:                                         │
│    1. Merge guest cart if exists                            │
│    2. Call GET /api/user/checkout                           │
└────────┬─────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────┐
│  GET /api/user/checkout - Single API Call                   │
│  Returns Everything:                                         │
│                                                              │
│  {                                                           │
│    user: {                                                   │
│      id, email, name, phone                                 │
│    },                                                        │
│    addresses: [                                              │
│      { id, name, address, city, pincode, isDefault }       │
│    ],                                                        │
│    cart: {                                                   │
│      items: [                                                │
│        {                                                     │
│          productId, quantity, flavor, size,                 │
│          unitPrice, totalPrice, gstAmount, discount         │
│        }                                                     │
│      ],                                                      │
│      totals: {                                               │
│        subtotal, gst, discount, grandTotal                  │
│      }                                                       │
│    }                                                         │
│  }                                                           │
└────────┬─────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────┐
│  UI Renders:                                                 │
│  ┌─────────────────────────────────────┐                    │
│  │ User Section                        │                    │
│  │ Email: user@example.com             │                    │
│  │ Name: John Doe                      │                    │
│  └─────────────────────────────────────┘                    │
│                                                              │
│  ┌─────────────────────────────────────┐                    │
│  │ Address Selection (Radio Buttons)   │                    │
│  │ ○ Home - 123 Main St (DEFAULT)      │                    │
│  │ ○ Office - 456 Work Blvd            │                    │
│  │ ◎ Add New Address                   │                    │
│  └─────────────────────────────────────┘                    │
│                                                              │
│  ┌─────────────────────────────────────┐                    │
│  │ Cart Items                          │                    │
│  │ ┌─────────────────────────────────┐ │                    │
│  │ │ Product 1                       │ │                    │
│  │ │ ₹550.50 × 2 = ₹1,101.00        │ │                    │
│  │ └─────────────────────────────────┘ │                    │
│  └─────────────────────────────────────┘                    │
│                                                              │
│  ┌─────────────────────────────────────┐                    │
│  │ Price Summary                       │                    │
│  │ Subtotal:    ₹1,101.00              │                    │
│  │ Tax (GST):   ₹198.18                │                    │
│  │ Discount:    ₹0.00                  │                    │
│  │ ─────────────────────               │                    │
│  │ Total:       ₹1,101.00              │                    │
│  └─────────────────────────────────────┘                    │
│                                                              │
│  [Place Order] Button                                       │
└──────────────────────────────────────────────────────────────┘
```

---

## 4. Order Placement Flow

```
┌──────────────────────────────────────┐
│  User Clicks "Place Order"           │
│  Frontend Has:                       │
│  - addressId (selected)              │
│  - Firebase Token                    │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  POST /api/orders/place              │
│  {                                   │
│    addressId: "address-uuid"         │
│  }                                   │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────┐
│  Controller: placeOrder                      │
│  1. Verify address exists & belongs to user  │
│  2. Get user's cart with items              │
│  3. Validate stock for all items            │
└────────┬─────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────┐
│  BEGIN DATABASE TRANSACTION                  │
│                                              │
│  1. CREATE Order                             │
│     {                                        │
│       userId, status: "PENDING",             │
│       totalAmount, gstAmount, discount,      │
│       addressId                              │
│     }                                        │
└────────┬─────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────┐
│  2. CREATE OrderItems                        │
│     For each item in cart:                   │
│     {                                        │
│       orderId, productId, quantity,          │
│       price (finalPrice), flavor, size       │
│     }                                        │
└────────┬─────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────┐
│  3. UPDATE Product Stock                     │
│     For each item:                           │
│     stock -= quantity                        │
└────────┬─────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────┐
│  4. DELETE CartItems                         │
│     Remove all items from user's cart        │
│                                              │
│  COMMIT TRANSACTION                          │
└────────┬─────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────┐
│  Return Order Object                         │
│  {                                           │
│    id: "order-uuid",                         │
│    status: "PENDING",                        │
│    totalAmount, gstAmount,                   │
│    items: [...],                             │
│    address: {...}                            │
│  }                                           │
└────────┬─────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────┐
│  Frontend:                                   │
│  1. Clear local state                        │
│  2. Show confirmation                        │
│  3. Redirect to order page                   │
└──────────────────────────────────────────────┘
```

---

## 5. Price Calculation Pipeline

```
┌─────────────────────────────────┐
│  Product Data (Base)            │
│  basePrice: 500                 │
│  discountPercent: 10            │
│  gstPercent: 18                 │
│  quantity: 2                    │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Step 1: Calculate Discount     │
│  discountAmount = basePrice × (discountPercent / 100)
│                = 500 × 0.10     │
│                = 50             │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Step 2: Price After Discount   │
│  priceAfterDiscount = basePrice - discountAmount
│                     = 500 - 50  │
│                     = 450       │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Step 3: Calculate GST          │
│  gstAmount = priceAfterDiscount × (gstPercent / 100)
│           = 450 × 0.18         │
│           = 81                 │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Step 4: Final Unit Price       │
│  unitPrice = priceAfterDiscount + gstAmount
│           = 450 + 81           │
│           = 531                │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Step 5: Item Total             │
│  itemTotal = unitPrice × quantity
│           = 531 × 2            │
│           = 1062               │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Cart Response for Item:        │
│  {                              │
│    unitPrice: 531,              │
│    quantity: 2,                 │
│    totalPrice: 1062,            │
│    gstAmount: 162 (81 × 2),     │
│    discountAmount: 100 (50 × 2) │
│  }                              │
└────────┬────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│  Multiple Items Aggregated:      │
│  totals: {                       │
│    subtotal: 1062,  ← Sum of all │
│    gst: 162,        ← Sum of GST │
│    discount: 100,   ← Sum of disc│
│    grandTotal: 1062 ← User pays  │
│  }                               │
└──────────────────────────────────┘
```

---

## 6. Database Transaction Safety

```
ORDER PLACEMENT TRANSACTION:

┌─────────────────────────────────────────────────┐
│  BEGIN TRANSACTION                              │
└────────┬────────────────────────────────────────┘
         │
         ▼
    ┌────────────────┐
    │  Create Order  │ ✓ Success
    └────────┬───────┘
             │
         ┌───┴───┐
         │       │
      Error?   OK
         │       │
         │       ▼
         │   ┌──────────────────┐
         │   │  Create Items    │ ✓ Success
         │   └────────┬─────────┘
         │            │
         │        ┌───┴───┐
         │        │       │
         │     Error?   OK
         │        │       │
         │        │       ▼
         │        │   ┌──────────────────┐
         │        │   │ Update Stock     │ ✓ Success
         │        │   └────────┬─────────┘
         │        │            │
         │        │        ┌───┴───┐
         │        │        │       │
         │        │     Error?   OK
         │        │        │       │
         │        │        │       ▼
         │        │        │   ┌──────────────────┐
         │        │        │   │ Clear Cart       │ ✓ Success
         │        │        │   └────────┬─────────┘
         │        │        │            │
         │        │        │         OK │
         │        │        │            │
         ├────────┼────────┴────────────┤
         │        │                    │
      ROLLBACK   ROLLBACK           COMMIT
         │        │                    │
         ▼        ▼                    ▼
    ┌────────┐┌─────────┐     ┌──────────────┐
    │ CANCEL ││ CANCEL  │     │  SUCCESS     │
    │ ORDER  ││ ITEMS   │     │  - Order     │
    │ - Stock││ - Stock │     │  - Items     │
    │  Safe  ││  Restored     │  - Stock↓   │
    └────────┘└─────────┘     │  - Cart cleared
                               └──────────────┘
```

---

## 7. Database Schema Relationships

```
┌──────────────┐
│     User     │
│──────────────│
│ id (PK)      │
│ firebaseUid  │
│ email        │
│ name         │
│ phone        │
└──────────────┘
       │
       ├─────────────────┬─────────────────┐
       │                 │                 │
       ▼                 ▼                 ▼
  ┌─────────┐      ┌──────────┐      ┌───────────┐
  │  Address │      │   Cart   │      │   Order   │
  │──────────│      │──────────│      │───────────│
  │ id       │      │ id       │      │ id        │
  │ userId   │      │ userId   │      │ userId    │
  │ address  │      │ items[]  │──┐   │ items[]   │──┐
  │ isDefault│      └──────────┘  │   │ addressId │   │
  └──────────┘                    │   │ totalAmt  │   │
       ▲                          │   │ status    │   │
       │                          │   └───────────┘   │
       │                          │        │          │
       │                   ┌──────┴────┐   │   ┌──────┴───┐
       │                   │           │   │   │          │
       └───────────────────┤ CartItem  │   │   │ OrderItem│
                           │───────────│   │   │──────────│
                           │ id        │   │   │ id       │
                           │ cartId    │   │   │ orderId  │
                           │ productId │───┘   │ productId
                           │ quantity  │       │ quantity │
                           └───────────┘       │ price    │
                                               └──────────┘
```

---

## 8. API Request/Response Flow

```
Frontend                          Backend
│                                   │
├──────────────────────────────────>│
│ POST /api/user/checkout           │
│ Headers: Auth: Bearer...          │
│                                   │
│                                   │ requireAuth middleware
│                                   │ ✓ Verify token
│                                   │ ✓ Sync user
│                                   │
│                                   │ userController.getCheckoutData
│                                   │ - Get user
│                                   │ - Get addresses
│                                   │ - Get cart with totals
│                                   │
│<──────────────────────────────────┤
│ 200 OK                            │
│ {                                 │
│   user: {...},                    │
│   addresses: [...],               │
│   cart: {...}                     │
│ }                                 │
│                                   │
├──────────────────────────────────>│
│ POST /api/orders/place            │
│ Body: { addressId: "..." }        │
│                                   │
│                                   │ orderController.placeOrder
│                                   │ → orderService.placeOrderFromCart
│                                   │ ✓ Validate address
│                                   │ ✓ Check stock
│                                   │ ✓ Create order (tx)
│                                   │ ✓ Update stock (tx)
│                                   │ ✓ Clear cart (tx)
│                                   │
│<──────────────────────────────────┤
│ 201 Created                       │
│ {                                 │
│   id: "order-id",                 │
│   status: "PENDING",              │
│   items: [...],                   │
│   totalAmount: 1062               │
│ }                                 │
│                                   │
└─────────────────────────────────────────
```

---

## 9. State Management (Frontend Example)

```
┌─────────────────────────────────────┐
│  Global Checkout State              │
│                                     │
│  {                                  │
│    user: {                          │
│      id, email, name, phone         │
│    },                               │
│                                     │
│    addresses: [                     │
│      { id, name, address, city }   │
│    ],                               │
│    selectedAddressId: "address-id", │
│                                     │
│    cart: {                          │
│      items: [                       │
│        {                            │
│          productId, quantity,       │
│          unitPrice, totalPrice      │
│        }                            │
│      ],                             │
│      totals: {                      │
│        subtotal, gst, grandTotal    │
│      }                              │
│    },                               │
│                                     │
│    loading: false,                  │
│    error: null,                     │
│    orderPlaced: false,              │
│    orderId: null                    │
│  }                                  │
└─────────────────────────────────────┘
```

---

## 10. Error Handling Flow

```
┌──────────────────────┐
│  API Request         │
└────────┬─────────────┘
         │
         ▼
    ┌─────────────────────┐
    │  Is Token Valid?    │
    └──┬──────────────────┘
       │
    ┌──┴──┐
   NO    YES
    │     │
    │     ▼
    │  ┌──────────────────────┐
    │  │  Process Request     │
    │  └──┬───────────────────┘
    │     │
    │     ▼
    │  ┌──────────────────────┐
    │  │  Validation OK?      │
    │  └──┬──────────────────┬─┘
    │     │                  │
    │    YES                NO
    │     │                  │
    │     │                  ▼
    │     │            ┌────────────┐
    │     │            │ 400 Error  │
    │     │            │ Validation │
    │     │            └────────────┘
    │     │
    │     ▼
    │  ┌──────────────────────┐
    │  │  Authorization OK?   │
    │  └──┬──────────────────┬─┘
    │     │                  │
    │    YES                NO
    │     │                  │
    │     │                  ▼
    │     │            ┌────────────┐
    │     │            │ 403 Error  │
    │     │            │ Forbidden  │
    │     │            └────────────┘
    │     │
    │     ▼
    │  ┌──────────────────────┐
    │  │  Execute Business    │
    │  │  Logic               │
    │  └──┬──────────────────┬─┘
    │     │                  │
    │    OK              ERROR
    │     │                  │
    │     ▼                  ▼
    │  ┌────────────┐  ┌──────────────┐
    │  │ 200/201    │  │ 500 Error    │
    │  │ Success    │  │ Server Error │
    │  └────────────┘  └──────────────┘
    │
    ▼
 ┌─────────────┐
 │ 401 Error   │
 │ Unauthorized
 │ → Redirect  │
 │ to Login    │
 └─────────────┘
```

---

## Summary

These diagrams show:
1. **Authentication** - How users are auto-synced
2. **Cart Merging** - Guest to registered user
3. **Checkout Data** - Single comprehensive call
4. **Order Placement** - Transaction-safe order creation
5. **Price Calculation** - Detailed pricing breakdown
6. **Database Transactions** - ACID compliance
7. **Schema** - Data relationships
8. **API Flow** - Request/response cycle
9. **State** - Frontend state management
10. **Error Handling** - Error handling flow
