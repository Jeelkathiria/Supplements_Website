import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, MapPin, Package, AlertCircle, Trash2, Plus, Check, ChevronLeft, ChevronsLeft, ChevronsRight, Menu, X, ChevronDown } from 'lucide-react';
import { useAuth } from '../components/context/AuthContext';
import { useCart } from '../components/context/CartContext';
import { BillModal } from '../components/BillModal';
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
  const [, setReorderingOrderId] = useState<string | null>(null);
  const [currentOrderPage, setCurrentOrderPage] = useState(1);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [selectedOrderForBill, setSelectedOrderForBill] = useState<Order | null>(null);
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

  const handleShowInvoice = (order: Order) => {
    setSelectedOrderForBill(order);
    setIsBillModalOpen(true);
  };

  if (loading) {
    return <div className="min-h-screen bg-neutral-50 flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFB] py-8 md:py-12">
      <div className="max-w-[1440px] mx-auto px-4 md:px-10">
        <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
          {/* Mobile Menu Toggle - Top Left */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden p-2.5 bg-white border border-neutral-200 rounded-xl shadow-sm text-teal-900 hover:text-teal-700 active:scale-95 transition-all"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-3xl font-bold tracking-tight text-neutral-900 mb-0.5 md:mb-1 truncate">Account Dashboard</h1>
            <p className="text-neutral-500 text-[11px] md:text-sm font-medium truncate">Manage your personal information and track activity</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-10 items-start">
          {/* MINIMALIST COLLAPSIBLE SIDEBAR */}
          <div
            className={`hidden md:block flex-shrink-0 transition-all duration-500 ease-in-out sticky top-24 ${isSidebarCollapsed ? 'w-20' : 'w-72'
              }`}
          >
            <div className="bg-white border border-neutral-200 rounded-3xl overflow-hidden shadow-sm flex flex-col h-full min-h-[750px] transition-all relative">

              {/* Header: Logo & Toggle */}
              <div className="p-6 flex items-center justify-between">
                {!isSidebarCollapsed ? (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-teal-900 flex items-center justify-center text-white font-bold">S</div>
                    <span className="font-bold text-lg text-neutral-900">Supplements</span>
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-teal-900 flex items-center justify-center text-white font-bold mx-auto transition-all">S</div>
                )}

                {!isSidebarCollapsed && (
                  <button
                    onClick={() => setIsSidebarCollapsed(true)}
                    className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors text-neutral-400"
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </button>
                )}

                {isSidebarCollapsed && (
                  <button
                    onClick={() => setIsSidebarCollapsed(false)}
                    className="absolute -right-3 top-7 bg-white border border-neutral-200 p-1 rounded-full shadow-sm hover:bg-neutral-50 z-10 transition-transform active:scale-90"
                  >
                    <ChevronsRight className="w-3 h-3 text-neutral-500" />
                  </button>
                )}
              </div>

              {/* User Profile Section */}
              <div className={`mx-4 mb-6 p-4 rounded-2xl transition-all ${isSidebarCollapsed ? 'px-0 bg-transparent border-none' : 'bg-neutral-50 border border-neutral-100'}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 min-w-[2.5rem] rounded-xl bg-teal-900 text-white flex items-center justify-center font-bold text-sm shadow-md overflow-hidden flex-shrink-0">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  {!isSidebarCollapsed && (
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-neutral-900 truncate">{user?.name || 'User'}</p>
                      <p className="text-[10px] text-neutral-500 truncate">{user?.email}</p>
                    </div>
                  )}
                  {!isSidebarCollapsed && <ChevronLeft className="w-3 h-3 text-neutral-400 rotate-[-90deg] flex-shrink-0" />}
                </div>
              </div>

              {/* Navigation Menu */}
              <div className="flex-1 px-3 space-y-1">
                {[
                  { id: 'profile', label: 'Profile', icon: User },
                  { id: 'addresses', label: 'Addresses', icon: MapPin },
                  { id: 'orders', label: 'Orders', icon: Package, badge: orders.length },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id as TabType)}
                      className={`w-full flex items-center gap-3.5 py-3 rounded-xl transition-all relative group h-12 ${isSidebarCollapsed ? 'justify-center mx-auto' : 'px-4'
                        } ${isActive
                          ? 'bg-teal-900 text-white font-bold shadow-teal-900/10 shadow-lg'
                          : 'text-neutral-500 hover:bg-teal-50 hover:text-teal-900'
                        }`}
                    >
                      <Icon className={`w-5 h-5 flex-shrink-0 transition-colors ${isActive ? 'text-white' : 'text-neutral-400 group-hover:text-teal-600'}`} />
                      {!isSidebarCollapsed && (
                        <span className="flex-1 text-left text-[14px] font-medium tracking-tight truncate">{item.label}</span>
                      )}
                      {!isSidebarCollapsed && item.badge !== undefined && item.badge > 0 && (
                        <span className="bg-teal-600 text-white text-[10px] px-1.5 py-0.5 rounded-md font-bold min-w-[1.2rem] text-center ml-auto">
                          {item.badge}
                        </span>
                      )}

                      {isSidebarCollapsed && (
                        <div className="absolute left-full ml-4 px-3 py-2 bg-neutral-900 text-white text-[11px] rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all translate-x-[-10px] group-hover:translate-x-0 whitespace-nowrap z-50 shadow-xl">
                          {item.label}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Bottom Section: Sign Out Only */}
              <div className="p-4 border-t border-neutral-100">
                <button
                  onClick={() => { logout(); navigate('/'); }}
                  className={`w-full flex items-center gap-3.5 py-3 rounded-xl transition-all text-rose-500 hover:bg-rose-50 group font-bold ${isSidebarCollapsed ? 'justify-center mx-auto' : 'px-4'
                    }`}
                >
                  <LogOut className="w-5 h-5 flex-shrink-0" />
                  {!isSidebarCollapsed && <span className="text-[14px] flex-1 text-left">Sign out</span>}
                </button>
              </div>
            </div>
          </div>

          {/* MOBILE SIDEBAR MODAL / DRAWER */}
          {isMobileMenuOpen && (
            <div className="fixed inset-0 z-[100] md:hidden">
              {/* Backdrop */}
              <div
                className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={() => setIsMobileMenuOpen(false)}
              />

              {/* Drawer Content */}
              <div className="absolute left-0 top-0 bottom-0 w-[280px] bg-white shadow-2xl animate-in slide-in-from-left duration-300 flex flex-col">
                <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-teal-900 flex items-center justify-center text-white font-bold">S</div>
                    <span className="font-bold text-lg text-neutral-900">Supplements</span>
                  </div>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 hover:bg-neutral-100 rounded-xl transition-colors text-neutral-400"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                  {/* Profile */}
                  <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-100">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-lg">
                        {user?.name?.charAt(0) || 'U'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-neutral-900 truncate">{user?.name || 'User'}</p>
                        <p className="text-[10px] text-neutral-500 truncate">{user?.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="space-y-1">
                    {[
                      { id: 'profile', label: 'Profile', icon: User },
                      { id: 'addresses', label: 'Addresses', icon: MapPin },
                      { id: 'orders', label: 'Orders', icon: Package, badge: orders.length },
                    ].map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => { setActiveTab(item.id as TabType); setIsMobileMenuOpen(false); }}
                          className={`w-full flex items-center gap-4 py-4 px-4 rounded-xl transition-all ${isActive
                            ? 'bg-teal-900 text-white font-bold shadow-lg shadow-teal-900/10'
                            : 'text-neutral-500 hover:bg-teal-50'
                            }`}
                        >
                          <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-neutral-400'}`} />
                          <span className="text-[15px] font-medium">{item.label}</span>
                          {item.badge !== undefined && item.badge > 0 && (
                            <span className="bg-teal-600 text-white text-[10px] px-1.5 py-0.5 rounded-md font-bold ml-auto">
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="p-4 border-t border-neutral-100">
                  <button
                    onClick={() => { logout(); navigate('/'); }}
                    className="w-full flex items-center gap-4 py-4 px-4 text-rose-500 font-bold"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="text-[15px]">Sign out</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* CONTENT AREA */}
          <div className="flex-1 min-w-0 w-full animate-in fade-in slide-in-from-bottom-4 duration-1000">
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
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${profileErrors.name ? 'border-red-500' : 'border-neutral-300'
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
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${profileErrors.phone ? 'border-red-500' : 'border-neutral-300'
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
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${validationErrors.address ? 'border-red-500 focus:ring-red-500' : 'border-neutral-300 focus:ring-teal-800'
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
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${validationErrors.state ? 'border-red-500 focus:ring-red-500' : 'border-neutral-300 focus:ring-teal-800'
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
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${validationErrors.city ? 'border-red-500 focus:ring-red-500' : 'border-neutral-300 focus:ring-teal-800'
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
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${validationErrors.pincode ? 'border-red-500 focus:ring-red-500' : 'border-neutral-300 focus:ring-teal-800'
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
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-neutral-900">Your Orders</h2>

                  {/* Amazon style sub-tabs */}
                  <div className="flex items-center gap-8 border-b border-neutral-200 mt-4 overflow-x-auto no-scrollbar">
                    {['Orders', 'Buy Again', 'Not Yet Shipped', 'Cancelled'].map((tab, idx) => (
                      <button
                        key={tab}
                        className={`pb-3 text-sm font-medium whitespace-nowrap transition-colors relative ${idx === 0 ? 'text-orange-700 border-b-2 border-orange-700' : 'text-neutral-600 hover:text-orange-700'}`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  {/* Filter Section */}
                  <div className="flex flex-col md:flex-row gap-4 mt-6 items-start md:items-center text-[13px]">
                    <div className="flex items-center gap-2">
                      <span className="text-neutral-600"><strong>{orders.length} orders</strong> placed in</span>
                      <div className="relative">
                        <select className="appearance-none bg-neutral-100 border border-neutral-300 rounded-lg px-4 py-1.5 pr-8 focus:outline-none focus:ring-2 focus:ring-teal-800 cursor-pointer">
                          <option>past 3 months</option>
                          <option>last 30 days</option>
                          <option>2024</option>
                          <option>2023</option>
                        </select>
                        <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500" />
                      </div>
                    </div>
                  </div>
                </div>

                {orders.length > 0 ? (
                  <div className="space-y-6">
                    {orders
                      .slice((currentOrderPage - 1) * ORDERS_PER_PAGE, currentOrderPage * ORDERS_PER_PAGE)
                      .map((order) => (
                        <div key={order.id} className="bg-white border border-neutral-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                          {/* Order Header - Amazon Style */}
                          <div className="bg-neutral-50 border-b border-neutral-200 px-4 md:px-6 py-3 flex flex-wrap gap-y-4 items-center justify-between text-[11px] text-neutral-600">
                            <div className="flex flex-wrap gap-x-4 md:gap-x-10 gap-y-2">
                              <div className="min-w-[80px]">
                                <p className="uppercase font-bold tracking-wider mb-0.5">Order Placed</p>
                                <p className="text-[12px] md:text-[13px] font-medium text-neutral-900 whitespace-nowrap">
                                  {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                  })}
                                </p>
                              </div>
                              <div className="min-w-[60px]">
                                <p className="uppercase font-bold tracking-wider mb-0.5">Total</p>
                                <p className="text-[12px] md:text-[13px] font-medium text-neutral-900">₹{order.totalAmount.toFixed(2)}</p>
                              </div>
                              <div className="relative group">
                                <p className="uppercase font-bold tracking-wider mb-0.5">Ship To</p>
                                <button className="flex items-center gap-1 text-teal-700 hover:text-orange-700 group-hover:underline text-[12px] md:text-[13px] font-medium">
                                  <span className="truncate max-w-[80px] md:max-w-none">{order.address?.name}</span>
                                  <ChevronDown className="w-3.5 h-3.5 transition-transform group-hover:rotate-180" />
                                </button>

                                {/* Hover Card */}
                                {order.address && (
                                  <div className="absolute left-0 top-full mt-2 z-50 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-200">
                                    <div className="bg-white border border-neutral-200 rounded-lg shadow-xl p-4 w-64 text-neutral-800 text-xs">
                                      <div className="absolute -top-1.5 left-6 w-3 h-3 bg-white border-l border-t border-neutral-200 rotate-45"></div>
                                      <p className="font-bold mb-1 text-sm">{order.address.name}</p>
                                      <p className="leading-relaxed">
                                        {order.address.address}<br />
                                        {order.address.city}, {order.address.state} {order.address.pincode}<br />
                                        India
                                      </p>
                                      {order.address.phone && <p className="mt-2 font-semibold">Phone: {order.address.phone}</p>}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="text-right w-full md:w-auto mt-2 md:mt-0 pt-2 md:pt-0 border-t md:border-t-0 border-neutral-200 md:border-transparent flex md:flex-col justify-between items-center md:items-end">
                              <div>
                                <p className="uppercase font-bold tracking-wider mb-0.5 text-[9px] md:text-[10px]">Order # {order.id.slice(-12).toUpperCase()}</p>
                                <div className="flex items-center justify-end gap-2 md:gap-3 text-teal-700 font-medium text-[12px] md:text-[13px]">
                                  <button onClick={() => navigate(`/account/order/${order.id}`)} className="hover:text-orange-700 hover:underline">Details</button>
                                  <span className="text-neutral-300 font-light">|</span>
                                  <button
                                    onClick={() => handleShowInvoice(order)}
                                    className="hover:text-orange-700 hover:underline"
                                  >
                                    Invoice
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Order Body */}
                          <div className="p-4 md:p-6">
                            <h3 className={`text-[17px] font-bold mb-4 ${order.status === 'DELIVERED' ? 'text-neutral-900' : 'text-emerald-700'}`}>
                              {order.status === 'DELIVERED' ? 'Delivered' : order.status === 'CONFIRMED' ? 'Confirmed' : 'Status: ' + order.status}
                            </h3>

                            <div className="flex flex-col lg:flex-row gap-8">
                              <div className="flex-1 space-y-6">
                                {order.items.map((item, idx) => {
                                  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
                                  const baseUrl = apiBaseUrl.replace('/api', '');
                                  let imageUrl = null;
                                  if (Array.isArray(item.product?.imageUrls) && item.product.imageUrls.length > 0) {
                                    const imgPath = item.product.imageUrls[0];
                                    imageUrl = imgPath.startsWith('http') ? imgPath : `${baseUrl}${imgPath}`;
                                  }

                                  return (
                                    <div key={idx} className="flex gap-4">
                                      <div className="w-20 h-20 md:w-24 md:h-24 bg-neutral-50 rounded-lg border border-neutral-100 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                        {imageUrl ? (
                                          <img src={imageUrl} alt={item.product?.name} className="w-full h-full object-contain mix-blend-multiply" />
                                        ) : (
                                          <Package className="w-8 h-8 text-neutral-300" />
                                        )}
                                      </div>

                                      <div className="flex-1 min-w-0">
                                        <button
                                          onClick={() => navigate(`/product/${item.product?._id}`)}
                                          className="text-sm md:text-base font-medium text-teal-800 hover:text-orange-700 leading-snug line-clamp-2 transition-colors text-left"
                                        >
                                          {item.product?.name || item.productName}
                                        </button>
                                        <p className="text-xs text-neutral-500 mt-1">Sold by: {item.product?.brand || 'Supplements Store'}</p>
                                        <div className="mt-2 flex items-center gap-3">
                                          <button
                                            onClick={() => handleReorder(order)}
                                            className="px-4 py-1.5 bg-yellow-400 hover:bg-yellow-500 rounded-full text-xs font-bold shadow-sm transition-colors"
                                          >
                                            Buy it again
                                          </button>
                                          <button className="text-xs text-neutral-600 hover:text-orange-700 underline font-medium">View your item</button>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Right Actions Column */}
                              <div className="lg:w-64 space-y-2">
                                <button
                                  onClick={() => navigate(`/account/order/${order.id}`)}
                                  className="w-full py-2 bg-neutral-100 border border-neutral-300 rounded-lg text-sm font-medium hover:bg-neutral-200 transition-colors shadow-sm"
                                >
                                  Track package
                                </button>
                                <button className="w-full py-2 bg-neutral-100 border border-neutral-300 rounded-lg text-sm font-medium hover:bg-neutral-200 transition-colors shadow-sm">
                                  Return or replace items
                                </button>
                                <button className="w-full py-2 bg-neutral-100 border border-neutral-300 rounded-lg text-sm font-medium hover:bg-neutral-200 transition-colors shadow-sm">
                                  Share gift receipt
                                </button>
                                <button className="w-full py-2 bg-neutral-100 border border-neutral-300 rounded-lg text-sm font-medium hover:bg-neutral-200 transition-colors shadow-sm">
                                  Leave delivery feedback
                                </button>
                                <button className="w-full py-2 bg-neutral-100 border border-neutral-300 rounded-lg text-sm font-medium hover:bg-neutral-200 transition-colors shadow-sm">
                                  Write a product review
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}

                    {/* Pagination */}
                    {orders.length > ORDERS_PER_PAGE && (
                      <div className="flex items-center justify-between pt-4">
                        <button
                          onClick={() => setCurrentOrderPage(prev => Math.max(1, prev - 1))}
                          disabled={currentOrderPage === 1}
                          className="px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium text-sm"
                        >
                          Previous
                        </button>
                        <div className="flex items-center gap-2">
                          {Array.from({ length: Math.ceil(orders.length / ORDERS_PER_PAGE) }, (_, i) => i + 1).map(page => (
                            <button
                              key={page}
                              onClick={() => setCurrentOrderPage(page)}
                              className={`w-10 h-10 rounded-lg font-medium text-sm transition ${currentOrderPage === page
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
                          className="px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium text-sm"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </div>
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

      {/* Invoice Modal */}
      <BillModal
        isOpen={isBillModalOpen}
        onClose={() => setIsBillModalOpen(false)}
        order={selectedOrderForBill}
      />
    </div>
  );
};
