import { auth } from "../firebase";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Get auth token
const getAuthToken = async (): Promise<string | null> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.warn("No authenticated user found");
      return null;
    }
    return await user.getIdToken();
  } catch (error) {
    console.error("Error getting auth token:", error);
    return null;
  }
};

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: number;
  flavor?: string | null;
  size?: string | null;
  product: {
    id: string;
    name: string;
    basePrice: number;
    discountPercent: number;
    gstPercent: number;
    imageUrls: string[];
  };
}

export interface OrderAddress {
  id: string;
  userId: string;
  orderId: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  pincode: string;
}

export interface Order {
  id: string;
  userId: string;
  status: "PENDING" | "PAID" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  totalAmount: number;
  gstAmount: number;
  discount: number;
  paymentMethod?: string;
  items: OrderItem[];
  address: OrderAddress | null;
  createdAt: string;
  updatedAt: string;
  shippedAt?: string | null;
  deliveredAt?: string | null;
  cancellationRequest?: {
    id: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
    reason: string;
  } | null;
}

// Admin endpoints
export const getAllOrders = async (): Promise<Order[]> => {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error("Not authenticated");
    }

    const response = await fetch(`${API_BASE_URL}/admin/orders`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch orders");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching orders:", error);
    throw error;
  }
};

export const updateOrderStatus = async (
  orderId: string,
  status: string
): Promise<Order> => {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error("Not authenticated");
    }

    const response = await fetch(
      `${API_BASE_URL}/admin/orders/${orderId}/status`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to update order status");
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating order status:", error);
    throw error;
  }
};
