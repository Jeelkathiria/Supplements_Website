import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, AlertCircle, Loader } from 'lucide-react';
import { useCart } from '../components/context/CartContext';
import { useAuth } from '../components/context/AuthContext';
import { getCartItemPrice } from '../utils/pricingUtils';
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
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
            <div className="w-24 h-24 bg-neutral-100 rounded-full flex items-center justify-center mb-8 relative">
              <ShoppingBag className="w-10 h-10 text-neutral-300" />
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm border border-neutral-100">
                <span className="text-[10px] font-black text-neutral-400">0</span>
              </div>
            </div>
            <h2 className="text-2xl font-[900] text-neutral-900 mb-3 tracking-tight">Your bag is empty</h2>
            <p className="text-neutral-500 mb-10 max-w-[280px] mx-auto text-sm leading-relaxed font-medium">
              Looks like you haven't added anything to your bag yet. Start exploring our premium supplements.
            </p>
            <Link
              to="/products"
              className="inline-flex items-center justify-center bg-teal-800 text-white px-10 py-4 rounded-2xl hover:bg-teal-900 transition-all font-black text-xs tracking-[0.2em] shadow-xl shadow-teal-800/20 active:scale-95 uppercase"
            >
              Start Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const baseSubtotal = cartItems.reduce(
    (sum, item) => {
      // Get the specific variant for this cart item
      const variants = item.product.productVariants || item.product.variants || [];
      let basePrice = 0;
      
      if (item.selectedSize && item.selectedColor) {
        const variant = variants.find(v => v.size === item.selectedSize && v.flavor === item.selectedColor);
        basePrice = variant ? variant.price : 0;
      } else if (item.selectedSize) {
        const sizeVariants = variants.filter(v => v.size === item.selectedSize);
        basePrice = sizeVariants.length > 0 ? Math.min(...sizeVariants.map(v => v.price)) : 0;
      } else if (variants.length > 0) {
        basePrice = Math.min(...variants.map(v => v.price));
      }
      
      return sum + (basePrice || 0) * item.quantity;
    },
    0
  );

  const finalSubtotal = cartItems.reduce(
    (sum, item) => {
      const price = getCartItemPrice(item.product, item.selectedSize, item.selectedColor);
      return sum + price * item.quantity;
    },
    0
  );

  const discountAmount = baseSubtotal - finalSubtotal;

  // if no tax / shipping
  const total = finalSubtotal;

  return (
    <div className="min-h-screen bg-neutral-50 pb-24 md:pb-0">
      {/* LAPTOP VIEW */}
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
                // Get the specific variant for this cart item
                const variants = item.product.productVariants || item.product.variants || [];
                let basePrice = 0;
                let finalPrice = 0;
                let discountPercent = 0;
                
                if (item.selectedSize && item.selectedColor) {
                  // Find exact variant match
                  const variant = variants.find(v => v.size === item.selectedSize && v.flavor === item.selectedColor);
                  if (variant) {
                    basePrice = variant.price;
                    finalPrice = variant.finalPrice || variant.price;
                    discountPercent = variant.discountType === "percent" ? variant.discount : 0;
                  }
                } else if (item.selectedSize) {
                  // Find minimum price for size
                  const sizeVariants = variants.filter(v => v.size === item.selectedSize);
                  if (sizeVariants.length > 0) {
                    const minVariant = sizeVariants.reduce((min, v) => 
                      (v.finalPrice || v.price) < (min.finalPrice || min.price) ? v : min
                    );
                    basePrice = minVariant.price;
                    finalPrice = minVariant.finalPrice || minVariant.price;
                    discountPercent = minVariant.discountType === "percent" ? minVariant.discount : 0;
                  }
                } else {
                  // Fallback to minimum price across all variants
                  if (variants.length > 0) {
                    const minVariant = variants.reduce((min, v) =>
                      (v.finalPrice || v.price) < (min.finalPrice || min.price) ? v : min
                    );
                    basePrice = minVariant.price;
                    finalPrice = minVariant.finalPrice || minVariant.price;
                    discountPercent = minVariant.discountType === "percent" ? minVariant.discount : 0;
                  }
                }
                
                const itemTotal = finalPrice * item.quantity;
                const isUpdating = updatingItems.has(item.product.id);
                const isRemoving = removingItems.has(item.product.id);

                return (
                  <div
                    key={`${item.product.id}-${item.selectedSize}-${item.selectedColor}`}
                    className={`bg-white rounded-xl border border-neutral-200 p-5 hover:shadow-lg hover:-translate-y-[2px] transition ${isRemoving ? "opacity-50" : ""}`}
                  >
                    <div className="flex flex-col sm:flex-row gap-5">

                      {/* Left Section */}
                      <div className="flex gap-5 flex-1">

                        {/* Product Image */}
                        <Link to={`/product/${item.product.id}`}>
                          <img
                            src={getFullImageUrl(item.product.imageUrls?.[0] || "")}
                            alt={item.product.name}
                            className="w-24 h-24 object-cover rounded-lg border border-neutral-200 hover:shadow-md transition"
                          />
                        </Link>

                        {/* Product Info */}
                        <div className="flex flex-col justify-between flex-1 min-w-0">

                          <div>
                            <Link
                              to={`/product/${item.product.id}`}
                              className="font-semibold text-lg text-neutral-900 hover:text-neutral-600 transition line-clamp-2"
                            >
                              {item.product.name}
                            </Link>

                            {/* Price */}
                            <div className="flex items-center gap-2 mt-2 text-sm">
                              <span className="font-bold text-neutral-900 text-base">
                                ₹{finalPrice.toFixed(0)}
                              </span>

                              {discountPercent > 0 && (
                                <>
                                  <span className="text-neutral-400 line-through">
                                    ₹{basePrice.toFixed(0)}
                                  </span>
                                  <span className="text-green-600 font-semibold">
                                    {discountPercent}% OFF
                                  </span>
                                </>
                              )}
                            </div>

                            {/* Savings */}
                            {discountPercent > 0 && (
                              <p className="text-xs text-green-600 font-medium">
                                You save ₹{(basePrice - finalPrice).toFixed(0)}
                              </p>
                            )}

                            {/* Meta */}
                            <div className="mt-2 text-xs text-neutral-500 space-y-0.5">
                              {item.selectedSize && (
                                <p>
                                  <span className="font-medium">Size:</span> {item.selectedSize}
                                </p>
                              )}
                              {item.selectedColor && (
                                <p>
                                  <span className="font-medium">Flavor:</span>{" "}
                                  {item.selectedColor}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right Section */}
                      <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between gap-4 border-t sm:border-0 pt-4 sm:pt-0">

                        {/* Quantity */}
                        <div className="flex items-center gap-1 bg-white border border-neutral-200 rounded-lg p-1 shadow-sm">
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
                            className="w-8 h-8 rounded-md hover:bg-neutral-100 flex items-center justify-center"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>

                          <span className="w-8 text-center font-semibold">
                            {item.quantity}
                          </span>

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
                            className="w-8 h-8 rounded-md hover:bg-neutral-100 flex items-center justify-center"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Subtotal */}
                        <div className="font-bold text-neutral-900 text-base">
                          ₹{itemTotal.toFixed(0)}
                        </div>

                        {/* Remove */}
                        <button
                          onClick={() =>
                            handleRemoveItem(
                              item.product.id,
                              item.selectedSize,
                              item.selectedColor
                            )
                          }
                          disabled={isRemoving}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-full transition"
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
                      ₹{baseSubtotal.toFixed(0)}
                    </span>
                  </div>

                  {/* Discount */}
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-₹{discountAmount.toFixed(0)}</span>
                    </div>
                  )}

                  {/* Subtotal after discount */}
                  <div className="flex justify-between font-semibold">
                    <span className="text-neutral-800">Subtotal</span>
                    <span>₹{finalSubtotal.toFixed(0)}</span>
                  </div>
                </div>

                {/* Total */}
                <div className="flex justify-between font-bold text-lg mb-6 pb-6 border-b border-neutral-200">
                  <span>Total</span>
                  <span className="text-xl">₹{total.toFixed(0)}</span>
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
        {/* Mobile Header - More Premium */}
        <div className="px-6 pt-10 pb-6 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-xl z-30 border-b border-neutral-100/50">
          <div>
            <h1 className="text-3xl font-[900] text-neutral-900 tracking-tight leading-none">Your Cart</h1>
            <p className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold mt-1.5">{cartItems.length} Products in Bag</p>
          </div>
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-neutral-50 flex items-center justify-center border border-neutral-200 active:scale-90 transition-transform"
          >
            <Plus className="w-5 h-5 rotate-45 text-neutral-400" />
          </button>
        </div>

        <div className="px-5 py-6 space-y-6">
          {error && (
            <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
              <p className="text-rose-800 text-xs font-semibold leading-relaxed">{error}</p>
            </div>
          )}

          {/* Cart Items List - Premium Cards */}
          <div className="space-y-4">
            {cartItems.map((item) => {
              // Get pricing info
              const price = getCartItemPrice(item.product, item.selectedSize, item.selectedColor);
              const variants = item.product.productVariants || item.product.variants || [];
              let basePrice = price;
              
              if (item.selectedSize && item.selectedColor) {
                const variant = variants.find(v => v.size === item.selectedSize && v.flavor === item.selectedColor);
                if (variant) basePrice = variant.price;
              }

              const itemTotal = price * item.quantity;
              const hasDiscount = basePrice > price;
              const discountPercent = hasDiscount ? Math.round(((basePrice - price) / basePrice) * 100) : 0;
              const isUpdating = updatingItems.has(item.product.id);
              const isRemoving = removingItems.has(item.product.id);

              return (
                <div
                  key={`${item.product.id}-${item.selectedSize}-${item.selectedColor}`}
                  className={`bg-white border border-neutral-100 rounded-3xl p-4 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] transition-all duration-300 ${isRemoving ? 'opacity-30 scale-95 translate-x-12' : ''}`}
                >
                  <div className="flex gap-4">
                    {/* Image Container */}
                    <div className="relative w-24 h-24 bg-neutral-50 rounded-2xl border border-neutral-100 flex items-center justify-center p-2 flex-shrink-0 group overflow-hidden">
                      <img
                        src={getFullImageUrl(item.product.imageUrls?.[0] || '')}
                        alt={item.product.name}
                        className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500"
                      />
                      {isUpdating && (
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] flex items-center justify-center">
                          <Loader className="w-5 h-5 text-teal-800 animate-spin" />
                        </div>
                      )}
                    </div>

                    {/* Details Column */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-1 mb-1">
                          <h3 className="text-sm font-bold text-neutral-800 line-clamp-2 leading-snug">
                            {item.product.name}
                          </h3>
                          <button
                            onClick={() => handleRemoveItem(item.product.id, item.selectedSize, item.selectedColor)}
                            className="p-1.5 text-neutral-300 hover:text-red-500 active:scale-75 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Variants info */}
                        <div className="flex flex-wrap gap-1 mb-2">
                          {item.selectedSize && (
                            <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-neutral-100 text-neutral-500 rounded-full">{item.selectedSize}</span>
                          )}
                          {item.selectedColor && (
                            <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-neutral-100 text-neutral-500 rounded-full">{item.selectedColor}</span>
                          )}
                        </div>

                        {/* Price Row */}
                        <div className="flex items-center gap-2">
                          <span className="text-base font-[900] text-neutral-900">₹{price.toFixed(0)}</span>
                          {hasDiscount && (
                            <span className="text-xs text-neutral-400 line-through">₹{basePrice.toFixed(0)}</span>
                          )}
                          {hasDiscount && (
                            <span className="text-[10px] font-black text-green-600 bg-green-50 px-1.5 py-0.5 rounded cursor-default">-{discountPercent}%</span>
                          )}
                        </div>
                      </div>

                      {/* Controls Row */}
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center bg-neutral-50 border border-neutral-100 rounded-xl px-1 py-0.5">
                          <button
                            onClick={() => handleUpdateQuantity(item.product.id, item.quantity - 1, item.selectedSize, item.selectedColor)}
                            disabled={isUpdating || item.quantity <= 1}
                            className="w-8 h-8 flex items-center justify-center text-neutral-400 disabled:opacity-20 active:bg-neutral-200 rounded-lg"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-8 text-center text-sm font-bold text-neutral-800">{item.quantity}</span>
                          <button
                            onClick={() => handleUpdateQuantity(item.product.id, item.quantity + 1, item.selectedSize, item.selectedColor)}
                            disabled={isUpdating}
                            className="w-8 h-8 flex items-center justify-center text-neutral-800 active:bg-neutral-200 rounded-lg"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-0.5 block">Subtotal</span>
                          <span className="text-lg font-[900] text-teal-800 italic leading-none">₹{itemTotal.toFixed(0)}</span>
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