// Category Type
export interface Category {
  id: string;
  name: string;
}

// Product Types
export interface Product {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  discountPercent: number;
  gstPercent: number;
  imageUrls: string[];
  categoryId?: string;
  categoryName?: string; // Store category name for display
  finalPrice: number;
  stockQuantity: number;
  sizes?: string[];
  flavors?: string[];
  colors?: string[]; // For backward compatibility
  isFeatured?: boolean;
  isActive?: boolean;
  isSpecialOffer?: boolean;
  createdAt?: string;
  updatedAt?: string;
  // For backward compatibility with frontend form
  discount?: number;
  tax?: number;
  images?: string[];
  category?: Category | string; // Can be Category object or string (legacy)
  stock?: number;
  rating?: number;
  reviews?: number;
  // Form temporary fields
  newSize?: string;
  newSizeUnit?: string;
  newFlavor?: string;
}