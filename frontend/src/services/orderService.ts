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

export interface CheckoutData {
  cartItems: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
  shippingAddress: {
    name: string;
    phone: string;
    address: string;
    city: string;
    pincode: string;
  };
}

export interface Order {
  id: string;
  userId: string;
  status: string;
  totalAmount: number;
  gstAmount: number;
  discount: number;
  items: Array<{
    id: string;
    productId: string;
    quantity: number;
    price: number;
    product: any;
  }>;
  address: {
    id: string;
    name: string;
    phone: string;
    address: string;
    city: string;
    pincode: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Checkout - Create order
export const checkout = async (data: CheckoutData): Promise<Order | null> => {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error("Not authenticated");
    }

    const response = await fetch(`${API_BASE_URL}/orders/checkout`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Checkout failed");
    }

    const result = await response.json();
    return result.order;
  } catch (error) {
    console.error("Error during checkout:", error);
    throw error;
  }
};

// Get user's orders
export const getUserOrders = async (): Promise<Order[]> => {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error("Not authenticated");
    }

    const response = await fetch(`${API_BASE_URL}/orders/my`, {
      method: "GET",
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

// Get single order
export const getOrder = async (orderId: string): Promise<Order | null> => {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error("Not authenticated");
    }

    const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error("Failed to fetch order");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching order:", error);
    throw error;
  }
};

// Cancel order
export const cancelOrder = async (orderId: string): Promise<Order | null> => {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error("Not authenticated");
    }

    const response = await fetch(`${API_BASE_URL}/orders/${orderId}/cancel`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to cancel order");
    }

    const result = await response.json();
    return result.order;
  } catch (error) {
    console.error("Error cancelling order:", error);
    throw error;
  }
};

// Admin: Get all orders
export const getAllOrders = async (status?: string): Promise<Order[]> => {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error("Not authenticated");
    }

    const url = new URL(`${API_BASE_URL}/orders`);
    if (status) {
      url.searchParams.append("status", status);
    }

    const response = await fetch(url.toString(), {
      method: "GET",
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

// Admin: Update order status
export const updateOrderStatus = async (
  orderId: string,
  status: string
): Promise<Order | null> => {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error("Not authenticated");
    }

    const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to update order status");
    }

    const result = await response.json();
    return result.order;
  } catch (error) {
    console.error("Error updating order status:", error);
    throw error;
  }
};
