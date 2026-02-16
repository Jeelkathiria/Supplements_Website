import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, MapPin, Package, AlertCircle, Trash2, Plus, Check } from 'lucide-react';
import { useAuth } from '../components/context/AuthContext';
import { useCart } from '../components/context/CartContext';
import { OrderTrackingProgress } from '../components/OrderTrackingProgress';
import { toast } from 'sonner';
import * as userService from '../../services/userService';
import * as orderService from '../../services/orderService';
import * as productService from '../../services/productService';
import type { Address } from '../../services/userService';
import type { Order } from '../../services/orderService';

type TabType = 'profile' | 'addresses' | 'orders';

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

  // Address management state
  // (Cities by state mapping would be defined here if needed)

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
  const { user, isAuthenticated, logout, updateUser } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  // Initialize activeTab from localStorage, default to 'profile'
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const savedTab = localStorage.getItem('accountActiveTab');
    return (savedTab as TabType) || 'profile';
  });
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [reorderingOrderId, setReorderingOrderId] = useState<string | null>(null);
  const [currentOrderPage, setCurrentOrderPage] = useState(1);
  const ORDERS_PER_PAGE = 5;
  // Address components

  // Profile editing state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedName, setEditedName] = useState(user?.name || '');
  const [editedPhone, setEditedPhone] = useState(user?.phone || '');
  const [profileErrors, setProfileErrors] = useState<{ name?: string; phone?: string }>({});
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [newAddress, setNewAddress] = useState<AddressFormData>({
    name: '',
    phone: user?.phone || '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });

  // Save active tab to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('accountActiveTab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    loadData();
  }, [isAuthenticated, navigate]);

  // Update newAddress default phone and name when user data changes
  useEffect(() => {
    setNewAddress((prev) => ({
      ...prev,
      name: user?.name || '',
      phone: user?.phone || '',
    }));
  }, [user?.phone, user?.name]);

  // Update edited profile fields when user data changes
  useEffect(() => {
    if (!isEditingProfile) {
      setEditedName(user?.name || '');
      setEditedPhone(user?.phone || '');
    }
  }, [user?.name, user?.phone, isEditingProfile]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [addressesData, ordersData] = await Promise.all([
        userService.getAddresses(),
        orderService.getUserOrders(),
      ]);
      setAddresses(addressesData);
      setOrders(ordersData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const validateProfileForm = (): boolean => {
    const errors: { name?: string; phone?: string } = {};

    if (!editedName.trim()) {
      errors.name = 'Name is required';
    }

    if (!editedPhone.trim()) {
      errors.phone = 'Phone number is required';
    } else {
      // Remove non-digits for validation
      const cleaned = editedPhone.replace(/\D/g, '');
      if (cleaned.length !== 10) {
        errors.phone = 'Phone number must be 10 digits';
      }
    }

    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveProfile = async () => {
    if (!validateProfileForm()) return;

    try {
      setIsSavingProfile(true);
      // Just save the 10 digit phone number without +91
      let phoneToSave = editedPhone.replace(/\D/g, '');

      await userService.updateProfile({
        name: editedName.trim(),
        phone: phoneToSave,
      });

      // Update the user context immediately to reflect changes on the page
      updateUser({
        name: editedName.trim(),
        phone: phoneToSave,
      });

      toast.success('Profile updated successfully');
      setIsEditingProfile(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
      toast.error(errorMessage);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateAddressForm(newAddress);
    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) return;

    try {
      await userService.addAddress(newAddress);
      setNewAddress({
        name: '',
        phone: user?.phone || '',
        address: '',
        city: '',
        state: '',
        pincode: '',
      });
      setShowAddressForm(false);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add address');
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return;
    try {
      await userService.deleteAddress(id);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete address');
    }
  };

  const handleReorder = async (order: Order) => {
    try {
      setReorderingOrderId(order.id);
      
      // Fetch current product details to check stock status
      const allProducts = await productService.fetchProducts();
      const productMap = new Map(allProducts.map(p => [p.id, p]));
      
      // Check if any item is out of stock
      const outOfStockItems = order.items.filter(item => {
        const product = productMap.get(item.productId);
        return product?.isOutOfStock;
      });
      
      if (outOfStockItems.length > 0) {
        const outOfStockNames = outOfStockItems.map(item => item.product?.name || item.productName).join(', ');
        toast.error(`Sorry! ${outOfStockNames} ${outOfStockItems.length === 1 ? 'is' : 'are'} out of stock`);
        return;
      }
      
      // Add all items to cart
      for (const item of order.items) {
        await addToCart(
          item.product,
          item.quantity,
          item.flavor,
          item.size
        );
      }
      
      toast.success('Order added to cart! Redirecting...');
      setTimeout(() => {
        navigate('/cart');
      }, 1500);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to reorder');
    } finally {
      setReorderingOrderId(null);
    }
  };

  const sidebarItems = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'addresses', label: 'Addresses', icon: MapPin },
    { id: 'orders', label: 'Orders', icon: Package },
  ];

  if (loading) {
    return <div className="min-h-screen bg-neutral-50 flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-8 md:py-12">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-8 text-neutral-900">My Account</h1>

        <div className="flex flex-col md:flex-row gap-6">
          {/* SIDEBAR */}
          <div className="md:w-48">
            <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 space-y-2 sticky top-20">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as TabType)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                      activeTab === item.id
                        ? 'bg-teal-900 text-white'
                        : 'text-neutral-700 hover:bg-neutral-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}

              <div className="border-t border-neutral-200 pt-4 mt-4">
                <button
                  onClick={() => {
                    logout();
                    navigate('/');
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            </div>
          </div>

          {/* CONTENT */}
          <div className="flex-1">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Error</p>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            )}

            {/* PROFILE TAB */}
            {activeTab === 'profile' && (
              <div className="bg-white rounded-lg shadow-sm p-6 md:p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl md:text-2xl font-bold text-neutral-900">Profile Information</h2>
                  {!isEditingProfile && (
                    <button
                      onClick={() => {
                        setEditedName(user?.name || '');
                        setEditedPhone(user?.phone || '');
                        setProfileErrors({});
                        setIsEditingProfile(true);
                      }}
                      className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition"
                    >
                      Edit Profile
                    </button>
                  )}
                </div>

                {isEditingProfile ? (
                  <div className="space-y-4">
                    {/* Name Field */}
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          profileErrors.name ? 'border-red-500' : 'border-neutral-300'
                        }`}
                        placeholder="Enter your name"
                      />
                      {profileErrors.name && (
                        <p className="text-sm text-red-600 mt-1">{profileErrors.name}</p>
                      )}
                    </div>

                    {/* Email Field (Read-only) */}
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-gray-100 text-neutral-600 cursor-not-allowed"
                      />
                    </div>

                    {/* Phone Field */}
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={editedPhone}
                        onChange={(e) => {
                          let val = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setEditedPhone(val);
                        }}
                        maxLength={10}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          profileErrors.phone ? 'border-red-500' : 'border-neutral-300'
                        }`}
                        placeholder="10 digit number"
                      />
                      {profileErrors.phone && (
                        <p className="text-sm text-red-600 mt-1">{profileErrors.phone}</p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={handleSaveProfile}
                        disabled={isSavingProfile}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-400 transition flex items-center justify-center gap-2"
                      >
                        {isSavingProfile ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4" />
                            Save Changes
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingProfile(false);
                          setProfileErrors({});
                        }}
                        disabled={isSavingProfile}
                        className="flex-1 px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg font-medium hover:bg-neutral-50 transition disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Name</label>
                      <p className="text-neutral-900">{user?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Email</label>
                      <p className="text-neutral-900">{user?.email || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Phone</label>
                      <p className="text-neutral-900">{user?.phone || 'Not provided'}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ADDRESSES TAB */}
            {activeTab === 'addresses' && (
              <div>
                {!showAddressForm && (
                  <button
                    onClick={() => setShowAddressForm(true)}
                    className="mb-6 flex items-center gap-2 bg-teal-900 text-white px-4 py-2 rounded-lg hover:bg-teal-800 transition"
                  >
                    <Plus className="w-5 h-5" />
                    Add New Address
                  </button>
                )}

                {showAddressForm && (
                  <div className="bg-white rounded-lg shadow-sm p-6 md:p-8 mb-6">
                    <h3 className="text-lg font-bold mb-4 text-neutral-900">Add New Address</h3>
                    <form onSubmit={handleAddressSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-1">Full Name *</label>
                          <input
                            type="text"
                            value={newAddress.name}
                            disabled
                            className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-gray-100 text-neutral-600 cursor-not-allowed"
                            placeholder="Full name will be populated from your profile"
                          />
                          <p className="text-xs text-neutral-500 mt-1">Uses name from your profile</p>
                          {validationErrors.name && <p className="text-red-600 text-xs mt-1">{validationErrors.name}</p>}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-1">Phone *</label>
                          <div className="flex gap-2">
                            <div className="flex items-center px-3 py-2 border border-neutral-300 rounded-lg bg-gray-100 text-neutral-600">
                              +91
                            </div>
                            <input
                              type="text"
                              value={newAddress.phone.replace(/^91/, '')}
                              disabled
                              className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg bg-gray-100 text-neutral-600 cursor-not-allowed"
                            />
                          </div>
                          <p className="text-xs text-neutral-500 mt-1">Uses phone number from your profile</p>
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-neutral-700 mb-1">Address *</label>
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
                            placeholder="123 Main Street"
                          />
                          {validationErrors.address && <p className="text-red-600 text-xs mt-1">{validationErrors.address}</p>}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-1">State *</label>
                          <select
                            value={newAddress.state}
                            onChange={(e) => {
                              setNewAddress({ ...newAddress, state: e.target.value });
                              if (validationErrors.state) setValidationErrors({ ...validationErrors, state: undefined });
                            }}
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                              validationErrors.state ? 'border-red-500 focus:ring-red-500' : 'border-neutral-300 focus:ring-teal-800'
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

                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-1">City *</label>
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
                            placeholder="Enter your city"
                          />
                          {validationErrors.city && <p className="text-red-600 text-xs mt-1">{validationErrors.city}</p>}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-1">Pincode *</label>
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
                          className="flex-1 bg-teal-900 text-white px-4 py-2 rounded-lg hover:bg-teal-800 transition font-medium"
                        >
                          Save Address
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddressForm(false);
                            setValidationErrors({});
                          }}
                          className="flex-1 border border-neutral-300 text-neutral-700 px-4 py-2 rounded-lg hover:bg-neutral-50 transition font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* ADDRESSES LIST */}
                <div className="space-y-4">
                  {addresses.length > 0 ? (
                    addresses.map((address) => (
                      <div key={address.id} className="bg-white rounded-lg shadow-sm p-4 md:p-6">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-bold text-neutral-900">{address.name}</h3>
                            <p className="text-sm text-neutral-600">{address.phone}</p>
                          </div>
                          {address.isDefault && (
                            <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-neutral-700 mb-3">
                          {address.address}, {address.city}, {address.state} {address.pincode}
                        </p>
                        <button
                          onClick={() => handleDeleteAddress(address.id)}
                          className="text-red-600 hover:text-red-800 flex items-center gap-2 text-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                      <MapPin className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                      <p className="text-neutral-600">No addresses saved yet</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ORDERS TAB */}
            {activeTab === 'orders' && (
              <div className="space-y-5">
                {orders.length > 0 ? (
                  <>
                    {/* Orders List */}
                    <div className="space-y-4">
                      {orders
                        .slice((currentOrderPage - 1) * ORDERS_PER_PAGE, currentOrderPage * ORDERS_PER_PAGE)
                        .map((order) => (
                          <div
                            key={order.id}
                            className="bg-white border border-gray-200 rounded-lg shadow-sm  hover:shadow-md transition"
                          >
                          {/* Order Header Strip */}
                          <div className="bg-gray-100 border-b border-gray-200 px-4 md:px-6 py-3">
                            <div className="flex justify-between items-start">

                              {/* LEFT SIDE */}
                              <div className="grid grid-cols-3 gap-8">

                                {/* Order Placed */}
                                <div>
                                  <p className="text-xs text-gray-500 uppercase font-semibold">
                                    Order Placed
                                  </p>
                                  <p className="text-sm font-semibold text-gray-600 mt-1">
                                    {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                      day: 'numeric',
                                      month: 'long',
                                      year: 'numeric',
                                    })}
                                  </p>
                                </div>

                                {/* Total */}
                                <div>
                                  <p className="text-xs text-gray-500 uppercase font-semibold">
                                    Total
                                  </p>
                                  <p className="text-sm font-semibold text-gray-600 mt-1">
                                    ₹{order.totalAmount.toFixed(2)}
                                  </p>
                                </div>

                                {/* Ship To (hover stays same) */}
                                <div className="relative group inline-block">
                                  <p className="text-xs text-gray-500 uppercase font-semibold">
                                    Ship To
                                  </p>

                                  <div className="flex items-center gap-1 text-sm font-semibold text-teal-700 cursor-pointer group-hover:underline">
                                    <span>{order.address?.name}</span>

                                    <svg
                                      className="w-4 h-4 transition-transform duration-200 group-hover:rotate-180"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                  </div>

                                  {/* Hover Card */}
                                  {order.address && (
                                    <div
                                      className="absolute left-0 top-full mt-2 z-[9999]
                                                invisible opacity-0 group-hover:visible group-hover:opacity-100
                                                transition-opacity duration-150"
                                    >
                                      <div className="relative w-50 bg-white border border-gray-300 rounded-lg p-4 text-sm">

                                        {/* Arrow */}
                                        <div className="absolute -top-2 left-6 w-4 h-4 bg-white border-l border-t border-gray-200 rotate-45"></div>

                                        <p className="font-bold text-gray-900">
                                          {order.address.name}
                                        </p>

                                        <p className="mt-1 text-gray-700">
                                          {order.address.address}
                                        </p>

                                        <p className="mt-1 text-gray-700">
                                          {order.address.city}, {order.address.state}
                                        </p>

                                        <p className="text-gray-700">
                                          {order.address.pincode}
                                        </p>

                                        <p className="text-gray-700">
                                          India
                                        </p>

                                        {/* Phone */}
                                        {order.address.phone && (
                                          <div className="mt-2 flex items-center gap-2 text-gray-900 font-semibold">
                                            <svg
                                              className="w-4 h-4 text-gray-700"
                                              fill="none"
                                              stroke="currentColor"
                                              viewBox="0 0 24 24"
                                            >
                                              <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M3 5a2 2 0 012-2h3l2 5-2 1a11 11 0 005 5l1-2 5 2v3a2 2 0 01-2 2A16 16 0 013 5z"
                                              />
                                            </svg>

                                            <span>{order.address.phone}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>

                              </div>

                              {/* RIGHT SIDE */}
                              <div className="text-right space-y-1">
                                <p className="text-sm text-gray-500">
                                  Order # {order.id}
                                </p>

                                <span
                                  className={`inline-block text-xs font-semibold px-3 py-1 rounded-full ${
                                    order.status === 'PENDING'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : order.status === 'CONFIRMED'
                                      ? 'bg-blue-100 text-blue-800'
                                      : order.status === 'DELIVERED'
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-gray-100 text-gray-700'
                                  }`}
                                >
                                  {order.status}
                                </span>
                              </div>

                            </div>
                          </div>

                          {/* Order Tracking Progress */}
                          {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
                            <div className="px-4 md:px-6 py-3 bg-yellow-50 border-t border-yellow-200">
                              <OrderTrackingProgress status={(order.status as 'PENDING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED') || 'PENDING'} />
                            </div>
                          )}

                            {/* Order Items */}
                            <div className="px-4 md:px-6 py-4 space-y-3">
                              {order.items.slice(0, 2).map((item, idx) => {
                                const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
                                const baseUrl = apiBaseUrl.replace('/api', '');
                                let imageUrl = null;

                                if (Array.isArray(item.product?.imageUrls) && item.product.imageUrls.length > 0) {
                                  const imgPath = item.product.imageUrls[0];
                                  imageUrl = imgPath.startsWith('http') ? imgPath : `${baseUrl}${imgPath}`;
                                }

                                return (
                                  <div key={idx} className="flex gap-3">
                                    {imageUrl && (
                                      <img
                                        src={imageUrl}
                                        alt={item.product?.name}
                                        className="w-14 h-14 object-cover border border-gray-200 rounded"
                                      />
                                    )}

                                    <div className="flex-1 text-sm">
                                      <p className="font-medium text-gray-900">
                                        {item.product?.name || item.productName}
                                      </p>
                                      <p className="text-gray-600 text-xs mt-0.5">
                                        Qty: {item.quantity} × ₹{item.price}
                                      </p>

                                      {(item.flavor || item.size) && (
                                        <p className="text-xs text-gray-500 mt-1">
                                          {item.flavor && `Flavor: ${item.flavor}`}
                                          {item.flavor && item.size && ' • '}
                                          {item.size && `Size: ${item.size}`}
                                        </p>
                                      )}
                                    </div>

                                    <div className="text-sm font-semibold text-gray-900">
                                      ₹{(item.quantity * item.price).toFixed(2)}
                                    </div>
                                  </div>
                                );
                              })}
                              {order.items.length > 2 && (
                                <p className="text-xs text-gray-600 pt-2 border-t border-gray-100">
                                  +{order.items.length - 2} more item{order.items.length - 2 > 1 ? 's' : ''}
                                </p>
                              )}
                            </div>

                            {/* Order Actions */}
                            <div className="border-t border-gray-200 px-4 md:px-6 py-3 flex justify-between items-center gap-3 bg-gray-50">
                              <button
                                onClick={() => navigate(`/account/order/${order.id}`)}
                                className="text-sm font-semibold text-teal-700 hover:text-teal-900 hover:underline"
                              >
                                View Details
                              </button>
                              <button
                                onClick={() => handleReorder(order)}
                                disabled={reorderingOrderId === order.id}
                                className={`px-4 py-2 rounded text-sm font-semibold transition ${
                                  reorderingOrderId === order.id
                                    ? 'bg-gray-200 text-gray-600 cursor-not-allowed'
                                    : 'bg-yellow-400 hover:bg-yellow-500 text-black'
                                }`}
                              >
                                {reorderingOrderId === order.id ? 'Reordering...' : 'Reorder'}
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {orders.length > ORDERS_PER_PAGE && (
                      <div className="flex items-center justify-between bg-white rounded-lg shadow-sm p-4 border border-neutral-200">
                        <div className="text-sm text-neutral-600">
                          Showing {(currentOrderPage - 1) * ORDERS_PER_PAGE + 1} to {Math.min(currentOrderPage * ORDERS_PER_PAGE, orders.length)} of {orders.length} orders
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setCurrentOrderPage(prev => Math.max(1, prev - 1))}
                            disabled={currentOrderPage === 1}
                            className="px-3 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium text-sm"
                          >
                            Previous
                          </button>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: Math.ceil(orders.length / ORDERS_PER_PAGE) }, (_, i) => i + 1).map((page) => (
                              <button
                                key={page}
                                onClick={() => setCurrentOrderPage(page)}
                                className={`w-10 h-10 rounded-lg font-medium text-sm transition ${
                                  currentOrderPage === page
                                    ? 'bg-teal-900 text-white shadow-md'
                                    : 'border border-neutral-300 hover:bg-neutral-50'
                                }`}
                              >
                                {page}
                              </button>
                            ))}
                          </div>
                          <button
                            onClick={() => setCurrentOrderPage(prev => Math.min(Math.ceil(orders.length / ORDERS_PER_PAGE), prev + 1))}
                            disabled={currentOrderPage === Math.ceil(orders.length / ORDERS_PER_PAGE)}
                            className="px-3 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium text-sm"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-white rounded-xl shadow-md p-12 text-center border border-neutral-200">
                    <Package className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                    <p className="text-neutral-700 font-medium mb-2">No orders yet</p>
                    <p className="text-neutral-500 text-sm mb-6">Start shopping to see your orders here</p>
                    <button
                      onClick={() => navigate('/dashboard')}
                      className="bg-teal-900 text-white px-6 py-2 rounded-lg hover:bg-teal-800 transition font-medium"
                    >
                      Continue Shopping
                    </button>
                  </div>
                  
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      
    </div>
  );
};
