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
    const response = await fetch(`${API_BASE_URL}/categories?t=${Date.now()}`);
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
    const response = await fetch(`${API_BASE_URL}/products?t=${Date.now()}`);
    if (!response.ok) throw new Error("Failed to fetch products");
    return await response.json();
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
};

// Get a single product by ID (latest data from database)
export const fetchProductById = async (productId: string): Promise<Product | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/products/${productId}?t=${Date.now()}`);
    if (!response.ok) throw new Error("Failed to fetch product");
    return await response.json();
  } catch (error) {
    console.error("Error fetching product:", error);
    return null;
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
      isOutOfStock: productData.isOutOfStock || false,
      flavors: productData.flavors || [],
      productSizes: productData.productSizes || [],
      variants: productData.variants || [],
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
      isOutOfStock: productData.isOutOfStock || false,
      flavors: productData.flavors || [],
      productSizes: productData.productSizes || [],
      variants: productData.variants || [],
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

// ============= VARIANT MANAGEMENT =============

export interface ProductVariant {
  id: string;
  productId: string;
  size: string;
  flavor: string;
  price: number;
  discount: number;
  discountType: "percent" | "flat";
  finalPrice: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Fetch all variants for a product
 */
export const fetchProductVariants = async (productId: string): Promise<ProductVariant[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/products/${productId}/variants?t=${Date.now()}`);
    if (!response.ok) throw new Error("Failed to fetch variants");
    return await response.json();
  } catch (error) {
    console.error("Error fetching variants:", error);
    return [];
  }
};

/**
 * Create product variants (bulk)
 */
export const createProductVariants = async (
  productId: string,
  variants: Omit<ProductVariant, "id" | "productId" | "createdAt" | "updatedAt">[]
): Promise<ProductVariant[]> => {
  try {
    const token = await getAuthToken();

    if (!token) {
      throw new Error("Not authenticated. Please login first.");
    }

    const response = await fetch(`${API_BASE_URL}/admin/products/${productId}/variants`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ variants }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to create variants (${response.status})`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating variants:", error);
    throw error;
  }
};

/**
 * Update a single variant
 */
export const updateVariant = async (
  variantId: string,
  data: Partial<Omit<ProductVariant, "id" | "productId" | "createdAt" | "updatedAt">>
): Promise<ProductVariant> => {
  try {
    const token = await getAuthToken();

    if (!token) {
      throw new Error("Not authenticated. Please login first.");
    }

    const response = await fetch(`${API_BASE_URL}/admin/products/variants/${variantId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to update variant (${response.status})`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating variant:", error);
    throw error;
  }
};

/**
 * Delete a variant
 */
export const deleteVariant = async (variantId: string): Promise<void> => {
  try {
    const token = await getAuthToken();

    if (!token) {
      throw new Error("Not authenticated. Please login first.");
    }

    const response = await fetch(`${API_BASE_URL}/admin/products/variants/${variantId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to delete variant (${response.status})`);
    }
  } catch (error) {
    console.error("Error deleting variant:", error);
    throw error;
  }
};

/**
 * Get price for specific variant
 */
export const getVariantPrice = async (
  productId: string,
  flavor: string,
  size: string
): Promise<number | null> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/admin/products/${productId}/price?flavor=${encodeURIComponent(flavor)}&size=${encodeURIComponent(size)}&t=${Date.now()}`
    );

    if (!response.ok) throw new Error("Failed to get variant price");

    const data = await response.json();
    return data.price;
  } catch (error) {
    console.error("Error getting variant price:", error);
    return null;
  }
};