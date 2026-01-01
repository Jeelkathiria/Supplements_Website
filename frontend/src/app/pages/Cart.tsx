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
              const finalPrice = calculateFinalPrice(
                item.product.basePrice,
                item.product.discount,
                item.product.tax
              );

              return (
                <div
                  key={`${item.product.id}-${item.selectedSize}-${item.selectedColor}`}
                  className="bg-white rounded-xl border border-neutral-200 p-4"
                >
                  <div className="flex gap-4">
                    {/* Image */}
                    <img
                      src={item.product.images[0]}
                      alt={item.product.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />

                    {/* Info */}
                    <div className="flex-1">
                      <h3 className="font-medium">{item.product.name}</h3>
                      {item.selectedSize && (
                        <p className="text-sm text-neutral-600">
                          Size: {item.selectedSize}
                        </p>
                      )}
                      {item.selectedColor && (
                        <p className="text-sm text-neutral-600">
                          Flavor: {item.selectedColor}
                        </p>
                      )}
                      <p className="text-sm text-neutral-500 mt-1">
                        ₹{finalPrice} each
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col items-end justify-between">
                      <p className="font-semibold">
                        ₹{(finalPrice * item.quantity).toFixed(2)}
                      </p>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            updateQuantity(item.product.id, item.quantity - 1)
                          }
                          className="w-7 h-7 border border-neutral-300 rounded hover:bg-neutral-100"
                        >
                          <Minus className="w-3 h-3 mx-auto" />
                        </button>
                        <span className="w-8 text-center text-sm">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.product.id, item.quantity + 1)
                          }
                          className="w-7 h-7 border border-neutral-300 rounded hover:bg-neutral-100"
                        >
                          <Plus className="w-3 h-3 mx-auto" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1 mt-2"
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