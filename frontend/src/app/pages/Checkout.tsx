import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Loader, AlertCircle, Check, Plus, HandHeart } from 'lucide-react';
import { useCart } from '../components/context/CartContext';
import { useAuth } from '../components/context/AuthContext';
import { toast } from 'sonner';

import * as checkoutService from '../../services/checkoutService';
import * as orderService from '../../services/orderService';
import * as userService from '../../services/userService';
import * as paymentService from '../../services/paymentService';
import type { CheckoutData } from '../../services/checkoutService';

// Indian States and Union Territories
const INDIAN_STATES = [
  'Andaman and Nicobar Islands',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chandigarh',
  'Chhattisgarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Ladakh',
  'Lakshadweep',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Puducherry',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
].sort();

interface AddressFormData {
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

interface ValidationErrors {
  name?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

const validatePhone = (phone: string): boolean => {
  const cleaned = phone.replace(/\D/g, '');

  // Allow: 10-digit OR +91 followed by 10-digit
  return cleaned.length === 10 || (cleaned.length === 12 && cleaned.startsWith('91'));
};


const validatePincode = (pincode: string): boolean => {
  return /^[0-9]{6}$/.test(pincode);
};

const validateAddressForm = (form: AddressFormData): ValidationErrors => {
  const errors: ValidationErrors = {};

  if (!form.name.trim()) {
    errors.name = 'Full name is required';
  }

  if (!form.phone.trim()) {
    errors.phone = 'Phone number is required';
  } else if (!validatePhone(form.phone)) {
    errors.phone = 'Phone must be 10 digits';
  }

  if (!form.address.trim()) {
    errors.address = 'Address is required';
  }

  if (!form.city.trim()) {
    errors.city = 'City is required';
  }

  if (!form.state.trim()) {
    errors.state = 'State is required';
  }

  if (!form.pincode.trim()) {
    errors.pincode = 'Pincode is required';
  } else if (!validatePincode(form.pincode)) {
    errors.pincode = 'Pincode must be 6 digits';
  }

  return errors;
};

export const Checkout: React.FC = () => {
  const { cartItems, clearCart } = useCart();
  const { isAuthenticated, user, isLoading: authLoading, getIdToken } = useAuth();
  const navigate = useNavigate();

  // State management
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'upi'>('cod');
  const [isRedirecting, setIsRedirecting] = useState(false);

  // New address form state
  const [newAddress, setNewAddress] = useState<AddressFormData>({
    name: '',
    phone: user?.phone || '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });

  // Redirect if not authenticated or cart is empty
  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) {
      return;
    }

    if (!isAuthenticated) {
      navigate('/login?redirect=checkout');
      return;
    }

    if (cartItems.length === 0) {
      navigate('/cart');
      return;
    }
  }, [isAuthenticated, authLoading, cartItems.length, navigate]);

  // Load checkout data on mount
  useEffect(() => {
    if (isAuthenticated && cartItems.length > 0) {
      loadCheckoutData();
      // Set phone and name from user profile
      if (user?.phone || user?.name) {
        setNewAddress(prev => ({ ...prev, phone: user?.phone || '', name: user?.name || '' }));
      }
    }
  }, [isAuthenticated, cartItems.length, user?.phone, user?.name]);

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

