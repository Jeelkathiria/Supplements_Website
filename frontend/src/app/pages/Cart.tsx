import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Trash2, Plus, Minus, ShoppingBag, AlertCircle, Loader, Wifi, Signal,
  Battery, ChevronLeft, Gift, X, Sparkles, Check, ArrowRight, ShieldCheck,
  Home, Bell, Heart, User, ArrowLeft, ChevronRight
} from 'lucide-react';
import { useCart } from '../components/context/CartContext';
import { useAuth } from '../components/context/AuthContext';
import { CheckoutCouponInput } from '../components/CheckoutCouponInput';
import { getCartItemPrice, getProductPricing } from '../utils/pricingUtils';
import { getFullImageUrl } from '../utils/imageUtils';
import { Breadcrumb } from '../components/Breadcrumb';
import { fetchProducts } from '../../services/productService';
import * as couponService from '../../services/couponService';
import { toast } from 'sonner';
import { Product } from '../types';



export const Cart: React.FC = () => {
  const { cartItems, addToCart, updateQuantity, removeFromCart, isLoading, error } = useCart();
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

  const couponDiscount = appliedCoupon 
    ? (finalSubtotal * appliedCoupon.discountPercent) / 100 
    : 0;

  // if no tax / shipping
  const total = finalSubtotal - couponDiscount;

  // Mobile UI States & Handlers
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [time, setTime] = useState('12:00 PM');
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    trainerName: string;
    discountPercent: number;
    discountAmount: number;
  } | null>(null);

  const getItemKey = (productId: string, size?: string, color?: string) => {
    return `${productId}-${size || ''}-${color || ''}`;
  };

  // Clock Update for Mobile
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      setTime(`${hours}:${minutes} ${ampm}`);
    };
    updateClock();
    const interval = setInterval(updateClock, 10000);
    return () => clearInterval(interval);
  }, []);

  // Fetch cross-sell suggestions for Mobile
  useEffect(() => {
    const loadSuggestions = async () => {
      try {
        const allProducts = await fetchProducts();
        const cartProductIds = new Set(cartItems.map(item => item.product.id));
        const filtered = allProducts.filter(p => !cartProductIds.has(p.id) && !p.isOutOfStock);
        setSuggestions(filtered.slice(0, 5));
      } catch (err) {
        console.error('Failed to load cross-sell suggestions:', err);
      }
    };
    if (cartItems.length > 0) {
      loadSuggestions();
    }
  }, [cartItems]);

  // Load applied coupon from sessionStorage
  useEffect(() => {
    const saved = sessionStorage.getItem('applied_coupon');
    if (saved) {
      try {
        setAppliedCoupon(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved coupon:', e);
      }
    }
  }, []);

  const handleApplyCoupon = async (codeOverride?: string) => {
    const codeToApply = (codeOverride || couponCode).toUpperCase().trim();
    if (!codeToApply) {
      setCouponError('Please enter a coupon code');
      return;
    }
    setCouponError(null);
    setIsValidatingCoupon(true);

    try {
      const response = await couponService.validateCoupon(codeToApply, finalSubtotal);
      if (!response.isValid) {
        setCouponError(response.error || 'Invalid coupon code');
        toast.error(response.error || 'Invalid coupon code');
        return;
      }

      const coupon = response.coupon;
      const discountAmount = (finalSubtotal * coupon.discountPercent) / 100;
      const applied = {
        code: coupon.code,
        trainerName: coupon.trainerName || 'Trainer Code',
        discountPercent: coupon.discountPercent,
        discountAmount
      };

      setAppliedCoupon(applied);
      sessionStorage.setItem('applied_coupon', JSON.stringify(applied));
      setCouponCode('');
      toast.success(`Coupon "${coupon.code}" applied! Save ₹${discountAmount.toFixed(0)}`);
    } catch (err) {
      console.error('Coupon validation error:', err);
      setCouponError(err instanceof Error ? err.message : 'Failed to apply coupon');
      toast.error('Coupon validation failed');
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    sessionStorage.removeItem('applied_coupon');
    toast.success('Coupon removed');
  };

  const handleAddSuggestion = async (product: Product) => {
    try {
      const variants = product.productVariants || product.variants || [];
      const defaultVariant = variants[0];
      const size = defaultVariant?.size;
      const color = defaultVariant?.flavor;

      await addToCart(product, 1, size, color);
      toast.success(`${product.name} added to cart!`);
    } catch (err) {
      console.error('Failed to add suggestion:', err);
      toast.error('Could not add item');
    }
  };

  const productDiscountAmount = baseSubtotal - finalSubtotal;
  const couponDiscountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const freeShippingThreshold = 999;
  const isFreeShipping = finalSubtotal >= freeShippingThreshold;
  const shippingFee = isFreeShipping || cartItems.length === 0 ? 0 : 99;
  const mobileOrderTotal = Math.max(0, finalSubtotal - couponDiscountAmount + shippingFee);
  const totalSavings = productDiscountAmount + couponDiscountAmount;
  const shippingProgress = Math.min(100, (finalSubtotal / freeShippingThreshold) * 100);

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

                  {/* Coupon Discount */}
                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-green-600 font-semibold">
                      <span>Coupon Discount ({appliedCoupon?.code})</span>
                      <span>-₹{couponDiscount.toFixed(0)}</span>
                    </div>
                  )}
                </div>

                {/* Coupon Input */}
                <div className="mb-6">
                  <CheckoutCouponInput
                    cartTotal={finalSubtotal}
                    onCouponApplied={(couponData) => {
                      setAppliedCoupon(couponData);
                      sessionStorage.setItem('applied_coupon', JSON.stringify(couponData));
                    }}
                    onCouponRemoved={() => {
                      setAppliedCoupon(null);
                      sessionStorage.removeItem('applied_coupon');
                    }}
                  />
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

      {/* MOBILE VIEW - REDESIGNED TO MATCH REFERENCE */}
      <div className="block md:hidden bg-white min-h-screen text-neutral-800 pb-36 select-none">

        {/* Mobile Header */}
        <div className="px-4 py-4 flex items-center gap-3 sticky top-0 bg-white z-30 border-b border-neutral-100">
          <button
            onClick={() => navigate(-1)}
            className="text-emerald-700 hover:opacity-80 transition p-1"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base font-bold text-emerald-800">View Cart</h1>
        </div>

        <div className="px-4 py-4">
          {error && (
            <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex gap-3 mb-4">
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
              <p className="text-rose-800 text-xs font-semibold leading-relaxed">{error}</p>
            </div>
          )}

          {cartItems.length === 0 ? (
            /* EMPTY STATE */
            <div className="flex flex-col items-center justify-center py-20 text-center px-6">
              <ShoppingBag className="w-12 h-12 text-neutral-300 mb-4" />
              <h2 className="text-base font-bold text-neutral-800 mb-1">Your cart is empty</h2>
              <p className="text-neutral-500 text-xs mb-6 max-w-[200px]">Add items from our catalog to get started.</p>
              <Link
                to="/products"
                className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition"
              >
                Shop Now
              </Link>
            </div>
          ) : (
            /* ACTIVE CART CONTENT */
            <div className="space-y-4">
              {/* Cart Items List */}
              <div className="space-y-4">
                {cartItems.map((item, index) => {
                  const price = getCartItemPrice(item.product, item.selectedSize, item.selectedColor);
                  const variants = item.product.productVariants || item.product.variants || [];
                  let basePrice = price;

                  if (item.selectedSize && item.selectedColor) {
                    const variant = variants.find(v => v.size === item.selectedSize && v.flavor === item.selectedColor);
                    if (variant) basePrice = variant.price;
                  }

                  const itemTotal = price * item.quantity;
                  const hasDiscount = basePrice > price;
                  const isUpdating = updatingItems.has(item.product.id);
                  const isRemoving = removingItems.has(item.product.id);

                  return (
                    <div
                      key={getItemKey(item.product.id, item.selectedSize, item.selectedColor)}
                      className={`space-y-4 transition-all duration-300 ${isRemoving ? 'opacity-20 scale-95' : ''}`}
                    >
                      <div className="flex gap-4 relative">

                        {/* Product Image */}
                        <div className="w-16 h-16 bg-neutral-100/60 rounded-xl flex items-center justify-center p-1.5 flex-shrink-0 border border-neutral-100">
                          <img
                            src={getFullImageUrl(item.product.imageUrls?.[0] || '')}
                            alt={item.product.name}
                            className="w-full h-full object-contain mix-blend-multiply"
                          />
                          {isUpdating && (
                            <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-xl">
                              <Loader className="w-4 h-4 text-emerald-700 animate-spin" />
                            </div>
                          )}
                        </div>

                        {/* Middle: Name, Price, Attributes */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                          <div>
                            <h3 className="text-xs font-bold text-neutral-800 line-clamp-2 leading-tight">
                              {item.product.name}
                            </h3>

                            {/* Price details */}
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="text-xs font-black text-neutral-900">₹{price.toFixed(0)}</span>
                              {hasDiscount && (
                                <span className="text-[10px] text-neutral-400 line-through">₹{basePrice.toFixed(0)}</span>
                              )}
                            </div>

                            {/* Attributes */}
                            <p className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider mt-0.5">
                              {[item.selectedSize, item.selectedColor].filter(Boolean).join(' • ')}
                            </p>
                          </div>
                        </div>

                        {/* Right: Remove & Quantity Steppers */}
                        <div className="flex flex-col justify-between items-end flex-shrink-0">
                          <button
                            onClick={() => handleRemoveItem(item.product.id, item.selectedSize, item.selectedColor)}
                            className="text-emerald-700 hover:text-rose-600 transition p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                          {/* Circular steppers */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleUpdateQuantity(item.product.id, item.quantity - 1, item.selectedSize, item.selectedColor)}
                              disabled={isUpdating || item.quantity <= 1}
                              className="w-6 h-6 rounded-full border border-neutral-350 hover:bg-neutral-50 flex items-center justify-center text-neutral-400 disabled:opacity-30 active:scale-90 transition"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-5 text-center text-xs font-bold text-neutral-800">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => handleUpdateQuantity(item.product.id, item.quantity + 1, item.selectedSize, item.selectedColor)}
                              disabled={isUpdating}
                              className="w-6 h-6 rounded-full border border-emerald-600 hover:bg-emerald-50 flex items-center justify-center text-emerald-650 font-bold active:scale-90 transition"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Dotted separator between items */}
                      {index < cartItems.length - 1 && (
                        <div className="border-b border-dashed border-neutral-250 pt-1" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Coupon Input */}
              <div className="mt-6">
                <CheckoutCouponInput
                  cartTotal={finalSubtotal}
                  onCouponApplied={(couponData) => {
                    setAppliedCoupon(couponData);
                    sessionStorage.setItem('applied_coupon', JSON.stringify(couponData));
                  }}
                  onCouponRemoved={() => {
                    setAppliedCoupon(null);
                    sessionStorage.removeItem('applied_coupon');
                  }}
                />
              </div>

              {/* Total Summary */}
              <div className="bg-emerald-50/25 border border-emerald-100/40 rounded-2xl p-4 mt-6 space-y-2.5 shadow-sm">
                <div className="flex justify-between text-xs font-medium text-neutral-500">
                  <span>Item Amount</span>
                  <span className="text-neutral-800">₹{baseSubtotal.toFixed(0)}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-xs font-medium text-neutral-500">
                    <span>Discount</span>
                    <span className="text-emerald-750 font-bold">-₹{discountAmount.toFixed(0)}</span>
                  </div>
                )}

                {couponDiscount > 0 && (
                  <div className="flex justify-between text-xs font-semibold text-green-700">
                    <span>Coupon Discount ({appliedCoupon?.code})</span>
                    <span>-₹{couponDiscount.toFixed(0)}</span>
                  </div>
                )}

                <div className="border-b border-dashed border-neutral-200/80 my-1" />

                <div className="flex justify-between text-xs font-bold text-neutral-800">
                  <span>Total Amount</span>
                  <span>₹{total.toFixed(0)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sticky Bottom Actions */}
        {cartItems.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-100 z-40 shadow-[0_-8px_30px_rgba(0,0,0,0.03)]">

            {/* Shipping Button */}
            <div className="px-5 py-4">
              <button
                onClick={handleProceedToCheckout}
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm tracking-wide active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                {isAuthenticated ? 'Shipping' : 'Login & Checkout'}
              </button>
            </div>

            {/* Bottom Nav Bar */}
            <div className="border-t border-neutral-100 bg-white py-3 px-8 flex justify-between items-center text-neutral-400 safe-area-bottom">
              <button onClick={() => navigate('/')} className="hover:text-emerald-700 transition">
                <Home size={18} />
              </button>
              <div className="bg-emerald-50 text-emerald-700 px-4 py-1.5 rounded-full flex items-center gap-1.5 font-bold text-[11px] uppercase tracking-wider">
                <ShoppingBag size={12} /> Cart
              </div>
              <button className="hover:text-emerald-700 transition">
                <Bell size={18} />
              </button>
              <button className="hover:text-emerald-700 transition">
                <Heart size={18} />
              </button>
              <button onClick={() => navigate('/profile')} className="hover:text-emerald-700 transition">
                <User size={18} />
              </button>
            </div>
          </div>
        )}
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
        }
      `}</style>
    </div>
  );
};