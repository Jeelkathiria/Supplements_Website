# COUPON SYSTEM - INTEGRATION CODE SNIPPETS

## 🎯 How to Integrate into Existing Pages

---

## 1️⃣ ADMIN PAGE INTEGRATION

### File: `frontend/src/app/pages/Admin.tsx`

#### Step 1: Import the Component
```typescript
// Add this import at the top with other imports
import { AdminCoupon } from '../components/AdminCoupon';
```

#### Step 2: Add "coupons" to activeTab type
```typescript
// Update the type to include "coupons"
const [activeTabState, setActiveTabState] = useState<
  "products" | "orders" | "cancellations" | "cancelled-orders" | "refunds" | "coupons"
>(
  (localStorage.getItem("adminActiveTab") as any) || "orders"
);
```

#### Step 3: Add Tab Button (in Your Render/UI)
```typescript
// Find where your other tab buttons are and add this:
<button
  className={`px-4 py-2 rounded-lg transition ${
    activeTabState === 'coupons'
      ? 'bg-blue-600 text-white'
      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
  }`}
  onClick={() => {
    setActiveTab('coupons');
    setActiveTabState('coupons');
  }}
>
  🎟️ Coupons ({pendingOrdersCancellationCount})
</button>
```

#### Step 4: Add Tab Content (in Your Render)
```typescript
// Add this with your other tab content sections
{activeTabState === 'coupons' && (
  <AdminCoupon />
)}
```

#### Example Integration (Full Tab Button Bar):
```typescript
<div className="flex gap-2 flex-wrap mb-6">
  <button
    className={`px-4 py-2 rounded-lg transition ${
      activeTabState === 'orders'
        ? 'bg-blue-600 text-white'
        : 'bg-gray-200 hover:bg-gray-300'
    }`}
    onClick={() => {
      setActiveTab('orders');
      setActiveTabState('orders');
    }}
  >
    📦 Orders
  </button>

  <button
    className={`px-4 py-2 rounded-lg transition ${
      activeTabState === 'coupons'
        ? 'bg-blue-600 text-white'
        : 'bg-gray-200 hover:bg-gray-300'
    }`}
    onClick={() => {
      setActiveTab('coupons');
      setActiveTabState('coupons');
    }}
  >
    🎟️ Coupons
  </button>

  <button
    className={`px-4 py-2 rounded-lg transition ${
      activeTabState === 'cancellations'
        ? 'bg-blue-600 text-white'
        : 'bg-gray-200 hover:bg-gray-300'
    }`}
    onClick={() => {
      setActiveTab('cancellations');
      setActiveTabState('cancellations');
    }}
  >
    ❌ Cancellations
  </button>

  {/* ... other tabs ... */}
</div>

{/* Tab Content */}
{activeTabState === 'orders' && <AdminOrders />}
{activeTabState === 'coupons' && <AdminCoupon />}
{activeTabState === 'cancellations' && <AdminCancellationRequests />}
```

---

## 2️⃣ CHECKOUT PAGE INTEGRATION

### File: `frontend/src/app/pages/Checkout.tsx`

#### Step 1: Import Components and Services
```typescript
// Add at the top with other imports
import { CheckoutCouponInput } from '../components/CheckoutCouponInput';
import * as couponService from '../../services/couponService';
```

#### Step 2: Add State for Applied Coupon
```typescript
// Add this to your useState declarations in Checkout component
const [appliedCoupon, setAppliedCoupon] = useState<{
  code: string;
  trainerName: string;
  discountAmount: number;
  discountPercent: number;
} | null>(null);
```

#### Step 3: Add Coupon Component (in Your JSX)
```typescript
// Add this BEFORE your payment method selection or after address selection
// Usually place it in the "Order Summary" or "Cart Details" section

<div className="mt-6 border-t pt-6">
  <h3 className="text-lg font-semibold mb-4">Apply Discount Code</h3>
  
  <CheckoutCouponInput
    cartTotal={cartTotal} // Your current cart total
    onCouponApplied={(couponData) => {
      setAppliedCoupon(couponData);
      console.log('Coupon applied:', couponData);
    }}
    onCouponRemoved={() => {
      setAppliedCoupon(null);
      console.log('Coupon removed');
    }}
    disabled={isProcessing}
    authToken={idToken}
  />
</div>
```

#### Step 4: Update Total Calculation
```typescript
// Update wherever you calculate the final total
const subtotal = cartTotal; // Your original cart total
const discountAmount = appliedCoupon?.discountAmount || 0;
const finalTotal = subtotal - discountAmount;

// Display in your UI:
<div className="space-y-2 text-lg">
  <div className="flex justify-between">
    <span>Subtotal:</span>
    <span>₹{subtotal.toFixed(2)}</span>
  </div>
  
  {appliedCoupon && (
    <div className="flex justify-between text-green-600 font-semibold">
      <span>Discount ({appliedCoupon.discountPercent}%):</span>
      <span>-₹{discountAmount.toFixed(2)}</span>
    </div>
  )}
  
  <div className="border-t pt-2 flex justify-between font-bold text-xl">
    <span>Total:</span>
    <span>₹{finalTotal.toFixed(2)}</span>
  </div>
</div>
```

