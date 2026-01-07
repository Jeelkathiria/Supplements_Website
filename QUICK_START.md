# 🚀 Quick Start Guide - Authentication & Address System

## What's Implemented

### ✅ User Authentication (Email/Password)
- **Register** - Create account with name, email, password
- **Login** - Sign in with email/password
- **Backend Sync** - User data automatically stored in PostgreSQL after Firebase auth
- **Session Management** - JWT tokens stored locally for API authentication

### ✅ Address Management
- **Save Addresses** - Users can save multiple delivery addresses
- **Select for Checkout** - Choose saved address or enter new one
- **Save on Checkout** - Option to save new address for future use
- **Default Address** - Backend support for marking address as default (UI coming soon)

### ✅ Checkout Integration
- **Address Selection** - Radio buttons for saved addresses
- **New Address Form** - Street, city, state, pincode fields
- **Auto-save Checkbox** - "Save this address for future orders"
- **Order Placement** - Creates order with selected/entered address

---

## 🎯 Testing the System

### **Scenario 1: New User Registration**

```
1. Open: http://localhost:5173/register
2. Fill in:
   - Full Name: "John Doe"
   - Email: "john@example.com"
   - Password: "SecurePass123" (must have: 8+ chars, uppercase, lowercase, number)
   - Confirm: "SecurePass123"
   - ✓ Check "I agree to Terms..."
3. Click "Create Account"
4. Result: Redirected to dashboard
   - Firebase creates user account
   - Backend creates User record with firebaseUid
   - User stored in PostgreSQL ✅
```

### **Scenario 2: User Login**

```
1. Open: http://localhost:5173/login
2. Fill in:
   - Email: "john@example.com"
   - Password: "SecurePass123"
3. Click "Sign In"
4. Result: Logged in successfully
   - JWT token stored in localStorage
   - User data loaded in AuthContext
   - Ready to shop ✅
```

### **Scenario 3: Add Address During First Checkout**

```
1. Add items to cart
2. Go to checkout (redirects to /login if not logged in)
3. See "No saved addresses. Add one below."
4. Fill address form:
   - Full Name: "John Doe"
   - Phone: "9876543210"
   - Street: "123 Main Street"
   - City: "Mumbai"
   - State: "Maharashtra"
   - Pincode: "400001"
5. ✓ Check "Save this address for future orders"
6. Click "Place Order"
7. Result:
   - Address saved to PostgreSQL ✅
   - Toast: "Address saved for future use"
   - Order created with this address
   - Redirects to order confirmation
```

### **Scenario 4: Reuse Saved Address**

```
1. Add items to cart again
2. Go to checkout
3. See saved address with radio button:
   - "John Doe | 123 Main Street, Mumbai, 400001"
4. Address already selected (default)
5. Click "Place Order"
6. Result:
   - Uses saved address (no new save toast)
   - Order placed ✅
```

### **Scenario 5: Use Different Address**

```
1. In checkout, saved address is selected
2. Click "Use a different address" radio button
3. Form appears with empty fields
4. Fill new address (or edit existing)
5. OPTION A: Check "Save this address..." → saves to DB
6. OPTION B: Leave unchecked → one-time use only
7. Click "Place Order"
8. Result: Order uses this address ✅
```

---

## 📁 Key Files & What They Do

### Frontend
| File | Purpose |
|------|---------|
| [frontend/src/app/pages/Login.tsx](frontend/src/app/pages/Login.tsx) | Email/password login form |
| [frontend/src/app/pages/Register.tsx](frontend/src/app/pages/Register.tsx) | Email/password registration form |
| [frontend/src/app/context/AuthContext.tsx](frontend/src/app/context/AuthContext.tsx) | Auth state + backend sync |
| [frontend/src/services/userService.ts](frontend/src/services/userService.ts) | Address CRUD operations |
| [frontend/src/app/pages/Checkout.tsx](frontend/src/app/pages/Checkout.tsx) | Address selection + order |

### Backend
| File | Purpose |
|------|---------|
| [backend/src/controllers/userController.ts](backend/src/controllers/userController.ts) | User sync, address CRUD logic |
| [backend/src/routes/user.ts](backend/src/routes/user.ts) | API endpoints for user/address |
| [backend/prisma/schema.prisma](backend/prisma/schema.prisma) | User & Address database models |

---

## 🔧 How It Works Behind the Scenes

### **Registration Process**
```
User clicks "Create Account"
    ↓
Frontend calls: createUserWithEmailAndPassword(email, password)
    ↓
Firebase creates user + issues JWT token
    ↓
AuthContext detects auth state change (onAuthStateChanged)
    ↓
AuthContext gets JWT token from Firebase
    ↓
AuthContext calls: POST /api/user/sync with Bearer token
    ↓
Backend extracts firebaseUid from JWT
    ↓
Backend creates User in PostgreSQL:
    - firebaseUid: "firebase123abc" (unique)
    - email: "john@example.com"
    - name: "John Doe"
    ↓
Frontend redirects to dashboard/checkout
```

