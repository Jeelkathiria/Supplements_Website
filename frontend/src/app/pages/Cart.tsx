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
  const { cartItems, updateQuantity, removeFromCart, getCartTotal, isLoading, error } = useCart();
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
    <div className="min-h-screen bg-neutral-50 py-20">
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
                  className={`bg-white rounded-xl border border-neutral-200 p-5 hover:shadow-md transition ${
                    isRemoving ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex gap-5">
                    {/* Image */}
                    <div className="flex-shrink-0">
                      <Link to={`/product/${item.product.id}`}>
                        <img
                          src={getFullImageUrl(item.product.imageUrls?.[0] || '')}
                          alt={item.product.name}
                          className="w-24 h-24 object-cover rounded-lg border border-neutral-200 hover:shadow-md transition cursor-pointer"
                        />
                      </Link>
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/product/${item.product.id}`}
                        className="font-semibold text-lg text-neutral-900 hover:text-neutral-600 transition line-clamp-2"
                      >
                        {item.product.name}
                      </Link>

                      {item.product.description && (
                        <p className="text-sm text-neutral-600 mt-1 line-clamp-1">
                          {item.product.description}
                        </p>
                      )}

                      <div className="mt-3 space-y-1 text-sm">
                        {item.selectedSize && (
                          <p className="text-neutral-700">
                            <span className="font-medium">Size:</span> {item.selectedSize}
                          </p>
                        )}
                        {item.selectedColor && (
                          <p className="text-neutral-700">
                            <span className="font-medium">Flavor:</span> {item.selectedColor}
                          </p>
                        )}
                      </div>

                      <div className="mt-3 space-y-1 text-sm bg-neutral-50 p-3 rounded">
                        <div className="flex justify-between">
                          <span className="text-neutral-600">Base Price (×{item.quantity}):</span>
                          <span className="font-medium">₹{(basePrice * item.quantity).toFixed(0)}</span>
                        </div>
                        {discountPercent > 0 && (
                          <div className="flex justify-between text-green-600">
                            <span>Discount ({discountPercent}%):</span>
                            <span>-₹{((basePrice - finalPrice) * item.quantity).toFixed(0)}</span>
                          </div>
                        )}
                        <div className="border-t border-neutral-200 mt-1 pt-1 flex justify-between font-bold text-neutral-900">
                          <span>Item Total (×{item.quantity}):</span>
                          <span>₹{itemTotal.toFixed(0)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Quantity & Actions */}
                    <div className="flex flex-col items-end justify-between gap-3">
                      <div className="text-right">
                        {item.product.isVegetarian ? (
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-6 h-6 border-2 border-green-600 rounded-full flex items-center justify-center">
                              <div className="w-4 h-4 bg-green-600 rounded-full"></div>
                            </div>
                            <span className="text-xs font-medium text-green-700">Vegetarian</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-6 h-6 border-2 border-red-600 rounded-full flex items-center justify-center">
                              <div className="w-4 h-4 bg-red-600 rounded-full"></div>
                            </div>
                            <span className="text-xs font-medium text-red-700">Non-Veg</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 bg-neutral-100 rounded-lg p-1.5">
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
                          className="w-8 h-8 border border-neutral-300 rounded hover:bg-neutral-200 disabled:opacity-50 flex items-center justify-center transition"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-medium text-sm">{item.quantity}</span>
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
                          className="w-8 h-8 border border-neutral-300 rounded hover:bg-neutral-200 disabled:opacity-50 flex items-center justify-center transition"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      <button
                        onClick={() =>
                          handleRemoveItem(item.product.id, item.selectedSize, item.selectedColor)
                        }
                        disabled={isRemoving}
                        className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1 disabled:opacity-50 transition"
                      >
                        <Trash2 className="w-3 h-3" />
                        {isRemoving ? 'Removing...' : 'Remove'}
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
  );
};