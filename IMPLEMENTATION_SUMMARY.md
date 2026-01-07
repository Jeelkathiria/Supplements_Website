# Authentication & Address Management Implementation Summary

## ✅ Completed Features

### 1. Email/Password Authentication
- **Frontend Login** ([frontend/src/app/pages/Login.tsx](frontend/src/app/pages/Login.tsx))
  - Email/password input form
  - Firebase authentication via `signInWithEmailAndPassword()`
  - Auto-redirect to checkout if coming from cart
  - Error handling and loading states
  
- **Frontend Registration** ([frontend/src/app/pages/Register.tsx](frontend/src/app/pages/Register.tsx))
  - Email/password form with name input
  - Password strength requirements (8+ chars, uppercase, lowercase, number)
  - Confirm password validation
  - Terms & Privacy Policy agreement checkbox
  - Firebase authentication via `createUserWithEmailAndPassword()`
  - Calls `register(name, email, password)` from AuthContext
  
- **Backend User Sync** ([backend/src/controllers/userController.ts](backend/src/controllers/userController.ts) - `syncUser`)
  - Triggered immediately after Firebase auth via AuthContext
  - Creates User record in PostgreSQL with firebaseUid bridge
  - Stores: firebaseUid (unique), email, name, timestamps
  - Endpoint: POST `/api/user/sync` (requires Bearer token)

### 2. AuthContext with Backend Integration
**File:** [frontend/src/app/context/AuthContext.tsx](frontend/src/app/context/AuthContext.tsx)

- **Auth Functions:**
  - `login(email, password)` - Firebase signin + token storage
  - `register(name, email, password)` - Firebase signup + token storage
  - `logout()` - Clears Firebase session and storage
  - `getIdToken()` - Gets current Firebase JWT token
  - `updateUser(userData)` - Updates local user state

- **Automatic User Sync:**
  - `onAuthStateChanged()` listener syncs with backend
  - After Firebase auth, calls `/api/user/sync` with Bearer token
  - Backend creates User record in PostgreSQL using firebaseUid
  - Stores authToken in localStorage for API requests

- **State Management:**
  - `user` - Local user object (email, name, loginTime)
  - `firebaseUser` - Firebase user object
  - `isAuthenticated` - Boolean derived from user presence
  - `redirectAfterLogin` - Stores URL for post-login redirect

### 3. Address Management System

#### Backend Endpoints ([backend/src/routes/user.ts](backend/src/routes/user.ts))
All endpoints require Bearer token (Firebase JWT):

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/user/sync` | POST | Create/update user in PostgreSQL |
| `/api/user/address` | POST | Add new address |
| `/api/user/address` | GET | Fetch all user addresses |
| `/api/user/address/:id/default` | PATCH | Set address as default |
| `/api/user/address/:id` | DELETE | Delete address |

#### Database Schema ([backend/prisma/schema.prisma](backend/prisma/schema.prisma))
```prisma
model User {
  id            String     @id @default(cuid())
  firebaseUid   String     @unique  // Bridge to Firebase
  email         String
  name          String?
  phone         String?
  addresses     Address[]  // Relation to addresses
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt
}

