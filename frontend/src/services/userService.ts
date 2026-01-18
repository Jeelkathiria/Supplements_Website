import { apiCall } from './apiClient';

export interface Address {
  id: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  state?: string;
  pincode: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id?: string;
  firebaseUid?: string;
  email: string;
  name?: string;
  phone?: string;
}

// Update user profile
export const updateProfile = async (profileData: {
  name?: string;
  phone?: string;
}): Promise<UserProfile> => {
  return apiCall<UserProfile>('/user/profile', {
    method: 'PATCH',
    body: JSON.stringify(profileData),
  });
};

// Add a new address
export const addAddress = async (addressData: {
  name: string;
  phone: string;
  address: string;
  city: string;
  pincode: string;
  state?: string;
  isDefault?: boolean;
}): Promise<Address> => {
  return apiCall<Address>('/user/address', {
    method: 'POST',
    body: JSON.stringify(addressData),
  });
};

// Get all addresses
export const getAddresses = async (): Promise<Address[]> => {
  return apiCall<Address[]>('/user/address');
};

// Set default address
export const setDefaultAddress = async (addressId: string): Promise<Address> => {
  return apiCall<Address>(`/user/address/${addressId}/default`, {
    method: 'PATCH',
  });
};

// Delete address
export const deleteAddress = async (addressId: string): Promise<void> => {
  return apiCall<void>(`/user/address/${addressId}`, {
    method: 'DELETE',
  });
};