#### Step 5: Submit Order with Coupon (Update Place Order Function)
```typescript
// In your placeOrder or similar function
const handlePlaceOrder = async () => {
  try {
    const orderData = {
      addressId: selectedAddressId,
      paymentMethod: paymentMethod,
      couponCode: appliedCoupon?.code, // ADD THIS LINE
      // ... other order data
    };

    const response = await orderService.placeOrder(orderData, idToken);
    
    // Success handling...
    toast.success('Order placed successfully!');
    
  } catch (error) {
    toast.error('Failed to place order');
  }
};
```

#### Example Complete Checkout Section:
```typescript
{/* COUPON SECTION */}
<div className="bg-white p-6 rounded-lg mb-6">
  <h2 className="text-2xl font-bold mb-6">🎁 Apply Discount Code</h2>
  
  <CheckoutCouponInput
    cartTotal={subtotal}
    onCouponApplied={(couponData) => {
      setAppliedCoupon(couponData);
    }}
    onCouponRemoved={() => {
      setAppliedCoupon(null);
    }}
    disabled={isProcessing}
  />
</div>

{/* PRICE SUMMARY SECTION */}
<div className="bg-white p-6 rounded-lg mb-6">
  <h2 className="text-2xl font-bold mb-6">💰 Order Summary</h2>
  
  <div className="space-y-3">
    <div className="flex justify-between text-lg">
      <span className="text-gray-700">Subtotal:</span>
      <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
    </div>

    <div className="flex justify-between text-lg">
      <span className="text-gray-700">Shipping:</span>
      <span className="font-semibold">₹0.00</span>
    </div>

    {appliedCoupon && (
      <div className="flex justify-between text-lg bg-green-50 p-3 rounded">
        <span className="text-green-700 font-semibold">
          Discount ({appliedCoupon.trainerName}) {appliedCoupon.discountPercent}%:
        </span>
        <span className="text-green-700 font-bold">
          -₹{appliedCoupon.discountAmount.toFixed(2)}
        </span>
      </div>
    )}

    <div className="border-t pt-3 flex justify-between text-2xl font-bold">
      <span>Total Amount:</span>
      <span>₹{(subtotal - (appliedCoupon?.discountAmount || 0)).toFixed(2)}</span>
    </div>
  </div>
</div>

{/* PAYMENT METHOD SECTION */}
<div className="bg-white p-6 rounded-lg">
  <h2 className="text-2xl font-bold mb-6">💳 Payment Method</h2>
  
  {/* Your payment method selection code */}
  
  <button
    onClick={handlePlaceOrder}
    disabled={isProcessing}
    className="w-full bg-green-600 text-white py-3 rounded-lg font-bold text-lg hover:bg-green-700 disabled:opacity-50"
  >
    {isProcessing ? 'Processing...' : 'Place Order'}
  </button>
</div>
```

---

## 3️⃣ ORDER SERVICE UPDATE (Backend Integration)

### File: `frontend/src/services/orderService.ts`

#### Update placeOrder Function
```typescript
// Update the type definition
interface PlaceOrderData {
  addressId: string;
  paymentMethod: 'cod' | 'upi';
  couponCode?: string; // ADD THIS
}

// Update the function
export const placeOrder = async (
  data: PlaceOrderData,
  token: string
) => {
  const response = await fetch(`${API_BASE_URL}/orders/place`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data), // This now includes couponCode
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to place order');
  }

  return response.json();
};
```

---

## 4️⃣ COMPLETE USAGE EXAMPLE

### Minimal Working Example
```typescript
// Checkout.tsx
import React, { useState } from 'react';
import { CheckoutCouponInput } from '../components/CheckoutCouponInput';

interface AppliedCoupon {
  code: string;
  discountAmount: number;
}

export const CheckoutExample: React.FC = () => {
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const cartTotal = 1299.99;

  return (
    <div className="p-6">
      {/* Header */}
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      {/* Coupon Section */}
      <CheckoutCouponInput
        cartTotal={cartTotal}
        onCouponApplied={(data) => {
          setAppliedCoupon({
            code: data.code,
            discountAmount: data.discountAmount,
          });
        }}
        onCouponRemoved={() => {
          setAppliedCoupon(null);
        }}
      />

      {/* Price Summary */}
      <div className="mt-8 bg-gray-50 p-6 rounded-lg">
        <div className="flex justify-between mb-4">
          <span>Subtotal:</span>
          <span>₹{cartTotal.toFixed(2)}</span>
        </div>

        {appliedCoupon && (
          <div className="flex justify-between text-green-600 mb-4 font-semibold">
            <span>Discount:</span>
            <span>-₹{appliedCoupon.discountAmount.toFixed(2)}</span>
          </div>
        )}

        <div className="border-t pt-4 flex justify-between font-bold text-xl">
          <span>Total:</span>
          <span>
            ₹{(cartTotal - (appliedCoupon?.discountAmount || 0)).toFixed(2)}
          </span>
        </div>
      </div>

      {/* Place Order Button */}
      <button className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700">
        Place Order
      </button>
    </div>
  );
};
```