### **Save Address Process**
```
User checks "Save this address for future orders"
    ↓
User clicks "Place Order"
    ↓
Frontend calls: userService.addAddress(addressData)
    ↓
Frontend gets JWT token from Firebase
    ↓
Frontend sends: POST /api/user/address with Bearer token
    ↓
Backend extracts firebaseUid from JWT
    ↓
Backend looks up: User where firebaseUid = "firebase123abc"
    ↓
Backend creates Address:
    - userId: (from User lookup)
    - name, phone, address, city, pincode
    - isDefault: false
    ↓
Frontend shows toast: "Address saved for future use"
    ↓
Order placed with this address
```

### **Fetch Addresses on Checkout**
```
User goes to checkout
    ↓
Checkout component calls: userService.getAddresses()
    ↓
Frontend gets JWT token
    ↓
Frontend sends: GET /api/user/address with Bearer token
    ↓
Backend looks up User by firebaseUid
    ↓
Backend queries: Address where userId = (user's id)
    ↓
Backend returns list of addresses
    ↓
Frontend displays as radio buttons (name + full address)
    ↓
User selects one
```

---

## 🛡️ Security Features

✅ **Passwords** - Hashed by Firebase (never stored in DB)
✅ **JWT Tokens** - Used for backend API authentication
✅ **Data Isolation** - Users can only access their own addresses
✅ **Token Storage** - localStorage (can move to cookies later)
✅ **Error Handling** - Generic messages (don't leak user info)

---

## 📊 Database Structure

### **User Table** (PostgreSQL)
```sql
id           VARCHAR(36)  PRIMARY KEY (auto-generated)
firebaseUid  VARCHAR(255) UNIQUE (Firebase user ID from JWT)
email        VARCHAR(255) NOT NULL (from Firebase)
name         VARCHAR(255) (optional, from form)
phone        VARCHAR(20)  (optional)
createdAt    TIMESTAMP    (auto)
updatedAt    TIMESTAMP    (auto)
```

### **Address Table** (PostgreSQL)
```sql
id           VARCHAR(36)  PRIMARY KEY
userId       VARCHAR(36)  FOREIGN KEY → User.id
name         VARCHAR(255) NOT NULL
phone        VARCHAR(20)  NOT NULL
address      TEXT         NOT NULL
city         VARCHAR(100) NOT NULL
state        VARCHAR(100)
pincode      VARCHAR(10)  NOT NULL
isDefault    BOOLEAN      DEFAULT false
createdAt    TIMESTAMP    (auto)
updatedAt    TIMESTAMP    (auto)
```

---

## ❌ Common Issues & Fixes

### **Issue: "Failed to load saved addresses"**
**Solution:**
- Make sure you're logged in (check localStorage for authToken)
- Verify backend is running on correct port
- Check VITE_API_URL environment variable
- Ensure PostgreSQL is running

### **Issue: "Address failed to save"**
**Solution:**
- Fill ALL address fields (name, phone, street, city, pincode)
- Check internet connection
- Verify user is authenticated
- Try again

### **Issue: "Registration failed"**
**Solution:**
- Password must: 8+ characters, 1 uppercase, 1 lowercase, 1 number
- Email must be valid format
- Passwords must match exactly
- Try a different email (might already exist)

### **Issue: Can't see saved addresses on second checkout**
**Solution:**
- Clear localStorage and log back in
- Check address was actually saved (look in DB)
- Make sure User and Address records linked by userId
- Try refreshing page

---

## 🎨 User Experience Flow

```
┌─────────────────────────────────────────────────────┐
│  NEW VISITOR                                        │
├─────────────────────────────────────────────────────┤
│  1. Browse products                                 │
│  2. Add to cart                                     │
│  3. Go to checkout → Redirected to /login          │
│  4. Click "Sign up" → /register                    │
│  5. Fill form + create account → Firebase user    │
│  6. Redirected to checkout                         │
│  7. No saved addresses → Fill address form        │
│  8. Check "Save address" + place order ✓         │
│  9. Address now saved for next order              │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  RETURNING CUSTOMER                                 │
├─────────────────────────────────────────────────────┤
│  1. Add items to cart                              │
│  2. Checkout                                       │
│  3. See saved address (pre-selected)              │
│  4. Click "Place Order" → Done! ✓                 │
│                                                     │
│  OR: Use different address                         │
│  3. Click "Use a different address"               │
│  4. Enter new address                             │
│  5. Optionally save for future                    │
│  6. Click "Place Order" ✓                         │
└─────────────────────────────────────────────────────┘
```

---

## ✨ Features Added This Session

✅ Email/password registration form (Register.tsx)
✅ Email/password login form (Login.tsx)
✅ Firebase authentication (createUserWithEmailAndPassword, signInWithEmailAndPassword)
✅ Backend user sync after Firebase auth
✅ PostgreSQL User & Address models with firebaseUid bridge
✅ User CRUD endpoints (sync, create)
✅ Address CRUD endpoints (add, get, set default, delete)
✅ Frontend userService for address operations
✅ Checkout integration with address selection
✅ **NEW:** "Save this address for future orders" checkbox in checkout
✅ **NEW:** Automatic address saving during checkout submission
✅ Toast notifications for user feedback

---

## 🎯 Next Steps (When Needed)

- [ ] Google OAuth button (user deferred)
- [ ] Profile page to manage addresses
- [ ] Edit address functionality
- [ ] Set default address from profile
- [ ] Order history with past addresses
- [ ] Phone verification
- [ ] Email verification
- [ ] Password reset

---

**You're all set!** The authentication and address management system is fully functional. 🚀
