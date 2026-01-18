import { Product } from "../app/types";
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

// Get all categories
export const fetchCategories = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/categories`);
    if (!response.ok) throw new Error("Failed to fetch categories");
    return await response.json();
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
};

// Get all active products
export const fetchProducts = async (): Promise<Product[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/products`);
    if (!response.ok) throw new Error("Failed to fetch products");
    return await response.json();
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
};

// Create a new product (admin only)
export const createProduct = async (
  productData: Omit<Product, "id" | "createdAt" | "updatedAt" | "finalPrice">
): Promise<Product | null> => {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      throw new Error("Not authenticated. Please login first.");
    }
    
    const payload = {
      name: productData.name,
      description: productData.description,
      basePrice: productData.basePrice,
      discountPercent: productData.discountPercent || 0,
      gstPercent: productData.gstPercent || 0,
      stockQuantity: productData.stockQuantity,
      flavors: productData.flavors || [],
      sizes: productData.sizes || [],
      imageUrls: productData.imageUrls || [],
      isFeatured: productData.isFeatured || false,
      isSpecialOffer: productData.isSpecialOffer || false,
      isVegetarian: productData.isVegetarian || false,
      categoryId: productData.categoryId || "",
    };

    const response = await fetch(`${API_BASE_URL}/admin/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to create product (${response.status})`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating product:", error);
    throw error;
  }
};

// Update a product (admin only)
export const updateProduct = async (
  productId: string,
  productData: Partial<Product>
): Promise<Product | null> => {
  try {
    const token = await getAuthToken();

    if (!token) {
      throw new Error("Not authenticated. Please login first.");
    }

    const payload = {
      name: productData.name,
      description: productData.description,
      basePrice: productData.basePrice,
      discountPercent: productData.discountPercent || 0,
      gstPercent: productData.gstPercent || 0,
      stockQuantity: productData.stockQuantity,
      flavors: productData.flavors || [],
      sizes: productData.sizes || [],
      imageUrls: productData.imageUrls || [],
      isFeatured: productData.isFeatured || false,
      isSpecialOffer: productData.isSpecialOffer || false,
      isVegetarian: productData.isVegetarian || false,
      categoryId: productData.categoryId || "",
    };

    const response = await fetch(`${API_BASE_URL}/admin/products/${productId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to update product (${response.status})`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating product:", error);
    throw error;
  }
};

// Delete a product (admin only)
export const deleteProduct = async (productId: string): Promise<void> => {
  try {
    const token = await getAuthToken();

    if (!token) {
      throw new Error("Not authenticated. Please login first.");
    }

    const response = await fetch(`${API_BASE_URL}/admin/products/${productId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to delete product (${response.status})`);
    }
  } catch (error) {
    console.error("Error deleting product:", error);
    throw error;
  }
};
// Upload single image
export const uploadImage = async (file: File): Promise<string> => {
  try {
    const token = await getAuthToken();

    if (!token) {
      throw new Error("Not authenticated. Please login first.");
    }

    const formData = new FormData();
    formData.append("image", file);

    const response = await fetch(`${API_BASE_URL}/images/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to upload image (${response.status})`);
    }

    const data = await response.json();
    return data.imageUrl;
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
};

// Upload multiple images
export const uploadImages = async (files: File[]): Promise<string[]> => {
  try {
    const token = await getAuthToken();

    if (!token) {
      throw new Error("Not authenticated. Please login first.");
    }

    const formData = new FormData();
    files.forEach((file) => {
      formData.append("images", file);
    });

    const response = await fetch(`${API_BASE_URL}/images/upload-multiple`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to upload images (${response.status})`);
    }

    const data = await response.json();
    return data.imageUrls;
  } catch (error) {
    console.error("Error uploading images:", error);
    throw error;
  }
};