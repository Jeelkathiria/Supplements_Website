import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Smartphone, Banknote, Check, MapPin } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Breadcrumb } from '../components/Breadcrumb';

export const Checkout: React.FC = () => {
  const { cartItems, getCartTotal, clearCart } = useCart();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'cod'>('upi');
  
  // Mock saved addresses for demonstration
  const mockSavedAddresses = [
    {
      id: '1',
      fullName: user?.name || 'John Doe',
      street: '123 Main Street, Apt 4B',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      phone: '+91 98765 43210',
      isDefault: true,
    },
    {
      id: '2',
      fullName: user?.name || 'John Doe',
      street: '456 Park Avenue',
      city: 'Delhi',
      state: 'Delhi',
      pincode: '110001',
      phone: '+91 98765 43210',
      isDefault: false,
    },
  ];

  const [selectedAddress, setSelectedAddress] = useState(mockSavedAddresses[0]);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=checkout');
    }
  }, [isAuthenticated, navigate]);

  // Redirect to cart if cart is empty
  useEffect(() => {
    if (cartItems.length === 0) {
      navigate('/cart');
    }
  }, [cartItems.length, navigate]);

  const subtotal = getCartTotal();
  const shipping = subtotal > 499 ? 0 : 50;
  const total = subtotal + shipping;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Order placed successfully!');
    clearCart();
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-neutral-50 py-20">
      <div className="max-w-[1200px] mx-auto px-6 md:px-12">
        <Breadcrumb
          items={[
            { label: 'Home', path: '/' },
            { label: 'Cart', path: '/cart' },
            { label: 'Checkout' },
          ]}
        />
        {/* Welcome Message */}
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-6 flex items-center gap-3">
          <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-green-900">
              Welcome, {user?.name || 'Guest'}! 
            </p>
            <p className="text-xs text-green-700">
              Complete your order below
            </p>
          </div>
        </div>

        <h1 className="text-3xl font-bold mb-12">Checkout</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Left Section */}
            <div className="lg:col-span-2 space-y-10">
              {/* Saved Addresses */}
              <div className="bg-white rounded-xl border border-neutral-200 p-6">
                <h2 className="text-lg font-bold mb-6">Select Delivery Address</h2>

                <div className="space-y-3 mb-6">
                  {mockSavedAddresses.map((address) => (
                    <label
                      key={address.id}
                      className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition ${
                        selectedAddress?.id === address.id
                          ? 'border-neutral-900 bg-neutral-50'
                          : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="address"
                        checked={selectedAddress?.id === address.id}
                        onChange={() => setSelectedAddress(address)}
                        className="w-4 h-4 mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <MapPin className="w-4 h-4 text-neutral-600" />
                          <span className="font-medium">{address.fullName}</span>
                          {address.isDefault && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-neutral-600 ml-6">
                          {address.street}
                        </p>
                        <p className="text-sm text-neutral-600 ml-6">
                          {address.city}, {address.state} - {address.pincode}
                        </p>
                        <p className="text-sm text-neutral-600 ml-6">
                          {address.phone}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>

                <button
                  type="button"
                  className="text-sm text-neutral-900 hover:underline font-medium"
                  onClick={() => toast.info('Add new address feature coming soon!')}
                >
                  + Add New Address
                </button>
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-xl border border-neutral-200 p-6">
                <h2 className="text-lg font-bold mb-6">Payment Method</h2>

                <div className="space-y-3">
                  {[
                    { id: 'upi', label: 'UPI Payment', icon: Smartphone },
                    { id: 'card', label: 'Credit / Debit Card', icon: CreditCard },
                    { id: 'cod', label: 'Cash on Delivery', icon: Banknote },
                  ].map(({ id, label, icon: Icon }) => (
                    <label
                      key={id}
                      className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition
                        ${
                          paymentMethod === id
                            ? 'border-neutral-900 bg-neutral-50'
                            : 'border-neutral-200 hover:border-neutral-300'
                        }`}
                    >
                      <input
                        type="radio"
                        checked={paymentMethod === id}
                        onChange={() => setPaymentMethod(id as any)}
                        className="w-4 h-4"
                      />
                      <Icon className="w-5 h-5 text-neutral-700" />
                      <span className="font-medium">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div>
              <div className="bg-white rounded-xl border border-neutral-200 p-6 sticky top-24">
                <h2 className="text-lg font-bold mb-6">Order Summary</h2>

                <div className="space-y-2 pb-4 mb-4 border-b border-neutral-200">
                  {cartItems.map((item) => (
                    <div key={item.product.id} className="flex justify-between text-sm">
                      <span className="text-neutral-600">
                        {item.product.name} × {item.quantity}
                      </span>
                      <span className="font-medium">
                        ₹
                        {(
                          (item.product.basePrice -
                            item.product.basePrice * item.product.discount / 100) *
                          item.quantity
                        ).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 pb-4 mb-4 border-b border-neutral-200 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Subtotal</span>
                    <span className="font-medium">₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Shipping</span>
                    <span className="font-medium">
                      {shipping === 0 ? 'FREE' : `₹${shipping}`}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between font-bold text-lg mb-6">
                  <span>Total</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>

                <button
                  type="submit"
                  className="w-full bg-neutral-900 text-white py-3 rounded-lg hover:bg-neutral-800 transition flex items-center justify-center gap-2"
                >
                  <Check className="w-5 h-5" />
                  Place Order
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};