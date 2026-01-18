import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, MapPin, Package, AlertCircle, Trash2, Plus } from 'lucide-react';
import { useAuth } from '../components/context/AuthContext';
import * as userService from '../../services/userService';
import * as orderService from '../../services/orderService';
import type { Address } from '../../services/userService';
import type { Order } from '../../services/orderService';

type TabType = 'profile' | 'addresses' | 'orders';

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
    errors.pincode = 'Pincode must be 6 digits';
  } else if (!validatePincode(form.pincode)) {
    errors.pincode = 'Pincode must be 6 digits';
  }

  return errors;
};

export const Account: React.FC = () => {
  const { isAuthenticated, isLoading, user, logout, updateUser } = useAuth();
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
    phone: user?.phone || '',
  });

  const [profileErrors, setProfileErrors] = useState({
    name: '',
    phone: '',
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
    if (!isLoading && !isAuthenticated) {
      navigate('/login?redirect=account');
    }
  }, [isLoading, isAuthenticated, navigate]);

  // Update profile form when user data changes
  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

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
    }
  };

  const loadOrders = async () => {
    try {
      const data = await orderService.getUserOrders();
      setOrders(data);
    } catch (err) {
      console.error('Error loading orders:', err);
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

      setShowAddressForm(false);
      setNewAddress({ name: '', phone: '', address: '', city: '', state: '', pincode: '' });
      setValidationErrors({});
      await loadAddresses();
    } catch (err) {
      console.error('Error adding address:', err);
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
      setDeleteConfirmation({ isOpen: false, addressId: null });
      await loadAddresses();
    } catch (err) {
      console.error('Error deleting address:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefaultAddress = async (addressId: string) => {
    try {
      setLoading(true);
      await userService.setDefaultAddress(addressId);
      await loadAddresses();
    } catch (err) {
      console.error('Error updating default address:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileNameChange = (value: string) => {
    setProfileForm({ ...profileForm, name: value });
    if (value.trim()) {
      setProfileErrors({ ...profileErrors, name: '' });
    }
  };

  const handleProfilePhoneChange = (value: string) => {
    setProfileForm({ ...profileForm, phone: value });
    if (!value.trim()) {
      setProfileErrors({ ...profileErrors, phone: '' });
    } else if (!/^\+91\d{10}$/.test(value)) {
      setProfileErrors({ ...profileErrors, phone: 'Phone must be +91 followed by 10 digits' });
    } else {
      setProfileErrors({ ...profileErrors, phone: '' });
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors = {
      name: !profileForm.name.trim() ? 'Full name is required' : '',
      phone: !profileForm.phone.trim() ? 'Phone number is required' : !/^\+91\d{10}$/.test(profileForm.phone) ? 'Phone must be +91 followed by 10 digits' : '',
    };

    setProfileErrors(errors);

    if (Object.values(errors).some(err => err)) {
      return;
    }

    setLoading(true);
    try {
      await userService.updateProfile({
        name: profileForm.name,
        phone: profileForm.phone,
      });
      
      // Update the user context
      updateUser({ name: profileForm.name, phone: profileForm.phone });
    } catch (err) {
      console.error('Error updating profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (err) {
      console.error('Error logging out:', err);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {isLoading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-neutral-200 border-t-teal-800 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-neutral-600">Loading your account...</p>
          </div>
        </div>
      ) : (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900">My Account</h1>
          <p className="text-neutral-600 mt-1">Manage your profile, addresses, and orders</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              {/* User Info Card */}
              <div className="mb-6 pb-6 border-b border-neutral-200">
                <h2 className="text-lg font-semibold text-neutral-900">{user?.name}</h2>
                <p className="text-sm text-neutral-600 mt-1">{user?.email}</p>
              </div>

              {/* Navigation Tabs */}
              <nav className="space-y-2 mb-6">
                {[
                  { id: 'profile' as TabType, label: 'Profile', icon: User },
                  { id: 'addresses' as TabType, label: 'Addresses', icon: MapPin },
                  { id: 'orders' as TabType, label: 'Orders', icon: Package },
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                      activeTab === id
                        ? 'bg-teal-50 text-teal-800 font-semibold'
                        : 'text-neutral-600 hover:bg-neutral-50'
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
                <h2 className="text-2xl font-bold text-neutral-900 mb-6">Profile Information</h2>

                <form className="space-y-6" onSubmit={handleProfileSave}>
                  <div>
                    <label className="block text-sm font-medium text-neutral-900 mb-2">
                      Full Name <span className="text-xs text-neutral-500">(required)</span>
                    </label>
                    <input
                      type="text"
                      value={profileForm.name}
                      onChange={(e) => handleProfileNameChange(e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-800 transition ${
                        profileErrors.name ? 'border-red-500' : 'border-neutral-300'
                      }`}
                    />
                    {profileErrors.name && <p className="mt-1 text-xs text-red-500">{profileErrors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-900 mb-2">
                      Email Address <span className="text-xs text-neutral-500">(not changeable)</span>
                    </label>
                    <input
                      type="text"
                      value={profileForm.email}
                      disabled
                      className="w-full px-4 py-3 border border-neutral-300 rounded-lg bg-neutral-50 text-neutral-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-900 mb-2">
                      Phone Number <span className="text-xs text-neutral-500">(+91 only)</span>
                    </label>
                    <input
                      type="text"
                      value={profileForm.phone}
                      onChange={(e) => handleProfilePhoneChange(e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-800 transition ${
                        profileErrors.phone ? 'border-red-500' : 'border-neutral-300'
                      }`}
                      placeholder="+919876543210"
                    />
                    {profileErrors.phone && <p className="mt-1 text-xs text-red-500">{profileErrors.phone}</p>}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 bg-teal-800 text-white rounded-lg hover:bg-teal-900 disabled:bg-neutral-400 transition font-semibold"
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
                    <h2 className="text-2xl font-bold text-neutral-900">Saved Addresses</h2>
                    <button
                      onClick={() => setShowAddressForm(!showAddressForm)}
                      className="flex items-center gap-2 px-4 py-2 bg-teal-800 text-white rounded-lg hover:bg-teal-900 transition"
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
                          className="border border-neutral-200 rounded-lg p-4 hover:shadow-md transition"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-neutral-900">{address.name}</h3>
                                {address.isDefault && (
                                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
                                    Default
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-neutral-600 mt-2">
                                {address.address}
                              </p>
                              <p className="text-sm text-neutral-600">
                                {address.city}, {address.state} {address.pincode}
                              </p>
                            </div>

                            <div className="flex gap-2">
                              {!address.isDefault && (
                                <button
                                  onClick={() => handleSetDefaultAddress(address.id)}
                                  className="px-3 py-1 text-sm bg-teal-50 text-teal-800 rounded hover:bg-teal-100 transition"
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
                      <MapPin className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
                      <p className="text-neutral-600">No addresses saved yet</p>
                    </div>
                  )}
                </div>

                {/* Add Address Form */}
                {showAddressForm && (
                  <div className="bg-white rounded-lg shadow-md p-8">
                    <h3 className="text-xl font-bold text-neutral-900 mb-6">Add New Address</h3>

                    <form onSubmit={handleAddressSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 sm:col-span-1">
                          <label className="block text-sm font-medium text-neutral-900 mb-1">
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
                              validationErrors.name ? 'border-red-500 focus:ring-red-500' : 'border-neutral-300 focus:ring-teal-800'
                            }`}
                            placeholder="John Doe"
                          />
                          {validationErrors.name && <p className="text-red-600 text-xs mt-1">{validationErrors.name}</p>}
                        </div>

                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-neutral-900 mb-1">
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
                              validationErrors.address ? 'border-red-500 focus:ring-red-500' : 'border-neutral-300 focus:ring-teal-800'
                            }`}
                            placeholder="123 Main Street, Apt 4B"
                          />
                          {validationErrors.address && <p className="text-red-600 text-xs mt-1">{validationErrors.address}</p>}
                        </div>

                        <div className="col-span-2 sm:col-span-1">
                          <label className="block text-sm font-medium text-neutral-900 mb-1">
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
                              validationErrors.city ? 'border-red-500 focus:ring-red-500' : 'border-neutral-300 focus:ring-teal-800'
                            }`}
                            placeholder="New York"
                          />
                          {validationErrors.city && <p className="text-red-600 text-xs mt-1">{validationErrors.city}</p>}
                        </div>

                        <div className="col-span-2 sm:col-span-1">
                          <label className="block text-sm font-medium text-neutral-900 mb-1">
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
                              validationErrors.state ? 'border-red-500 focus:ring-red-500' : 'border-neutral-300 focus:ring-teal-800'
                            }`}
                            placeholder="Maharashtra"
                          />
                          {validationErrors.state && <p className="text-red-600 text-xs mt-1">{validationErrors.state}</p>}
                        </div>

                        <div className="col-span-2 sm:col-span-1">
                          <label className="block text-sm font-medium text-neutral-900 mb-1">
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
                              validationErrors.pincode ? 'border-red-500 focus:ring-red-500' : 'border-neutral-300 focus:ring-teal-800'
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
                          className="flex-1 py-2 px-4 bg-teal-800 text-white rounded-lg hover:bg-teal-900 disabled:bg-neutral-400 transition"
                        >
                          {loading ? 'Saving...' : 'Save Address'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddressForm(false);
                            setValidationErrors({});
                          }}
                          className="flex-1 py-2 px-4 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition"
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
                <h2 className="text-2xl font-bold text-neutral-900 mb-6">My Orders</h2>

                {orders.length > 0 ? (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div
                        key={order.id}
                        className="border border-neutral-200 rounded-lg p-4 hover:shadow-md transition"
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
                    <Package className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
                    <p className="text-neutral-600 mb-4">No orders yet</p>
                    <button
                      onClick={() => navigate('/products')}
                      className="px-6 py-2 bg-teal-800 text-white rounded-lg hover:bg-teal-900 transition"
                    >
                      Start Shopping
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmation.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg max-w-sm mx-4">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="h-6 w-6 text-red-600" />
                <h3 className="text-lg font-semibold text-neutral-900">Delete Address</h3>
              </div>
              
              <p className="text-neutral-600 mb-6">
                Are you sure you want to delete this address? This action cannot be undone.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirmation({ isOpen: false, addressId: null })}
                  disabled={loading}
                  className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg text-neutral-700 hover:bg-neutral-50 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteAddress}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:bg-neutral-400"
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
