# Frontend Integration Guide - Checkout Flow

## Authentication Flow

### 1. After User Login
```typescript
// After successful Firebase login
const idToken = await user.getIdToken();

// Send token with all authenticated API calls
const headers = {
  'Authorization': `Bearer ${idToken}`
};
```

### 2. Sync User to Database
```typescript
// Call immediately after login
await fetch('http://localhost:5000/api/user/sync', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${idToken}`,
    'Content-Type': 'application/json'
  }
});
```

---

## Cart Management Flow

### 1. Before Login: Guest Cart (Local Storage)
```typescript
// Store guest cart in localStorage
const guestCart = [
  {
    productId: "uuid-1",
    quantity: 2,
    flavor: "Vanilla",
    size: "500ml"
  },
  {
    productId: "uuid-2",
    quantity: 1,
    flavor: null,
    size: null
  }
];

localStorage.setItem('guestCart', JSON.stringify(guestCart));
```

### 2. After Login: Merge Cart
```typescript
// After user logs in and syncs
const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]');

if (guestCart.length > 0) {
  const response = await fetch('http://localhost:5000/api/cart/merge', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${idToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ cartItems: guestCart })
  });

  const mergedCart = await response.json();
  localStorage.removeItem('guestCart');
  // Update UI with mergedCart
}
```

### 3. Add Item to Cart
```typescript
const response = await fetch('http://localhost:5000/api/cart/add', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${idToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    productId: "product-uuid",
    quantity: 2,
    flavor: "Vanilla",
    size: "500ml"
  })
});

const result = await response.json();
```

### 4. Get Current Cart
```typescript
const response = await fetch('http://localhost:5000/api/cart', {
  headers: {
    'Authorization': `Bearer ${idToken}`
  }
});

const cart = await response.json();

// Cart structure:
// {
//   id: "uuid",
//   items: [
//     {
//       id: "item-id",
//       productId: "product-id",
//       quantity: 2,
//       flavor: "Vanilla",
//       size: "500ml",
//       unitPrice: 550.50,      // Final price per unit (with GST)
//       totalPrice: 1101.00,    // unitPrice * quantity
//       gstAmount: 198.18,
//       discountAmount: 0,
//       product: { ... }
//     }
//   ],
//   totals: {
//     subtotal: 1101.00,        // Sum of all items
//     gst: 198.18,              // Total tax
//     discount: 0,              // Total discount
//     grandTotal: 1101.00       // Final amount to pay
//   }
// }
```

---

## Address Management Flow

### 1. Add New Address
```typescript
const response = await fetch('http://localhost:5000/api/user/address', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${idToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: "Home",
    phone: "9876543210",
    address: "123 Main Street",
    city: "Mumbai",
    pincode: "400001",
    state: "Maharashtra"
  })
});

const newAddress = await response.json();
```

### 2. Get All Addresses
```typescript
const response = await fetch('http://localhost:5000/api/user/address', {
  headers: {
    'Authorization': `Bearer ${idToken}`
  }
});

const addresses = await response.json();
// Returns array of addresses, most recent first
```

### 3. Set Default Address
```typescript
const response = await fetch(`http://localhost:5000/api/user/address/${addressId}/default`, {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${idToken}`
  }
});

const updatedAddress = await response.json();
```

### 4. Delete Address
```typescript
await fetch(`http://localhost:5000/api/user/address/${addressId}`, {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${idToken}`
  }
});
```

---

## Checkout Page Flow

### 1. Fetch All Checkout Data (Single Call)
```typescript
const response = await fetch('http://localhost:5000/api/user/checkout', {
  headers: {
    'Authorization': `Bearer ${idToken}`
  }
});

const checkoutData = await response.json();

// Response structure:
// {
//   user: {
//     id: "uuid",
//     email: "user@example.com",
//     name: "John Doe",
//     phone: null
//   },
//   addresses: [
//     {
//       id: "address-id",
//       name: "Home",
//       phone: "9876543210",
//       address: "123 Main Street",
//       city: "Mumbai",
//       pincode: "400001",
//       state: "Maharashtra",
//       isDefault: true
//     }
//   ],
//   cart: {
//     items: [...],
//     totals: {
//       subtotal: 1101.00,
//       gst: 198.18,
//       discount: 0,
//       grandTotal: 1101.00
//     }
//   }
// }

