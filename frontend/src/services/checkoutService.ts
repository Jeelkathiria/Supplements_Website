import { apiCall } from './apiClient';
import type { Address } from './userService';
import type { CartTotals, CartItemResponse } from './cartService';

export interface CheckoutData {
  user: {
    id: string;
    email: string;
    name: string;
    phone?: string;
  };
  addresses: Address[];
  cart: {
    items: CartItemResponse[];
    totals: CartTotals;
  };
}

/**
 * Fetch comprehensive checkout data in a single API call
 * Returns user info, saved addresses, and cart with calculated totals
 */
export const getCheckoutData = async (): Promise<CheckoutData> => {
  return apiCall<CheckoutData>('/user/checkout');
};
