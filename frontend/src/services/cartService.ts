import { apiCall } from './apiClient';

export interface CartItem {
  productId: string;
  quantity: number;
  flavor?: string;
  size?: string;
}

export interface CartItemResponse {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  flavor?: string;
  size?: string;
  product: any;
  createdAt: string;
  updatedAt: string;
}

export interface CartTotals {
  subtotal: number;
  discount: number;
  gst: number;
  grandTotal: number;
}

export interface CartResponse {
  id: string;
  userId: string;
  items: CartItemResponse[];
  totals?: CartTotals;
  createdAt: string;
  updatedAt: string;
}

// Get user's cart with totals
export const getCart = async (): Promise<CartResponse> => {
  return apiCall<CartResponse>('/cart');
};

// Add item to cart
export const addToCart = async (
  productId: string,
  quantity: number,
  flavor?: string,
  size?: string
): Promise<CartItemResponse> => {
  return apiCall<CartItemResponse>('/cart/add', {
    method: 'POST',
    body: JSON.stringify({ productId, quantity, flavor, size }),
  });
};

// Update cart item quantity
export const updateCartItem = async (
  productId: string,
  quantity: number
): Promise<CartItemResponse> => {
  return apiCall<CartItemResponse>('/cart/update', {
    method: 'PUT',
    body: JSON.stringify({ productId, quantity }),
  });
};

// Remove item from cart
export const removeFromCart = async (productId: string): Promise<void> => {
  return apiCall<void>('/cart/remove', {
    method: 'DELETE',
    body: JSON.stringify({ productId }),
  });
};

// Merge guest cart with authenticated user's cart
export const mergeGuestCart = async (cartItems: CartItem[]): Promise<CartResponse> => {
  return apiCall<CartResponse>('/cart/merge', {
    method: 'POST',
    body: JSON.stringify({ items: cartItems }),
  });
};