// Use this data to:
// - Display user info
// - Display saved addresses
// - Show cart with prices
// - Pre-select default address
```

---

## Order Placement Flow

### 1. Place Order from Cart
```typescript
const response = await fetch('http://localhost:5000/api/orders/place', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${idToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    addressId: "selected-address-id"  // From user selection
  })
});

if (response.ok) {
  const order = await response.json();
  
  // Order created successfully
  // Response includes:
  // {
  //   id: "order-id",
  //   status: "PENDING",
  //   totalAmount: 1101.00,
  //   gstAmount: 198.18,
  //   items: [...],
  //   address: {...},
  //   createdAt: "...",
  //   updatedAt: "..."
  // }
  
  // Redirect to order confirmation page
  navigate(`/order/${order.id}`);
} else {
  const error = await response.json();
  // Handle error (empty cart, invalid address, etc.)
}
```

---

## Order Management Flow

### 1. Get My Orders
```typescript
const response = await fetch('http://localhost:5000/api/orders/my', {
  headers: {
    'Authorization': `Bearer ${idToken}`
  }
});

const myOrders = await response.json();
// Array of orders ordered by most recent first
```

### 2. Get Specific Order
```typescript
const response = await fetch(`http://localhost:5000/api/orders/${orderId}`, {
  headers: {
    'Authorization': `Bearer ${idToken}`
  }
});

