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
  isVegetarian?: boolean; // true for veg, false for non-veg
  createdAt?: string;
  updatedAt?: string;
  // For backward compatibility with frontend form
  discount?: number;
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

// Cart Item Type
export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
}