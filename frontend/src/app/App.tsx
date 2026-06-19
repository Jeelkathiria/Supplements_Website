import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from './components/ui/sonner';
import { CartProvider } from './components/context/CartContext';
import { AuthProvider } from './components/context/AuthContext';
import { FavoritesProvider } from './components/context/FavoritesContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { Categories } from './pages/Categories';
import { Admin } from './pages/Admin';
import { ProductListing } from './pages/ProductListing';
import { ProductDetail } from './pages/ProductDetail';
import { Cart } from './pages/Cart';
import { Checkout } from './pages/Checkout';
import { OrderSuccess } from './pages/OrderSuccess';
import { Auth } from './pages/Auth';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';
import { Dashboard } from './pages/Dashboard';
import { Account } from './pages/Account';
import { AccountProfile } from './pages/AccountProfile';
import { AccountAddresses } from './pages/AccountAddresses';
import { AccountOrders } from './pages/AccountOrders';
import { AccountFavourites } from './pages/AccountFavourites';
import { OrderDetail } from './pages/OrderDetail';
import { CancellationTicket } from './pages/CancellationTicket';
import { RequestCancellation } from './pages/RequestCancellation';
import { NotFound } from './pages/NotFound';
import { ContactUs } from './pages/ContactUs';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminRoute } from './components/AdminRoute';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useScrollToTop } from './hooks/useScrollToTop';

function AppContent() {
  useScrollToTop();
  
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/categories" element={<Categories />} />
                  <Route path="/products" element={<ProductListing />} />
                  <Route path="/product/:id" element={<ProductDetail />} />
                  <Route path="/admin" element={
                    <AdminRoute>
                      <Admin />
                    </AdminRoute>
                  } />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/order-success/:orderId" element={<OrderSuccess />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/contact" element={<ContactUs />} />
                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/account" element={
                    <ProtectedRoute>
                      <Account />
                    </ProtectedRoute>
                  }>
                    <Route path="profile" element={<AccountProfile />} />
                    <Route path="addresses" element={<AccountAddresses />} />
                    <Route path="orders" element={<AccountOrders />} />
                    <Route path="favourites" element={<AccountFavourites />} />
                    <Route index element={<AccountProfile />} />
                  </Route>
                  <Route path="/account/order/:orderId" element={
                    <ProtectedRoute>
                      <OrderDetail />
                    </ProtectedRoute>
                  } />
                  <Route path="/order/:orderId" element={
                    <ProtectedRoute>
                      <OrderDetail />
                    </ProtectedRoute>
                  } />
                  <Route path="/cancellation-ticket/:orderId" element={
                    <ProtectedRoute>
                      <CancellationTicket />
                    </ProtectedRoute>
                  } />
                  <Route path="/request-cancellation/:orderId" element={
                    <ProtectedRoute>
                      <RequestCancellation />
                    </ProtectedRoute>
                  } />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
              <Footer />
              <Toaster 
                position="top-right" 
                toastOptions={{
                  style: {
                    marginTop: '80px',
                  }
                }}
              />
            </>
          );
        }
        
export default function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <CartProvider>
            <FavoritesProvider>
              <div className="min-h-screen flex flex-col bg-white overflow-x-hidden">
                <AppContent />
              </div>
            </FavoritesProvider>
          </CartProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}