const order = await response.json();
```

### 3. Cancel Order (Only PENDING orders)
```typescript
const response = await fetch(`http://localhost:5000/api/orders/${orderId}/cancel`, {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${idToken}`
  }
});

if (response.ok) {
  const cancelledOrder = await response.json();
  // Order cancelled and stock restored
}
```

---

## Price Calculation Display

When showing cart/order items:

```typescript
// For each cart item:
const item = {
  unitPrice: 550.50,          // Show this as "Price per unit"
  quantity: 2,
  totalPrice: 1101.00,        // Show as "Item Total"
  gstAmount: 198.18,          // Show in tax breakdown
  discountAmount: 0,          // Show if > 0
  product: {
    basePrice: 500,           // Optional: show original price
    discountPercent: 0
  }
};

// Display:
// Price per unit: ₹550.50
// Quantity: 2
// Item Total: ₹1,101.00
// Tax (GST): ₹198.18

// Cart Totals:
// Subtotal: ₹1,101.00
// Tax: ₹198.18
// Discount: ₹0
// Total: ₹1,101.00
```

---

## Error Handling

```typescript
async function apiCall(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    if (!response.ok) {
      const error = await response.json();
      
      switch (response.status) {
        case 401:
          // Token invalid/expired, redirect to login
          redirectToLogin();
          break;
        case 403:
          // Unauthorized (e.g., accessing other user's order)
          showError('You do not have permission to access this');
          break;
        case 400:
          // Bad request (validation error)
          showError(error.message);
          break;
        case 404:
          // Not found
          showError('Item not found');
          break;
        case 500:
          // Server error
          showError('Server error, please try again later');
          break;
      }
      return null;
    }

    return await response.json();
  } catch (error) {
    showError('Network error, please check your connection');
    return null;
  }
}
```

---

## Service Layer Example (React)

```typescript
// services/checkoutService.ts
import { auth } from './firebase';

const API_BASE = 'http://localhost:5000/api';

export const checkoutService = {
  async getIdToken() {
    return await auth.currentUser?.getIdToken();
  },

  async apiCall(url, options = {}) {
    const idToken = await this.getIdToken();
    return fetch(`${API_BASE}${url}`, {
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
  },

  async getCheckoutData() {
    const response = await this.apiCall('/user/checkout');
    if (!response.ok) throw new Error('Failed to fetch checkout data');
    return response.json();
  },

  async placeOrder(addressId) {
    const response = await this.apiCall('/orders/place', {
      method: 'POST',
      body: JSON.stringify({ addressId })
    });
    if (!response.ok) throw new Error('Failed to place order');
    return response.json();
  },

  async addAddress(address) {
    const response = await this.apiCall('/user/address', {
      method: 'POST',
      body: JSON.stringify(address)
    });
    if (!response.ok) throw new Error('Failed to add address');
    return response.json();
  },

  async getAddresses() {
    const response = await this.apiCall('/user/address');
    if (!response.ok) throw new Error('Failed to fetch addresses');
    return response.json();
  },

  async mergeCart(cartItems) {
    const response = await this.apiCall('/cart/merge', {
      method: 'POST',
      body: JSON.stringify({ cartItems })
    });
    if (!response.ok) throw new Error('Failed to merge cart');
    return response.json();
  },

  async getCart() {
    const response = await this.apiCall('/cart');
    if (!response.ok) throw new Error('Failed to fetch cart');
    return response.json();
  }
};
```

---

## Complete Checkout Page Flow

```typescript
// pages/CheckoutPage.tsx
import { useEffect, useState } from 'react';
import { checkoutService } from '../services/checkoutService';

export default function CheckoutPage() {
  const [checkoutData, setCheckoutData] = useState(null);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        // Merge any guest cart first
        const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
        if (guestCart.length > 0) {
          await checkoutService.mergeCart(guestCart);
          localStorage.removeItem('guestCart');
        }

        // Fetch all checkout data
        const data = await checkoutService.getCheckoutData();
        setCheckoutData(data);
        
        // Pre-select default address
        const defaultAddr = data.addresses.find(a => a.isDefault);
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr.id);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      setError('Please select an address');
      return;
    }

    try {
      const order = await checkoutService.placeOrder(selectedAddressId);
      // Navigate to order confirmation
      window.location.href = `/order/${order.id}`;
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!checkoutData) return <div>No data</div>;

  return (
    <div>
      {/* User Section */}
      <section>
        <h2>User Info</h2>
        <p>Email: {checkoutData.user.email}</p>
        <p>Name: {checkoutData.user.name}</p>
      </section>

      {/* Address Selection */}
      <section>
        <h2>Delivery Address</h2>
        {checkoutData.addresses.map(addr => (
          <label key={addr.id}>
            <input
              type="radio"
              checked={selectedAddressId === addr.id}
              onChange={() => setSelectedAddressId(addr.id)}
            />
            {addr.name} - {addr.address}, {addr.city}
          </label>
        ))}
      </section>

      {/* Cart Summary */}
      <section>
        <h2>Order Summary</h2>
        {checkoutData.cart.items.map(item => (
          <div key={item.id}>
            <p>{item.product.name}</p>
            <p>₹{item.unitPrice} × {item.quantity} = ₹{item.totalPrice}</p>
          </div>
        ))}
        
        <div>
          <p>Subtotal: ₹{checkoutData.cart.totals.subtotal}</p>
          <p>Tax (GST): ₹{checkoutData.cart.totals.gst}</p>
          <p>
            <strong>Total: ₹{checkoutData.cart.totals.grandTotal}</strong>
          </p>
        </div>
      </section>

      {/* Place Order Button */}
      <button onClick={handlePlaceOrder}>
        Place Order (No Payment Yet)
      </button>
    </div>
  );
}
```

---

## Key Points for Frontend

1. **Always send Firebase ID token** in `Authorization` header
2. **Merge guest cart** immediately after login
3. **Single checkout data call** covers everything needed
4. **Cart totals include GST** - no additional calculation
5. **Address validation** done by backend - just pass addressId
6. **Order placement is transactional** - cart cleared automatically
7. **Error responses** follow standard HTTP status codes
8. **No payment processing yet** - just order placement with PENDING status

---

## Environment Setup

```bash
# Backend base URL
REACT_APP_API_URL=http://localhost:5000/api

# Firebase config
REACT_APP_FIREBASE_API_KEY=...
REACT_APP_FIREBASE_AUTH_DOMAIN=...
```

---

## Status Codes to Handle

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Process response |
| 201 | Created | Process response (order created) |
| 400 | Bad Request | Show validation error |
| 401 | Unauthorized | Redirect to login |
| 403 | Forbidden | Show permission error |
| 404 | Not Found | Show not found error |
| 500 | Server Error | Show error and retry |
