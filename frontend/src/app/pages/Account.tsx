import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, MapPin, Package, Settings, AlertCircle, Trash2, Plus, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import * as userService from '../../services/userService';
import * as orderService from '../../services/orderService';
import type { Address } from '../../services/userService';
import type { Order } from '../../services/orderService';

type TabType = 'profile' | 'addresses' | 'orders' | 'settings';

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
  return /^[0-9]{10}$/.test(phone.replace(/\D/g, ''));
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

export const Account: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [loading, setLoading] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  const [newAddress, setNewAddress] = useState<AddressFormData>({
    name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });

  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    addressId: string | null;
  }>({
    isOpen: false,
    addressId: null,
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=account');
    }
  }, [isAuthenticated, navigate]);

  // Load addresses and orders on mount
  useEffect(() => {
    if (isAuthenticated) {
      loadAddresses();
      loadOrders();
    }
  }, [isAuthenticated]);

  const loadAddresses = async () => {
    try {
      const data = await userService.getAddresses();
      setAddresses(data);
    } catch (err) {
      console.error('Error loading addresses:', err);
      toast.error('Failed to load addresses');
    }
  };

  const loadOrders = async () => {
    try {
      const data = await orderService.getUserOrders();
      setOrders(data);
    } catch (err) {
      console.error('Error loading orders:', err);
      toast.error('Failed to load orders');
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
      setLoading(true);
      await userService.addAddress(newAddress);

      toast.success('Address added successfully!');
      setShowAddressForm(false);
      setNewAddress({ name: '', phone: '', address: '', city: '', state: '', pincode: '' });
      setValidationErrors({});
      await loadAddresses();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add address';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    setDeleteConfirmation({ isOpen: true, addressId });
  };

  const confirmDeleteAddress = async () => {
    if (!deleteConfirmation.addressId) return;

    try {
      setLoading(true);
      await userService.deleteAddress(deleteConfirmation.addressId);
      toast.success('Address deleted successfully!');
      setDeleteConfirmation({ isOpen: false, addressId: null });
      await loadAddresses();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete address';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefaultAddress = async (addressId: string) => {
    try {
      setLoading(true);
      await userService.setDefaultAddress(addressId);
      toast.success('Default address updated!');
      await loadAddresses();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update default address';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully!');
      navigate('/');
    } catch (err) {
      toast.error('Failed to logout');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Account</h1>
          <p className="text-gray-600 mt-1">Manage your profile, addresses, and orders</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              {/* User Profile Card */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-center font-semibold text-gray-900">{user?.name}</h2>
                <p className="text-center text-sm text-gray-600">{user?.email}</p>
              </div>

              {/* Navigation Tabs */}
              <nav className="space-y-2 mb-6">
                {[
                  { id: 'profile' as TabType, label: 'Profile', icon: User },
                  { id: 'addresses' as TabType, label: 'Addresses', icon: MapPin },
                  { id: 'orders' as TabType, label: 'Orders', icon: Package },
                  { id: 'settings' as TabType, label: 'Settings', icon: Settings },
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                      activeTab === id
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {label}
                  </button>
                ))}
              </nav>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition font-semibold"
              >
                <LogOut className="h-5 w-5" />
                Logout
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="bg-white rounded-lg shadow-md p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile Information</h2>

                <form className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={profileForm.email}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                    />
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-900">
                      ✓ Your profile is linked to your Firebase authentication account
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition font-semibold"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </form>
              </div>
            )}

            {/* Addresses Tab */}
            {activeTab === 'addresses' && (
              <div className="space-y-6">
                {/* Addresses List */}
                <div className="bg-white rounded-lg shadow-md p-8">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Saved Addresses</h2>
                    <button
                      onClick={() => setShowAddressForm(!showAddressForm)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      <Plus className="h-5 w-5" />
                      Add Address
                    </button>
                  </div>

                  {addresses.length > 0 ? (
                    <div className="space-y-4">
                      {addresses.map((address) => (
                        <div
                          key={address.id}
                          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-gray-900">{address.name}</h3>
                                {address.isDefault && (
                                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
                                    Default
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600">{address.phone}</p>
                              <p className="text-sm text-gray-600 mt-2">
                                {address.address}
                              </p>
                              <p className="text-sm text-gray-600">
                                {address.city}, {address.state} {address.pincode}
                              </p>
                            </div>

                            <div className="flex gap-2">
                              {!address.isDefault && (
                                <button
                                  onClick={() => handleSetDefaultAddress(address.id)}
                                  className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition"
                                >
                                  Set Default
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteAddress(address.id)}
                                disabled={loading}
                                className="px-3 py-1 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100 transition disabled:opacity-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-600">No addresses saved yet</p>
                    </div>
                  )}
                </div>

                {/* Add Address Form */}
                {showAddressForm && (
                  <div className="bg-white rounded-lg shadow-md p-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-6">Add New Address</h3>

                    <form onSubmit={handleAddressSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 sm:col-span-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Full Name *
                          </label>
                          <input
                            type="text"
                            value={newAddress.name}
                            onChange={(e) => {
                              setNewAddress({ ...newAddress, name: e.target.value });
                              if (validationErrors.name) setValidationErrors({ ...validationErrors, name: undefined });
                            }}
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                              validationErrors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                            }`}
                            placeholder="John Doe"
                          />
                          {validationErrors.name && <p className="text-red-600 text-xs mt-1">{validationErrors.name}</p>}
                        </div>

                        <div className="col-span-2 sm:col-span-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Phone Number *
                          </label>
                          <input
                            type="text"
                            value={newAddress.phone}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                              setNewAddress({ ...newAddress, phone: val });
                              if (validationErrors.phone) setValidationErrors({ ...validationErrors, phone: undefined });
                            }}
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                              validationErrors.phone ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                            }`}
                            placeholder="9876543210"
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
                            placeholder="New York"
                          />
                          {validationErrors.city && <p className="text-red-600 text-xs mt-1">{validationErrors.city}</p>}
                        </div>

                        <div className="col-span-2 sm:col-span-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            State *
                          </label>
                          <input
                            type="text"
                            value={newAddress.state}
                            onChange={(e) => {
                              setNewAddress({ ...newAddress, state: e.target.value });
                              if (validationErrors.state) setValidationErrors({ ...validationErrors, state: undefined });
                            }}
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                              validationErrors.state ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                            }`}
                            placeholder="Maharashtra"
                          />
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

                      <div className="flex gap-3 pt-4">
                        <button
                          type="submit"
                          disabled={loading}
                          className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
                        >
                          {loading ? 'Saving...' : 'Save Address'}
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
                  </div>
                )}
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div className="bg-white rounded-lg shadow-md p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">My Orders</h2>

                {orders.length > 0 ? (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div
                        key={order.id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">Order #{order.id.slice(0, 8)}</h3>
                            <p className="text-sm text-gray-600">
                              {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="font-semibold text-lg text-gray-900">
                              ₹{order.totalAmount.toFixed(2)}
                            </p>
                            <span className={`inline-block px-3 py-1 rounded text-xs font-semibold mt-2 ${
                              order.status === 'PENDING'
                                ? 'bg-yellow-100 text-yellow-800'
                                : order.status === 'CONFIRMED'
                                ? 'bg-blue-100 text-blue-800'
                                : order.status === 'SHIPPED'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {order.status}
                            </span>
                          </div>
                        </div>

                        <div className="border-t border-gray-200 pt-4">
                          <h4 className="text-sm font-semibold text-gray-900 mb-2">Items</h4>
                          <div className="space-y-1">
                            {order.items.map((item) => (
                              <p key={item.id} className="text-sm text-gray-600">
                                {item.product.name} × {item.quantity} - ₹{(item.price * item.quantity).toFixed(2)}
                              </p>
                            ))}
                          </div>
                        </div>

                        <button
                          onClick={() => navigate(`/order-success/${order.id}`)}
                          className="mt-4 px-4 py-2 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition"
                        >
                          View Details
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">No orders yet</p>
                    <button
                      onClick={() => navigate('/products')}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      Start Shopping
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="bg-white rounded-lg shadow-md p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Account Settings</h2>

                <div className="space-y-8">
                  {/* Change Password Section */}
                  <div className="border-b border-gray-200 pb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h3>

                    <form className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Old Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={passwordForm.oldPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter old password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
                          >
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          New Password
                        </label>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter new password"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Confirm Password
                        </label>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Confirm new password"
                        />
                      </div>

                      <button
                        type="button"
                        disabled={loading}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition font-semibold"
                      >
                        {loading ? 'Updating...' : 'Update Password'}
                      </button>

                      <p className="text-xs text-gray-500 pt-2">
                        Password must be at least 8 characters long
                      </p>
                    </form>
                  </div>

                  {/* Notifications Section */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Notifications</h3>

                    <div className="space-y-3">
                      {[
                        { label: 'Order confirmation emails', id: 'order_confirm' },
                        { label: 'Shipping updates', id: 'shipping_updates' },
                        { label: 'Promotional emails', id: 'promo' },
                        { label: 'Product recommendations', id: 'recommendations' },
                      ].map(({ label, id }) => (
                        <label key={id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                          <input
                            type="checkbox"
                            defaultChecked={true}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600"
                          />
                          <span className="text-sm text-gray-700">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmation.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg max-w-sm mx-4">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="h-6 w-6 text-red-600" />
                <h3 className="text-lg font-semibold text-gray-900">Delete Address</h3>
              </div>
              
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this address? This action cannot be undone.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirmation({ isOpen: false, addressId: null })}
                  disabled={loading}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteAddress}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:bg-gray-400"
                >
                  {loading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