---

## 5️⃣ API CALL EXAMPLES (Using the Service)

### Admin: Create Coupon
```typescript
import * as couponService from '../../services/couponService';

const createNewCoupon = async (token: string) => {
  try {
    const response = await couponService.createCoupon(
      {
        trainerName: "John Fitness",
        trainerId: "trainer-123",
        discountPercent: 10,
        maxUses: 100,
        expiryDate: "2026-12-31"
      },
      token
    );
    
    console.log('Coupon created:', response.coupon.code);
    // Output: "JOHN_FITNESS_10" or similar
  } catch (error) {
    console.error('Failed to create:', error);
  }
};
```

### Customer: Validate Coupon
```typescript
const validateUserCoupon = async (code: string) => {
  try {
    const response = await couponService.validateCoupon(code);
    
    if (response.isValid) {
      console.log('✅ Valid coupon:', response.coupon);
      // response.coupon = {
      //   id: "uuid",
      //   code: "JOHN_10",
      //   trainerName: "John Fitness",
      //   discountPercent: 10
      // }
    } else {
      console.log('❌ Invalid:', response.error); // "Invalid coupon code"
    }
  } catch (error) {
    console.error('Validation error:', error);
  }
};
```

### Admin: Get Commission Report
```typescript
const generateReport = async (trainerName: string, token: string) => {
  try {
    const response = await couponService.getTrainerCommissionReport(
      trainerName,
      token
    );
    
    console.log('📊 Commission Report:', {
      totalCouponsIssued: response.report.totalCouponsIssued,
      totalUsages: response.report.totalUsages,
      totalDiscount: response.report.totalDiscountGiven,
    });
    
    // Calculate commission (example: 5% of discount)
    const commission = (response.report.totalDiscountGiven * 5) / 100;
    console.log('💰 Commission (5%):', commission);
  } catch (error) {
    console.error('Report error:', error);
  }
};
```

---

## 6️⃣ ERROR HANDLING PATTERNS

### Proper Error Handling in Components
```typescript
const [error, setError] = useState<string | null>(null);
const [loading, setLoading] = useState(false);

const handleApplyCoupon = async (code: string) => {
  try {
    setError(null);
    setLoading(true);
    
    const response = await couponService.validateCoupon(code);
    
    if (!response.isValid) {
      setError(response.error); // Show user-friendly error
      return;
    }
    
    // Success - update state
    setAppliedCoupon({...});
    
  } catch (error) {
    // Network or server error
    const message = error instanceof Error ? error.message : "Unknown error";
    setError(`Failed to validate coupon: ${message}`);
    toast.error(message);
    
  } finally {
    setLoading(false);
  }
};

// In your render:
{error && (
  <div className="bg-red-50 border border-red-200 p-3 rounded text-red-800">
    {error}
  </div>
)}
```

---

## 7️⃣ TESTING THE INTEGRATION

### Quick Test Steps
1. **Create Coupon:**
   - Go to Admin → Coupons tab
   - Enter "Test User" as trainer name
   - Click "Create Coupon"
   - Copy the generated code (e.g., "TEST_USER_10")

2. **Apply at Checkout:**
   - Add items to cart
   - Go to checkout
   - Paste coupon code
   - Click "Apply"
   - Verify discount shown in total

3. **Verify in Database:**
   ```sql
   -- Check coupon was created
   SELECT * FROM "Coupon" WHERE "code" LIKE 'TEST%';
   
   -- Check coupon was applied
   SELECT * FROM "AppliedCoupon" WHERE "userId" = '{your-user-id}';
   ```

---

## 📝 IMPORTANT NOTES

1. **Pass couponCode to Backend** - When placing order, include coupon code
2. **Update Order Model** - Backend must handle couponCode parameter
3. **Test Thoroughly** - Test both valid and invalid coupons
4. **Error Messages** - Show user-friendly messages
5. **Loading States** - Show loading while validating
6. **Accessibility** - Add ARIA labels and keyboard support

---

Ready to integrate? Follow the steps above! 🚀
