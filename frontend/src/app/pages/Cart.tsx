import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { calculateFinalPrice } from '../data/products';
import { Breadcrumb } from '../components/Breadcrumb';

export const Cart: React.FC = () => {
  const { cartItems, updateQuantity, removeFromCart, getCartTotal } = useCart();
  const { isAuthenticated, setRedirectAfterLogin } = useAuth();
  const navigate = useNavigate();

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

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-6">
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
    );
  }

  const subtotal = getCartTotal();
  const shipping = subtotal > 499 ? 0 : 50;
  const total = subtotal + shipping;

  return (
    <div className="min-h-screen bg-neutral-50 py-20">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12">
        <Breadcrumb
          items={[
            { label: 'Home', path: '/' },
            { label: 'Cart' },
          ]}
        />
        <h1 className="text-3xl font-bold mb-12">Shopping Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            {cartItems.map((item) => {
              const basePrice = item.product.basePrice;
              const discountPercent = item.product.discountPercent || 0;
              const gstPercent = item.product.gstPercent || 0;
              
              const discountedPrice = basePrice - (basePrice * discountPercent / 100);
              const finalPrice = discountedPrice + (discountedPrice * gstPercent / 100);
              const itemTotal = finalPrice * item.quantity;

              return (
                <div
                  key={`${item.product.id}-${item.selectedSize}-${item.selectedColor}`}
                  className="bg-white rounded-xl border border-neutral-200 p-4 hover:shadow-md transition"
                >
                  <div className="flex gap-4">
                    {/* Image */}
                    <div className="flex-shrink-0">
                      <img
                        src={item.product.imageUrls?.[0] || "/placeholder.png"}
                        alt={item.product.name}
                        className="w-28 h-28 object-cover rounded-lg border border-neutral-200"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <Link 
                        to={`/product/${item.product.id}`}
                        className="font-bold text-lg hover:text-neutral-600 transition"
                      >
                        {item.product.name}
                      </Link>
                      
                      {item.product.description && (
                        <p className="text-sm text-neutral-600 mt-1 line-clamp-2">
                          {item.product.description}
                        </p>
                      )}

                      <div className="mt-3 space-y-1">
                        {item.selectedSize && (
                          <p className="text-sm text-neutral-700">
                            <span className="font-medium">Size:</span> {item.selectedSize}
                          </p>
                        )}
                        {item.selectedColor && (
                          <p className="text-sm text-neutral-700">
                            <span className="font-medium">Flavor:</span> {item.selectedColor}
                          </p>
                        )}
                        
                        <div className="text-sm text-neutral-600 space-y-1">
                          <p>
                            <span className="font-medium">Price:</span> ₹{basePrice.toFixed(2)}
                          </p>
                          {discountPercent > 0 && (
                            <p className="text-green-600">
                              <span className="font-medium">Discount:</span> -{discountPercent}% = ₹{(basePrice - discountedPrice).toFixed(2)}
                            </p>
                          )}
                          {gstPercent > 0 && (
                            <p>
                              <span className="font-medium">GST:</span> +{gstPercent}% = ₹{(finalPrice - discountedPrice).toFixed(2)}
                            </p>
                          )}
                          <p className="font-bold text-neutral-900 border-t pt-1">
                            <span className="font-medium">Final Price:</span> ₹{finalPrice.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col items-end gap-3">
                      <div className="text-right">
                        <p className="text-xs text-neutral-500">Subtotal (Qty: {item.quantity})</p>
                        <p className="text-lg font-bold text-neutral-900">
                          ₹{itemTotal.toFixed(2)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 bg-neutral-100 rounded-lg p-1">
                        <button
                          onClick={() =>
                            updateQuantity(item.product.id, item.quantity - 1, item.selectedSize, item.selectedColor)
                          }
                          className="w-8 h-8 border border-neutral-300 rounded hover:bg-neutral-200 flex items-center justify-center"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-medium">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.product.id, item.quantity + 1, item.selectedSize, item.selectedColor)
                          }
                          className="w-8 h-8 border border-neutral-300 rounded hover:bg-neutral-200 flex items-center justify-center"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.product.id, item.selectedSize, item.selectedColor)}
                        className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1 mt-2"
                      >
                        <Trash2 className="w-3 h-3" />
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order Summary */}
          <div>
            <div className="bg-white rounded-xl border border-neutral-200 p-6 sticky top-24">
              <h2 className="text-lg font-bold mb-6">Order Summary</h2>

              <div className="space-y-3 pb-4 mb-4 border-b border-neutral-200">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">Subtotal</span>
                  <span className="font-medium">
                    ₹{subtotal.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">Shipping</span>
                  <span className="font-medium">
                    {shipping === 0 ? 'FREE' : `₹${shipping}`}
                  </span>
                </div>

                {shipping > 0 && (
                  <p className="text-xs text-green-600">
                    Add ₹{(499 - subtotal).toFixed(2)} more for free shipping
                  </p>
                )}
              </div>

              <div className="flex justify-between font-bold text-lg mb-6">
                <span>Total</span>
                <span>₹{total.toFixed(2)}</span>
              </div>

              <button
                onClick={handleProceedToCheckout}
                className="w-full bg-neutral-900 text-white py-3 rounded-lg hover:bg-neutral-800 transition mb-3"
              >
                Proceed to Checkout
              </button>

              <Link
                to="/products"
                className="block text-center text-sm text-neutral-600 hover:text-neutral-900"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};