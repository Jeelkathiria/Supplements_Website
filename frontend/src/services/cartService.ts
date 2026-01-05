import { auth } from "../firebase";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Get current Firebase user's ID token
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

export interface CartItemResponse {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  product: any;
  createdAt: string;
  updatedAt: string;
}

export interface CartResponse {
  id: string;
  userId: string;
  items: CartItemResponse[];
  createdAt: string;
  updatedAt: string;
}

// Get user's cart
export const getCart = async (): Promise<CartResponse | null> => {
  try {
    const token = await getAuthToken();
    if (!token) {
      console.warn("No auth token available");
      return null;
    }

    const response = await fetch(`${API_BASE_URL}/cart`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error("Failed to fetch cart:", response.statusText);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching cart:", error);
    return null;
  }
};

// Add item to cart
export const addToCart = async (
  productId: string,
  quantity: number
): Promise<CartItemResponse | null> => {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error("Not authenticated");
    }

    const response = await fetch(`${API_BASE_URL}/cart/add`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ productId, quantity }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to add item to cart");
    }

    return await response.json();
  } catch (error) {
    console.error("Error adding to cart:", error);
    throw error;
  }
};

// Update cart item quantity
export const updateCartItem = async (
  productId: string,
  quantity: number
): Promise<CartItemResponse | null> => {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error("Not authenticated");
    }

    const response = await fetch(`${API_BASE_URL}/cart/update`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ productId, quantity }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to update cart item");
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating cart item:", error);
    throw error;
  }
};

// Remove item from cart
export const removeFromCart = async (
  productId: string
): Promise<void> => {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error("Not authenticated");
    }

    const response = await fetch(`${API_BASE_URL}/cart/remove`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ productId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to remove item from cart");
    }
  } catch (error) {
    console.error("Error removing from cart:", error);
    throw error;
  }
};
