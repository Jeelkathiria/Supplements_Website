// Category Type
export interface Category {
  id: string;
  name: string;
}

// ProductVariant Type - represents a size/flavor combination with pricing (from database)
export interface ProductVariant {
  id: string;
  productId: string;
  size: string;
  flavor: string;
  price: number; // Base price
  discount: number; // Discount amount
  discountType: "percent" | "flat";
  finalPrice: number;
  createdAt?: string;
  updatedAt?: string;
}

// Variant Type - legacy support for form data
export interface Variant {
  size: string;
  flavor: string;
  price: number;
  discount: number;
  discountType: "percent" | "flat"; // percent or flat amount
  finalPrice: number; // auto-calculated
}

// New Size-Flavor Structure
export interface SizeFlavor {
  name: string; // Flavor name
  price: number;
}

export interface ProductSize {
  size: string; // e.g., "250g", "500g", "1kg"
  flavors: SizeFlavor[]; // Selected flavors with prices for this size
  discount?: number; // Discount percentage for this size (applies to all flavors)
}

// Product Types
export interface Product {
  id: string;
  name: string;
  description: string;
  imageUrls: string[];
  categoryId?: string;
  categoryName?: string; // Store category name for display
  isOutOfStock: boolean;
  isFeatured?: boolean;
  isSpecialOffer?: boolean;
  isVegetarian?: boolean; // true for veg, false for non-veg
  createdAt?: string;
  updatedAt?: string;
  
  // ProductVariant relations (from database)
  productVariants?: ProductVariant[]; // Array of size/flavor combinations with pricing
  variants?: ProductVariant[]; // Legacy support - maps to productVariants
  
  // Legacy fields - kept for backward compatibility in forms only
  category?: Category | string; // Can be Category object or string (legacy)
  
  // Form temporary fields
  basePrice?: number; // For form input only
  discountPercent?: number; // For form input only
  discount?: number;
  finalPrice?: number; // Calculated from variants
  flavors?: string[]; // List of available flavors
  productSizes?: ProductSize[]; // New structure: sizes with their flavors and prices
  sizes?: string[];
  colors?: string[]; // For backward compatibility
  weight?: number;
  stock?: number;
  stockQuantity?: number; // For backward compatibility
  rating?: number;
  reviews?: number;
  tax?: number; // Tax amount
  images?: string[];
  defaultPrice?: number;
  weights?: string[];
  pricingMatrix?: Record<string, Record<string, number>>;
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
  selectedWeight?: string; // Weight field for dynamic pricing
  flavor?: string;
  size?: string;
}