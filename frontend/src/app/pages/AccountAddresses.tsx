import React, { useState, useEffect } from 'react';
import { Plus, Trash2, MapPin } from 'lucide-react';
import { useAuth } from '../components/context/AuthContext';
import { toast } from 'sonner';
import * as userService from '../../services/userService';
import type { Address } from '../../services/userService';

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

export const AccountAddresses: React.FC = () => {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [newAddress, setNewAddress] = useState<AddressFormData>({
    name: '',
    phone: user?.phone || '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });

  useEffect(() => {
    loadAddresses();
  }, []);

  useEffect(() => {
    setNewAddress((prev) => ({
      ...prev,
      name: user?.name || '',
      phone: user?.phone || '',
    }));
  }, [user?.phone, user?.name]);

  const loadAddresses = async () => {
    try {
      setLoading(true);
      const data = await userService.getAddresses();
      setAddresses(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load addresses');
    } finally {
      setLoading(false);
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
      setShowForm(false);
      await loadAddresses();
      toast.success('Address added successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add address');
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return;
    try {
      await userService.deleteAddress(id);
      await loadAddresses();
      toast.success('Address deleted successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete address');
    }
  };

  if (loading) {
    return <div className="bg-white rounded-lg shadow-sm p-6 text-center">Loading addresses...</div>;
  }

  return (
    <div>
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="mb-6 flex items-center gap-2 bg-teal-900 text-white px-4 py-2 rounded-lg hover:bg-teal-800 transition"
        >
          <Plus className="w-5 h-5" />
          Add New Address
        </button>
      )}

      {showForm && (
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
                  setShowForm(false);
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
  );
};

export default AccountAddresses;
