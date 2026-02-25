import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, AlertCircle, Loader } from 'lucide-react';
import { useCart } from '../components/context/CartContext';
import { useAuth } from '../components/context/AuthContext';
import { calculateFinalPrice } from '../data/products';
import { Breadcrumb } from '../components/Breadcrumb';

// Helper function to get full image URL
const getFullImageUrl = (imageUrl: string) => {
  if (!imageUrl) return '/placeholder.png';
  if (imageUrl.startsWith('http')) return imageUrl;
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const backendBase = apiBase.replace('/api', '');
  return `${backendBase}${imageUrl}`;
};

export const Cart: React.FC = () => {
  const { cartItems, updateQuantity, removeFromCart, isLoading, error } = useCart();
  const { isAuthenticated, setRedirectAfterLogin } = useAuth();
  const navigate = useNavigate();
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());
  const [removingItems, setRemovingItems] = useState<Set<string>>(new Set());

  const handleProceedToCheckout = () => {
    if (!isAuthenticated) {
      // Save checkout intent and redirect to login
      setRedirectAfterLogin('/checkout');
      navigate('/login?redirect=checkout');
    } else {
      // User is authenticated, proceed to checkout
      navigate('/checkout');
    }
  };

  const handleUpdateQuantity = async (productId: string, newQuantity: number, selectedSize?: string, selectedColor?: string) => {
    setUpdatingItems(prev => new Set(prev).add(productId));
    try {
      await updateQuantity(productId, newQuantity, selectedSize, selectedColor);
    } catch (error) {
      console.error('Failed to update quantity:', error);
    } finally {
      setUpdatingItems(prev => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
    }
  };

  const handleRemoveItem = async (productId: string, selectedSize?: string, selectedColor?: string) => {
    setRemovingItems(prev => new Set(prev).add(productId));
    try {
      await removeFromCart(productId, selectedSize, selectedColor);
    } catch (error) {
      console.error('Failed to remove item:', error);
    } finally {
      setRemovingItems(prev => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-6">
        <div className="text-center">
          <Loader className="w-12 h-12 mx-auto text-neutral-400 animate-spin mb-4" />
          <p className="text-neutral-600">Loading your cart...</p>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-neutral-50 py-20">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12">
          <Breadcrumb
            items={[
              { label: 'Home', path: '/' },
              { label: 'Cart' },
            ]}
          />
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <ShoppingBag className="w-20 h-20 mx-auto text-neutral-300 mb-8" />
              <h2 className="text-2xl font-bold mb-2">Your Cart is Empty</h2>
              <p className="text-neutral-600 mb-6">Start adding some products!</p>
              <Link
                to="/products"
                className="inline-block bg-neutral-900 text-white px-8 py-3 rounded-lg hover:bg-neutral-800 transition"
              >
                Shop Now
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const baseSubtotal = cartItems.reduce(
    (sum, item) => sum + (item.product.basePrice || 0) * item.quantity,
    0
  );

  const finalSubtotal = cartItems.reduce(
    (sum, item) => {
      const finalPrice = calculateFinalPrice(item.product.basePrice, item.product.discountPercent || 0);
      return sum + finalPrice * item.quantity;
    },
    0
  );

  const discountAmount = baseSubtotal - finalSubtotal;

  // if no tax / shipping
  const total = finalSubtotal;

  return (
    <div className="min-h-screen bg-neutral-50 pb-24 md:pb-0">
      {/* LAPTOP VIEW - UNTOUCHED */}
      <div className="hidden md:block py-20">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12">
          <Breadcrumb
            items={[
              { label: 'Home', path: '/' },
              { label: 'Cart' },
            ]}
          />
          <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-red-900">Error</h3>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => {
                const basePrice = item.product.basePrice;
                const discountPercent = item.product.discountPercent || 0;

                const finalPrice = calculateFinalPrice(basePrice, discountPercent);
                const itemTotal = finalPrice * item.quantity;
                const isUpdating = updatingItems.has(item.product.id);
                const isRemoving = removingItems.has(item.product.id);

                return (
                  <div
                    key={`${item.product.id}-${item.selectedSize}-${item.selectedColor}`}
                    className={`bg-white rounded-xl border border-neutral-200 p-5 hover:shadow-md transition ${isRemoving ? 'opacity-50' : ''
                      }`}
                  >
                    <div className="flex flex-col sm:flex-row gap-5">
                      {/* Image and Basic Info Row */}
                      <div className="flex gap-4 sm:gap-5">
                        {/* Image */}
                        <div className="flex-shrink-0">
                          <Link to={`/product/${item.product.id}`}>
                            <img
                              src={getFullImageUrl(item.product.imageUrls?.[0] || '')}
                              alt={item.product.name}
                              className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg border border-neutral-200 hover:shadow-md transition cursor-pointer"
                            />
                          </Link>
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <Link
                            to={`/product/${item.product.id}`}
                            className="font-bold text-base sm:text-lg text-neutral-900 hover:text-neutral-600 transition line-clamp-2 leading-tight"
                          >
                            {item.product.name}
                          </Link>

                          <div className="mt-2 space-y-0.5 text-xs sm:text-sm">
                            {item.selectedSize && (
                              <p className="text-neutral-500">
                                <span className="font-medium">Size:</span> {item.selectedSize}
                              </p>
                            )}
                            {item.selectedColor && (
                              <p className="text-neutral-500">
                                <span className="font-medium">Flavor:</span> {item.selectedColor}
                              </p>
                            )}
                          </div>

                          <div className="mt-2 font-bold text-teal-800 sm:hidden">
                            ₹{itemTotal.toFixed(0)}
                          </div>
                        </div>
                      </div>

                      {/* Price & Actions container */}
                      <div className="flex-1 flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-between gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-neutral-100">

                        <div className="hidden sm:block mt-3 space-y-1 text-sm bg-neutral-50 p-3 rounded w-full max-w-[200px]">
                          <div className="flex justify-between">
                            <span className="text-neutral-600 font-medium text-[10px] uppercase tracking-wider">Subtotal</span>
                            <span className="font-bold">₹{itemTotal.toFixed(0)}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 bg-neutral-100 rounded-xl p-1">
                          <button
                            onClick={() =>
                              handleUpdateQuantity(
                                item.product.id,
                                item.quantity - 1,
                                item.selectedSize,
                                item.selectedColor
                              )
                            }
                            disabled={isUpdating || item.quantity <= 1}
                            className="w-8 h-8 rounded-lg bg-white border border-neutral-200 hover:bg-neutral-50 disabled:opacity-30 disabled:hover:bg-white flex items-center justify-center transition shadow-sm"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-6 text-center font-bold text-sm">{item.quantity}</span>
                          <button
                            onClick={() =>
                              handleUpdateQuantity(
                                item.product.id,
                                item.quantity + 1,
                                item.selectedSize,
                                item.selectedColor
                              )
                            }
                            disabled={isUpdating}
                            className="w-8 h-8 rounded-lg bg-white border border-neutral-200 hover:bg-neutral-50 disabled:opacity-30 disabled:hover:bg-white flex items-center justify-center transition shadow-sm"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <button
                          onClick={() =>
                            handleRemoveItem(item.product.id, item.selectedSize, item.selectedColor)
                          }
                          disabled={isRemoving}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50"
                          title="Remove item"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Order Summary Sidebar */}
            <div>
              <div className="bg-white rounded-xl border border-neutral-200 p-6 sticky top-24 shadow-sm">
                <h2 className="text-xl font-bold mb-6 pb-4 border-b border-neutral-200">
                  Order Summary
                </h2>

                {/* Price Breakdown */}
                <div className="space-y-3 pb-6 mb-6 border-b border-neutral-200 text-sm">
                  {/* Base Price */}
                  <div className="flex justify-between">
                    <span className="text-neutral-600">
                      Base Price ({cartItems.length} items)
                    </span>
                    <span className="font-medium">
                      ₹{baseSubtotal.toFixed(2)}
                    </span>
                  </div>

                  {/* Discount */}
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-₹{discountAmount.toFixed(2)}</span>
                    </div>
                  )}

                  {/* Subtotal after discount */}
                  <div className="flex justify-between font-semibold">
                    <span className="text-neutral-800">Subtotal</span>
                    <span>₹{finalSubtotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Total */}
                <div className="flex justify-between font-bold text-lg mb-6 pb-6 border-b border-neutral-200">
                  <span>Total</span>
                  <span className="text-xl">₹{total.toFixed(2)}</span>
                </div>

                {/* CTA */}
                <button
                  onClick={handleProceedToCheckout}
                  className="w-full bg-teal-800 text-white py-3 rounded-lg hover:bg-teal-900 transition font-semibold mb-3"
                >
                  {isAuthenticated ? "Proceed to Checkout" : "Login & Checkout"}
                </button>

                <Link
                  to="/products"
                  className="block text-center text-sm text-neutral-600 hover:text-neutral-900 font-medium"
                >
                  Continue Shopping
                </Link>

                {/* Notes */}
                <div className="mt-6 pt-4 border-t border-neutral-200 space-y-2 text-xs text-neutral-500">
                  <p className="flex items-start gap-2">
                    <span className="text-lg leading-none">✓</span>
                    <span>Order placed before 4pm will be shipped on the same day</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="text-lg leading-none">✓</span>
                    <span>Secure checkout</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE VIEW - PREMIUM REDESIGN */}
      <div className="block md:hidden bg-white min-h-screen">
        {/* Mobile Header */}
        <div className="px-5 pt-8 pb-4 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-30 border-b border-neutral-50">
          <h1 className="text-2xl font-black text-[#003D45] tracking-tight">Your Cart</h1>
          <span className="bg-[#003D45] text-white text-[10px] font-black px-2.5 py-1 rounded-full">{cartItems.length} ITEMS</span>
        </div>

        <div className="px-5 py-6 space-y-6">
          {error && (
            <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
              <p className="text-rose-800 text-xs font-semibold leading-relaxed">{error}</p>
            </div>
          )}

          {/* Cart Items List */}
          <div className="space-y-6">
            {cartItems.map((item) => {
              const finalPrice = calculateFinalPrice(item.product.basePrice, item.product.discountPercent || 0);
              const isUpdating = updatingItems.has(item.product.id);
              const isRemoving = removingItems.has(item.product.id);

              return (
                <div
                  key={`${item.product.id}-${item.selectedSize}-${item.selectedColor}`}
                  className={`relative group transition-all duration-300 ${isRemoving ? 'opacity-30 scale-95' : ''}`}
                >
                  <div className="flex gap-4">
                    {/* Premium Image Container */}
                    <div className="w-28 h-28 bg-neutral-50 rounded-2xl overflow-hidden flex-shrink-0 border border-neutral-100 shadow-sm relative">
                      <img
                        src={getFullImageUrl(item.product.imageUrls?.[0] || '')}
                        alt={item.product.name}
                        className="w-full h-full object-contain p-2 mix-blend-multiply"
                      />
                      {isUpdating && (
                        <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
                          <Loader className="w-6 h-6 text-[#003D45] animate-spin" />
                        </div>
                      )}
                    </div>

                    {/* Item Details */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-sm font-bold text-[#003D45] line-clamp-2 leading-tight flex-1">
                            {item.product.name}
                          </h3>
                          <button
                            onClick={() => handleRemoveItem(item.product.id, item.selectedSize, item.selectedColor)}
                            className="p-1.5 text-neutral-300 hover:text-rose-500 active:scale-90 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex flex-wrap gap-2 mt-2">
                          {item.selectedSize && (
                            <span className="text-[10px] font-bold text-[#003D45]/40 bg-neutral-100 px-2 py-0.5 rounded-md uppercase tracking-wider">{item.selectedSize}</span>
                          )}
                          {item.selectedColor && (
                            <span className="text-[10px] font-bold text-[#003D45]/40 bg-neutral-100 px-2 py-0.5 rounded-md uppercase tracking-wider">{item.selectedColor}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        <span className="text-lg font-black text-[#003D45]">₹{finalPrice.toFixed(0)}</span>

                        {/* Mobile Quantity Controls */}
                        <div className="flex items-center bg-neutral-50 rounded-xl h-10 px-0.5 shadow-inner border border-neutral-100">
                          <button
                            onClick={() => handleUpdateQuantity(item.product.id, item.quantity - 1, item.selectedSize, item.selectedColor)}
                            disabled={isUpdating || item.quantity <= 1}
                            className="w-8 h-8 flex items-center justify-center text-[#003D45] text-lg font-black disabled:opacity-20"
                          >
                            −
                          </button>
                          <span className="w-6 text-center font-black text-[#003D45] text-xs">{item.quantity}</span>
                          <button
                            onClick={() => handleUpdateQuantity(item.product.id, item.quantity + 1, item.selectedSize, item.selectedColor)}
                            disabled={isUpdating}
                            className="w-8 h-8 flex items-center justify-center text-[#003D45] text-lg font-black disabled:opacity-20"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Savings Message */}
          {discountAmount > 0 && (
            <div className="bg-[#E9FAF1] border border-[#C6EFD9] rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-[#008A45] rounded-full flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#008A45]/20">
                <AlertCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-[#008A45] text-[10px] font-black uppercase tracking-[0.1em]">Total Savings</p>
                <p className="text-[#008A45] font-bold">You're saving ₹{discountAmount.toFixed(0)} on this order!</p>
              </div>
            </div>
          )}

          {/* Summary Details */}
          <div className="pt-6 border-t border-neutral-100 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-neutral-400 text-xs font-bold uppercase tracking-widest">Base Amount</span>
              <span className="text-neutral-500 font-bold">₹{baseSubtotal.toFixed(0)}</span>
            </div>
            <div className="flex justify-between items-center text-[#008A45]">
              <span className="text-xs font-bold uppercase tracking-widest">Discount Applied</span>
              <span className="font-bold">-₹{discountAmount.toFixed(0)}</span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-neutral-50">
              <span className="text-[#003D45] text-sm font-black uppercase tracking-widest">Order Total</span>
              <span className="text-[#003D45] text-2xl font-black">₹{total.toFixed(0)}</span>
            </div>
          </div>
        </div>

        {/* STICKY BOTTOM ACTION BAR */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-neutral-100 p-5 z-[60] safe-area-bottom">
          <div className="flex gap-4 items-center">
            <div className="flex-1 space-y-0.5">
              <p className="text-neutral-400 text-[10px] font-bold uppercase tracking-widest">Total Pay</p>
              <p className="text-2xl font-black text-[#003D45]">₹{total.toFixed(0)}</p>
            </div>

            <button
              onClick={handleProceedToCheckout}
              className="px-10 h-14 bg-[#003D45] text-white rounded-[1.25rem] font-black text-xs tracking-[0.2em] shadow-xl shadow-[#003D45]/30 active:scale-[0.98] transition-all uppercase flex items-center justify-center gap-2"
            >
              {isAuthenticated ? 'CHECKOUT' : 'LOGIN & PAY'}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .safe-area-bottom {
          padding-bottom: env(safe-area-inset-bottom, 0px);
          margin-bottom: 20px;
        }
      `}</style>
    </div>
  );
};