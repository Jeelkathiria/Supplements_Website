// Product Types
export interface Product {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  discount: number;
  tax: number;
  images: string[];
  category: string;
  rating: number;
  reviews: number;
  sizes?: string[];
  flavors?: string[];
  colors?: string[];
  stock: number;
  isFeatured?: boolean;
  isSpecialOffer?: boolean;
}