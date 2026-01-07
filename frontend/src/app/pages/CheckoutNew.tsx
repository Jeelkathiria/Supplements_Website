import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Loader, AlertCircle, Check, Plus } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Breadcrumb } from '../components/Breadcrumb';
import * as checkoutService from '../../services/checkoutService';
import * as orderService from '../../services/orderService';
import * as userService from '../../services/userService';
import type { Address } from '../../services/userService';
import type { CheckoutData } from '../../services/checkoutService';

export const Checkout: React.FC = () => {
  const { cartItems, clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // State management
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);

  // New address form state
  const [newAddress, setNewAddress] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });

  // Redirect if not authenticated or cart is empty
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=checkout');
      return;
    }

    if (cartItems.length === 0) {
      navigate('/cart');
      return;
    }
  }, [isAuthenticated, cartItems.length, navigate]);

  // Load checkout data on mount
  useEffect(() => {
    if (isAuthenticated && cartItems.length > 0) {
      loadCheckoutData();
    }
  }, [isAuthenticated, cartItems.length]);

  const loadCheckoutData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await checkoutService.getCheckoutData();
      setCheckoutData(data);

      // Auto-select first address or default address
      if (data.addresses && data.addresses.length > 0) {
        const defaultAddr = data.addresses.find((a) => a.isDefault);
        setSelectedAddressId(defaultAddr?.id || data.addresses[0].id);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load checkout data';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!newAddress.name || !newAddress.phone || !newAddress.address || !newAddress.city || !newAddress.pincode) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsProcessing(true);
      const savedAddress = await userService.addAddress({
        ...newAddress,
        state: newAddress.state || 'N/A',
      });

      toast.success('Address saved successfully!');
      setSelectedAddressId(savedAddress.id);
      setShowAddressForm(false);

      // Reload checkout data to include the new address
      await loadCheckoutData();

      // Reset form
      setNewAddress({
        name: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save address';
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedAddressId) {
      toast.error('Please select a delivery address');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);

      // Place the order
      const createdOrder = await orderService.placeOrder(selectedAddressId);

      // Clear cart after successful order
      await clearCart();

      // Navigate to order success page
      toast.success('Order placed successfully!');
      navigate(`/order-success/${createdOrder.id}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to place order';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Breadcrumb items={[{ label: 'Checkout' }]} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2">
            {/* Delivery Address Section */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <div className="flex items-center gap-2 mb-6">
                <MapPin className="h-6 w-6 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-900">Delivery Address</h2>
              </div>

              {checkoutData?.addresses && checkoutData.addresses.length > 0 && !showAddressForm && (
                <div className="space-y-3 mb-6">
                  {checkoutData.addresses.map((address) => (
                    <label
                      key={address.id}
                      className="flex items-start gap-3 p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"
                    >
                      <input
                        type="radio"
                        name="address"
                        value={address.id}
                        checked={selectedAddressId === address.id}
                        onChange={(e) => setSelectedAddressId(e.target.value)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{address.name}</p>
                        <p className="text-sm text-gray-600">{address.phone}</p>
                        <p className="text-sm text-gray-600">
                          {address.address}, {address.city} {address.pincode}
                        </p>
                        {address.state && <p className="text-sm text-gray-600">{address.state}</p>}
                        {address.isDefault && (
                          <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
                            Default Address
                          </span>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}

              {/* Add new address button */}
              {!showAddressForm && (
                <button
                  onClick={() => setShowAddressForm(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-700 hover:border-blue-400 hover:bg-blue-50 transition"
                >
                  <Plus className="h-5 w-5" />
                  Add New Address
                </button>
              )}

              {/* Add address form */}
              {showAddressForm && (
                <form onSubmit={handleAddressSubmit} className="bg-gray-50 p-6 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={newAddress.name}
                        onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="John Doe"
                        required
                      />
                    </div>

                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        value={newAddress.phone}
                        onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="9876543210"
                        required
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address *
                      </label>
                      <input
                        type="text"
                        value={newAddress.address}
                        onChange={(e) => setNewAddress({ ...newAddress, address: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="123 Main Street, Apt 4B"
                        required
                      />
                    </div>

                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        City *
                      </label>
                      <input
                        type="text"
                        value={newAddress.city}
                        onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="New York"
                        required
                      />
                    </div>

                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        State/Province
                      </label>
                      <input
                        type="text"
                        value={newAddress.state}
                        onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="New York"
                      />
                    </div>

                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Pincode *
                      </label>
                      <input
                        type="text"
                        value={newAddress.pincode}
                        onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="10001"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 mt-4">
                    <button
                      type="submit"
                      disabled={isProcessing}
                      className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
                    >
                      {isProcessing ? 'Saving...' : 'Save Address'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddressForm(false)}
                      className="flex-1 py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Order Items Summary */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>
              <div className="space-y-4">
                {checkoutData?.cart.items.map((item) => (
                  <div key={item.productId} className="flex gap-4 pb-4 border-b border-gray-200">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{item.product.name}</p>
                      <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                      {item.flavor && <p className="text-sm text-gray-600">Flavor: {item.flavor}</p>}
                      {item.size && <p className="text-sm text-gray-600">Size: {item.size}</p>}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        ₹{(item.product.basePrice * item.quantity).toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-500">{item.quantity} x ₹{item.product.basePrice}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Price Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Price Summary</h2>

              <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
                {checkoutData && (
                  <>
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal</span>
                      <span>₹{checkoutData.cart.totals.subtotal.toFixed(2)}</span>
                    </div>
                    {(checkoutData.cart.totals.discount ?? 0) > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount</span>
                        <span>-₹{(checkoutData.cart.totals.discount ?? 0).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-gray-600">
                      <span>GST</span>
                      <span>₹{checkoutData.cart.totals.gst.toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>

              <div className="flex justify-between text-lg font-bold text-gray-900 mb-6">
                <span>Total Amount</span>
                <span className="text-blue-600">₹{checkoutData?.cart.totals.grandTotal.toFixed(2)}</span>
              </div>

              <form onSubmit={handlePlaceOrder}>
                <button
                  type="submit"
                  disabled={isProcessing || !selectedAddressId}
                  className="w-full py-3 px-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader className="h-5 w-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Check className="h-5 w-5" />
                      Place Order
                    </>
                  )}
                </button>
              </form>

              <p className="text-xs text-gray-500 text-center mt-4">
                ✓ Secure checkout with Firebase Authentication
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
