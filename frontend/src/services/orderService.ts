import { apiCall } from './apiClient';

export interface Order {
  id: string;
  userId: string;
  status: string;
  totalAmount: number;
  gstAmount: number;
  discountAmount: number;
  paymentMethod?: string;
  couponCode?: string;
  appliedCoupon?: {
    id: string;
    couponId: string;
    orderId: string;
    userId: string;
    discountAmount: number;
    trainerName: string;
    trainerId?: string;
    appliedDate: string;
    commissionNote?: string;
  };
  items: Array<{
    id: string;
    productId: string;
    quantity: number;
    price: number;
    flavor?: string;
    size?: string;
    product: any;
    productName: string;
    basePrice: number;
    discountPercent: number;
    imageUrl?: string;
  }>;
  address: {
    id: string;
    name: string;
    phone: string;
    address: string;
    city: string;
    state?: string;
    pincode: string;
  };
  user: {
    id: string;
    email: string;
    name: string;
  };
  createdAt: string;
  shippedAt?: string | null;
  deliveredAt?: string | null;
  updatedAt: string;
}

/**
 * Place an order from user's cart with selected address
 * Automatically clears the cart after successful order creation
 */
export const placeOrder = async (
  addressId: string,
  paymentMethod: string = 'cod',
  couponCode?: string,
  couponDiscount?: number
): Promise<Order> => {
  const payload: any = { addressId, paymentMethod };
  if (couponCode) payload.couponCode = couponCode;
  if (couponDiscount) payload.couponDiscount = couponDiscount;
  
  return apiCall<Order>('/orders/place', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

// Get user's orders
export const getUserOrders = async (): Promise<Order[]> => {
  return apiCall<Order[]>('/orders/my');
};

// Get single order
export const getOrder = async (orderId: string): Promise<Order> => {
  return apiCall<Order>(`/orders/${orderId}`);
};

// Cancel order
export const cancelOrder = async (orderId: string): Promise<Order> => {
  return apiCall<Order>(`/orders/${orderId}/cancel`, {
    method: 'DELETE',
  });
};

// Admin: Get all orders
export const getAllOrders = async (status?: string): Promise<Order[]> => {
  const url = `/admin/orders${status ? `?status=${status}` : ''}`;
  return apiCall<Order[]>(url);
};

// Admin: Update order status
export const updateOrderStatus = async (
  orderId: string,
  status: string
): Promise<Order> => {
  return apiCall<Order>(`/admin/orders/${orderId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
};