    const errors = validateAddressForm(newAddress);
    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    try {
      setIsProcessing(true);
      const savedAddress = await userService.addAddress(newAddress);

      toast.success('Address saved successfully!');
      setSelectedAddressId(savedAddress.id);
      setShowAddressForm(false);
      setValidationErrors({});

      // Reload checkout data to include the new address
      await loadCheckoutData();

      // Reset form
      setNewAddress({
        name: '',
        phone: user?.phone || '',
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

      // Handle payment based on selected method
      if (paymentMethod === 'cod') {
        // COD - Create order immediately (payment on delivery)
        const createdOrder = await orderService.placeOrder(selectedAddressId, paymentMethod);
        
        console.log('=== COD ORDER PLACEMENT ===');
        console.log('Created Order:', createdOrder);
        console.log('Order ID:', createdOrder?.id);

        // COD - Show success toast and add delay for animation
        toast.success('Order placed successfully!');
        await clearCart();
        
        // Show loading animation while preparing to redirect
        setIsRedirecting(true);
        
        // Add 2-second delay to show order confirmation animation
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Then navigate to success page
        navigate(`/order-success/${createdOrder.id}`);
      } else if (paymentMethod === 'upi') {
        // UPI - Handle payment first, CREATE order ONLY after success
        console.log('=== UPI PAYMENT FLOW - STARTING ===');
        
        // Get authentication token
        const token = await getIdToken();
        if (!token) {
          throw new Error('Authentication token not available');
        }
        
        // Get total amount from checkout data
        const totalAmount = checkoutData?.cart?.totals?.grandTotal || 0;
        console.log('=== RAZORPAY PAYMENT DEBUG ===');
        console.log('Checkout Data:', checkoutData);
        console.log('Cart Items:', checkoutData?.cart?.items);
        console.log('Cart Totals:', checkoutData?.cart?.totals);
        console.log('Total Amount:', totalAmount);
        
        if (totalAmount <= 0) {
          throw new Error('Invalid cart total. Please ensure items are in your cart.');
        }

        // Step 1: Create a temporary Razorpay order (NOT database order yet)
        // Using a placeholder order ID for Razorpay - actual order created after payment verification
        const placeholderId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        console.log('Creating Razorpay order with placeholder ID:', placeholderId);
        
        const razorpayOrder = await paymentService.createRazorpayOrder(
          totalAmount,
          placeholderId,
          token
        );

        // Step 2: Initiate Razorpay payment UI
        console.log('Initiating Razorpay payment...');
        const paymentResponse = await paymentService.initiateRazorpayPayment(
          razorpayOrder.orderId,
          totalAmount,
          'INR',
          user?.email || '',
          user?.phone || '',
          user?.name || ''
        );

        // Step 3: Payment successful! Now verify and create actual database order
        console.log('Payment completed by user. Verifying payment...');
        
        // At this point, create the actual database order
        const createdOrder = await orderService.placeOrder(selectedAddressId, paymentMethod);
        console.log('Database order created after payment success:', createdOrder.id);

        // Step 4: Verify payment with backend
        await paymentService.verifyRazorpayPayment(
          {
            razorpay_order_id: paymentResponse.razorpay_order_id,
            razorpay_payment_id: paymentResponse.razorpay_payment_id,
            razorpay_signature: paymentResponse.razorpay_signature,
            orderId: createdOrder.id,  // Use actual order ID
          },
          token
        );

        console.log('✅ Payment verified successfully. Order ID:', createdOrder.id);
        
        // Payment successful - clear cart and navigate
        await clearCart();
        toast.success('Payment successful! Order placed.');
        
        // Show loading animation while preparing to redirect
        setIsRedirecting(true);
        
        // Add delay for animation
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        navigate(`/order-success/${createdOrder.id}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to place order';
      setError(errorMessage);
      toast.error(errorMessage);
      setIsProcessing(false);
      
      // For UPI payment cancellation, cart is NOT cleared
      // User can retry payment or use the same cart for another order
      console.log('❌ Payment/Order failed:', errorMessage);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  // Show loading animation when redirecting after payment
  if (isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 fixed inset-0 z-50">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="animate-bounce">
              <Check className="h-16 w-16 text-green-500" />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-lg font-semibold text-gray-900">Order placed successfully!</p>
            <p className="text-sm text-gray-600">Redirecting to your order details...</p>
          </div>
          <div className="flex justify-center gap-2">
            <Loader className="h-5 w-5 text-green-600 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Processing Modal/Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 text-center max-w-md mx-auto shadow-2xl animate-in fade-in duration-300">
            {/* Animated check icon */}
            <div className="mb-6 flex justify-center">
              <div className="relative w-20 h-20">
                <div className="absolute inset-0 bg-green-100 rounded-full animate-pulse"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <Check className="w-8 h-8 text-green-600 animate-bounce" />
                  </div>
                </div>
              </div>
            </div>

            {/* Message */}
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {paymentMethod === 'cod' ? 'Confirming your order...' : 'Processing payment...'}
            </h3>
            <p className="text-gray-600 text-sm mb-6">
              {paymentMethod === 'cod' 
                ? 'Your order is being confirmed. Please wait.' 
                : 'Your payment is being processed. Please wait.'}
            </p>

            {/* Loader animation */}
            <div className="flex justify-center gap-2">
              <Loader className="w-6 h-6 text-green-600 animate-spin" />
            </div>

            {/* Progress text */}
            <p className="text-xs text-gray-500 mt-4">Redirecting to confirmation page...</p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

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
                        Full Name <span className="text-xs text-gray-500">(from profile)</span>
                      </label>
                      <input
                        type="text"
                        value={newAddress.name}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                        placeholder="Full name will be populated from your profile"
                      />
                      <p className="text-xs text-gray-500 mt-1">Uses name from your profile</p>
                      {validationErrors.name && <p className="text-red-600 text-xs mt-1">{validationErrors.name}</p>}
                    </div>

                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number <span className="text-xs text-gray-500">(from profile)</span>
                      </label>
                      <input
                        type="text"
                        value={newAddress.phone}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                        placeholder="Phone from profile"
                      />
                      {validationErrors.phone && <p className="text-red-600 text-xs mt-1">{validationErrors.phone}</p>}
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address *
                      </label>
                      <input
                        type="text"
                        value={newAddress.address}
                        onChange={(e) => {
                          setNewAddress({ ...newAddress, address: e.target.value });
                          if (validationErrors.address) setValidationErrors({ ...validationErrors, address: undefined });
                        }}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                          validationErrors.address ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                        }`}
                        placeholder="123 Main Street, Apt 4B"
                      />
                      {validationErrors.address && <p className="text-red-600 text-xs mt-1">{validationErrors.address}</p>}
                    </div>

                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        City *
                      </label>
                      <input
                        type="text"
                        value={newAddress.city}
                        onChange={(e) => {
                          setNewAddress({ ...newAddress, city: e.target.value });
                          if (validationErrors.city) setValidationErrors({ ...validationErrors, city: undefined });
                        }}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                          validationErrors.city ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                        }`}
                        placeholder="Enter your city"
                      />
                      {validationErrors.city && <p className="text-red-600 text-xs mt-1">{validationErrors.city}</p>}
                    </div>

                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        State *
                      </label>
                      <select
                        value={newAddress.state}
                        onChange={(e) => {
                          setNewAddress({ ...newAddress, state: e.target.value });
                          if (validationErrors.state) setValidationErrors({ ...validationErrors, state: undefined });
                        }}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                          validationErrors.state ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                        }`}
                      >
                        <option value="">Select a state</option>
                        {INDIAN_STATES.map((state) => (
                          <option key={state} value={state}>
                            {state}
                          </option>
                        ))}
                      </select>
                      {validationErrors.state && <p className="text-red-600 text-xs mt-1">{validationErrors.state}</p>}
                    </div>

                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Pincode *
                      </label>
                      <input
                        type="text"
                        value={newAddress.pincode}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                          setNewAddress({ ...newAddress, pincode: val });
                          if (validationErrors.pincode) setValidationErrors({ ...validationErrors, pincode: undefined });
                        }}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                          validationErrors.pincode ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                        }`}
                        placeholder="400001"
                      />
                      {validationErrors.pincode && <p className="text-red-600 text-xs mt-1">{validationErrors.pincode}</p>}
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
                      onClick={() => {
                        setShowAddressForm(false);
                        setValidationErrors({});
                      }}
                      className="flex-1 py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>

                {/* Order Items Summary – Ticket Style */}
                <div className="bg-white rounded-lg shadow-md p-6 font-mono">
                  <h2 className="text-lg font-bold text-gray-900 mb-4 text-center uppercase tracking-wide">
                    Order Bill
                  </h2>

                  <div className="border-t border-b border-dashed border-gray-300 py-3 space-y-4">
                    {checkoutData?.cart.items.map((item) => {
                      const itemTotal = item.product.finalPrice * item.quantity;
                      const saved =
                        (item.product.basePrice - item.product.finalPrice) * item.quantity;

                      return (
                        <div key={item.productId} className="space-y-1 text-sm">
                          {/* Product name */}
                          <div className="flex justify-between font-semibold text-gray-900">
                            <span className="truncate">{item.product.name}</span>
                            <span>₹{itemTotal.toFixed(2)}</span>
                          </div>

                          {/* Quantity & unit price */}
                          <div className="flex justify-between text-gray-500">
                            <span>
                              {item.quantity} × ₹{item.product.finalPrice.toFixed(2)}
                            </span>
                          </div>

                          {/* Optional attributes */}
                          {(item.flavor || item.size) && (
                            <div className="text-xs text-gray-400">
                              {item.flavor && <span>Flavor: {item.flavor} </span>}
                              {item.size && <span>• Size: {item.size}</span>}
                            </div>
                          )}

                          {/* Savings */}
                          {item.product.discountPercent > 0 && (
                            <div className="text-xs text-green-600">
                              Saved ₹{saved.toFixed(2)}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Total Section */}
                  <div className="mt-4 pt-4 border-t border-dashed border-gray-300 flex justify-between font-bold text-gray-900 text-sm">
                    <span>Total</span>
                    <span>
                      ₹
                      {checkoutData?.cart?.items
                        .reduce((sum: number, item: any) => sum + item.product.finalPrice * item.quantity, 0)
                        .toFixed(0)}
                    </span>
                  </div>

                  {/* Footer note */}
                  <div className="mt-4 text-center text-xs text-gray-500 flex items-center justify-center gap-1">
                      <HandHeart className="w-4 h-4 text-gray-400" />
                      <span>Thank you for shopping with us!</span>
                  </div>
                </div>
              </div>

              {/* Price Summary */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Price Summary</h2>

                  {checkoutData && (
                    <div className="space-y-3 mb-6 pb-6 border-b border-gray-200 text-sm">
                      
                      {/* Base Price */}
                      <div className="flex justify-between text-gray-600">
                        <span>Base Price</span>
                        <span>
                          ₹{(
                            checkoutData.cart.totals.subtotal +
                            (checkoutData.cart.totals.discount ?? 0)
                          ).toFixed(2)}
                        </span>
                      </div>

                      {/* Discount */}
                      {(checkoutData.cart.totals.discount ?? 0) > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Discount</span>
                          <span>
                            -₹{(checkoutData.cart.totals.discount ?? 0).toFixed(2)}
                          </span>
                        </div>
                      )}

                      {/* Subtotal after discount */}
                      <div className="flex justify-between font-semibold text-gray-900 border-t pt-2">
                        <span>Subtotal</span>
                        <span>
                          ₹{checkoutData.cart.totals.subtotal.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Final Total */}
                  <div className="flex justify-between text-lg font-bold text-gray-900">
                    <span>Total Amount</span>
                    <span className="text-blue-600">
                      ₹{checkoutData?.cart.totals.grandTotal.toFixed(2) ?? '0.00'}
                    </span>
                  </div>

                  <div className="flex justify-between font-semibold text-gray-900 border-t pt-2"></div>


              {/* Payment Method Selection */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h3>
                <div className="space-y-3">
                  {/* COD */}
                  <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50" style={{ borderColor: paymentMethod === 'cod' ? '#0f766e' : '#d1d5db' }}>
                    <input
                      type="radio"
                      name="payment"
                      value="cod"
                      checked={paymentMethod === 'cod'}
                      onChange={(e) => setPaymentMethod(e.target.value as 'cod' | 'upi')}
                      className="w-4 h-4"
                    />
                    <span className="ml-3 flex-1">
                      <span className="font-semibold text-gray-900">Cash on Delivery</span>
                      <p className="text-xs text-gray-500">Pay when you receive the product</p>
                    </span>
                  </label>

                  {/* UPI */}
                  <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50" style={{ borderColor: paymentMethod === 'upi' ? '#0f766e' : '#d1d5db' }}>
                    <input
                      type="radio"
                      name="payment"
                      value="upi"
                      checked={paymentMethod === 'upi'}
                      onChange={(e) => setPaymentMethod(e.target.value as 'cod' | 'upi')}
                      className="w-4 h-4"
                    />
                    <span className="ml-3 flex-1">
                      <span className="font-semibold text-gray-900">UPI</span>
                      <p className="text-xs text-gray-500">Google Pay, PhonePe, PayTM, etc.</p>
                    </span>
                  </label>
                </div>
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
                      {paymentMethod === 'cod' ? 'Place Order' : 'Pay Now'}
                    </>
                  )}
                </button>
              </form>

              <p className="text-xs text-gray-500 text-center mt-4">
                ✓ Secure checkout with Razorpay
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};