model Address {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  name      String
  phone     String
  address   String
  city      String
  pincode   String
  state     String?
  isDefault Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

#### Frontend Service ([frontend/src/services/userService.ts](frontend/src/services/userService.ts))
- `getAddresses()` - Fetch all saved addresses
- `addAddress(data)` - Create new address (auto-saves to DB)
- `setDefaultAddress(addressId)` - Mark address as default
- `deleteAddress(addressId)` - Delete address
- All functions include auth token handling and error management

### 4. Checkout with Address Selection & Saving

**File:** [frontend/src/app/pages/Checkout.tsx](frontend/src/app/pages/Checkout.tsx)

**Features:**
- Loads saved addresses on mount with loading state
- Radio button selection for existing addresses
- Toggle to use new address instead
- Form to enter new address (name, phone, street, city, state, pincode)
- **NEW:** "Save this address for future orders" checkbox
- If checkbox checked, address is saved to backend during checkout
- Address validation before order submission
- Toast notifications for success/error states

**Flow:**
```
1. User arrives at Checkout (after login redirect)
2. Component loads saved addresses from backend
3. User selects existing address OR toggles to new address form
4. If new address: user can optionally save it for future use
5. On order submission:
   - If "Save address" checked → calls userService.addAddress()
   - Creates Order with delivery address
   - Redirects to Order Confirmation
```

### 5. Cart Integration with Flavor/Size
**File:** [frontend/src/services/cartService.ts](frontend/src/services/cartService.ts)

- `addToCart()` now accepts `flavor` and `size` parameters
- Stored in CartItem table with: productId, quantity, price, flavor, size
- Sent to backend during checkout with order items

---

## 🏗️ Architecture Overview

### Authentication Flow
```
User Registration/Login
    ↓
Firebase creates user + JWT token
    ↓
AuthContext stores token in localStorage
    ↓
AuthContext calls /api/user/sync with Bearer token
    ↓
Backend extracts firebaseUid from JWT
    ↓
Creates User record in PostgreSQL
    ↓
Frontend stores user data in localStorage & AuthContext
```

### Address Management Flow
```
User adds address in Checkout
    ↓
"Save address" checkbox enabled
    ↓
On checkout: userService.addAddress() called
    ↓
Backend receives POST /api/user/address with auth token
    ↓
Backend gets userId from firebaseUid lookup
    ↓
Creates Address record linked to User
    ↓
Address available for future orders
```

### Order Submission with Address
```
User selects/enters address
    ↓
User submits checkout form
    ↓
Validates address fields
    ↓
If new address + "save" checked → saves to DB
    ↓
Creates Order with deliveryAddress object
    ↓
Order includes: items (with flavor/size), address, total, paymentMethod
```

---

## 📋 Testing Checklist

### Manual Testing Steps:

**1. Register New User**
- [ ] Navigate to `/register`
- [ ] Enter name, email, password (meet requirements)
- [ ] Confirm password matches
- [ ] Check "Agree to Terms"
- [ ] Click "Create Account"
- [ ] Verify Firebase user created
- [ ] Verify User record in PostgreSQL
- [ ] Should redirect to dashboard or checkout if from cart

**2. Login User**
- [ ] Navigate to `/login`
- [ ] Enter email and password
- [ ] Click "Sign In"
- [ ] Verify JWT token stored in localStorage
- [ ] Verify user data loaded in AuthContext
- [ ] Verify User synced with backend

**3. Add Address During Checkout**
- [ ] Go to checkout (cart has items)
- [ ] If first time: no saved addresses shown
- [ ] Toggle "Use a different address"
- [ ] Fill all address fields
- [ ] Check "Save this address for future orders"
- [ ] Submit checkout
- [ ] Verify address saved in PostgreSQL
- [ ] Toast shows "Address saved for future use"

**4. Reuse Saved Address**
- [ ] Go back to checkout
- [ ] Verify saved address appears in list with radio button
- [ ] Select it
- [ ] Submit checkout
- [ ] Verify order uses selected address
- [ ] No "add address" toast (not saving new one)

**5. Set Default Address**
- [ ] Profile/Address Management (future feature)
- [ ] Should allow setting default address
- [ ] Default address should be pre-selected in checkout

---

## 🔐 Security Implementation

### Firebase Authentication
- Passwords hashed by Firebase (never stored in PostgreSQL)
- JWT token used for backend authentication
- `requireAuth` middleware validates token before processing requests

### Backend Protection
- All user routes require Bearer token in Authorization header
- Backend extracts firebaseUid from JWT via Firebase Admin SDK
- Database queries use firebaseUid → userId lookup to ensure user can only access their own data
- Address deletion checks user ownership before deleting

### Data Storage
- **Firebase**: Email, password, sessions (authentication)
- **PostgreSQL**: User profile (firebaseUid, email, name, phone) + addresses
- Never duplicate sensitive auth data in PostgreSQL
- firebaseUid is unique key linking Firebase to PostgreSQL

---

## 📦 Dependencies

### Frontend
- `firebase/auth` - Authentication
- `react-router-dom` - Navigation
- `sonner` - Toast notifications
- `lucide-react` - Icons

### Backend
- `firebase-admin` - JWT verification
- `@prisma/client` - Database ORM
- `express` - Server framework

---

## 🚀 Deployment Notes

1. **Environment Variables**
   - Frontend: `VITE_API_URL` - Backend API base URL
   - Frontend: Firebase config (in `frontend/src/firebase.ts`)
   - Backend: `DATABASE_URL` - PostgreSQL connection
   - Backend: `FIREBASE_PROJECT_ID`, `FIREBASE_PRIVATE_KEY`, etc. - Firebase Admin SDK

2. **Database Migrations**
   - Run `npx prisma migrate deploy` before starting backend
   - Ensures User and Address tables exist

3. **CORS**
   - Backend already has CORS enabled
   - Frontend can make cross-origin requests to backend

---

## 🔮 Future Enhancements

- [ ] Google OAuth sign-in (user deferred to "later")
- [ ] Profile page to manage addresses
- [ ] Order history with address information
- [ ] Address book with edit/delete
- [ ] Phone number verification via OTP
- [ ] Email verification on registration
- [ ] "Remember me" functionality
- [ ] Two-factor authentication

---

## 📞 Support Notes

If anything breaks during testing:

1. **"Failed to sync user with backend"**
   - Check backend is running
   - Verify `VITE_API_URL` is correct
   - Check Firebase credentials are valid
   - Check `requireAuth` middleware isn't throwing errors

2. **"Address failed to save"**
   - Verify user is authenticated (authToken exists)
   - Check all address fields are filled
   - Verify PostgreSQL is running and migrations applied
   - Check backend `/api/user/address` POST route

3. **Firebase auth errors**
   - Check Firebase project ID matches
   - Verify Firebase config in `frontend/src/firebase.ts`
   - Check Firebase credentials file exists in backend

4. **Can't see saved addresses**
   - Verify User record exists in PostgreSQL (check firebaseUid matches)
   - Check Address records have correct userId
   - Verify JWT token includes user information

---

**Status:** ✅ All core authentication and address management features implemented and ready for testing.
