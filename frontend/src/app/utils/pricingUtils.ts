import { Product, ProductVariant } from "../types";

/**
 * Get the first available variant for a product
 */
export const getDefaultVariant = (product: Product): ProductVariant | undefined => {
  const variants = product.productVariants || product.variants || [];
  return variants[0];
};

/**
 * Get pricing info from a product's variants
 * Returns the MINIMUM final price across all variants with discount applied
 */
export const getProductPricing = (product: Product) => {
  const variants = product.productVariants || product.variants || [];
  if (!variants || variants.length === 0) {
    return {
      basePrice: 0,
      discount: 0,
      discountPercent: 0,
      finalPrice: 0,
    };
  }

  // Find the variant with the minimum final price
  let minVariant = variants[0];
  for (const variant of variants) {
    if ((variant.finalPrice || variant.price) < (minVariant.finalPrice || minVariant.price)) {
      minVariant = variant;
    }
  }

  const discountPercent = minVariant.discountType === "percent" ? minVariant.discount : 0;
  
  return {
    basePrice: minVariant.price,
    discount: minVariant.discount,
    discountPercent,
    finalPrice: minVariant.finalPrice,
    discountType: minVariant.discountType,
  };
};

/**
 * Get the final price for a variant
 */
export const getVariantFinalPrice = (variant: ProductVariant): number => {
  return variant.finalPrice;
};

/**
 * Get base price for a variant
 */
export const getVariantBasePrice = (variant: ProductVariant): number => {
  return variant.price;
};

/**
 * Calculate discount percentage for flat discount
 */
export const calculateDiscountPercent = (variant: ProductVariant): number => {
  if (variant.discountType === "percent") {
    return variant.discount;
  }
  // Calculate percentage from flat discount
  return Math.round((variant.discount / variant.price) * 100);
};

/**
 * Format price as currency (INR)
 */
export const formatPrice = (price: number): string => {
  return `₹${price.toFixed(0)}`;
};

/**
 * Get all unique sizes from product variants
 */
export const getProductSizes = (product: Product): string[] => {
  const variants = product.productVariants || product.variants || [];
  return [...new Set(variants.map(v => v.size))];
};

/**
 * Get all unique flavors from product variants
 */
export const getProductFlavors = (product: Product): string[] => {
  const variants = product.productVariants || product.variants || [];
  return [...new Set(variants.map(v => v.flavor))];
};

/**
 * Get variant by size and flavor
 */
export const getVariantByAttributes = (
  product: Product,
  size?: string,
  flavor?: string
): ProductVariant | undefined => {
  const variants = product.productVariants || product.variants || [];
  return variants.find(v => v.size === size && v.flavor === flavor);
};

/**
 * Check if product has variants
 */
export const hasVariants = (product: Product): boolean => {
  const variants = product.productVariants || product.variants || [];
  return variants.length > 0;
};

/**
 * Get cart item price based on selected size and flavor
 * Returns the specific variant's finalPrice or falls back to product minimum price
 */
export const getCartItemPrice = (
  product: Product,
  selectedSize?: string,
  selectedFlavor?: string
): number => {
  const variants = product.productVariants || product.variants || [];
  
  if (!variants || variants.length === 0) {
    return 0;
  }

  // If both size and flavor are specified, find exact match
  if (selectedSize && selectedFlavor) {
    const variant = variants.find(v => v.size === selectedSize && v.flavor === selectedFlavor);
    if (variant) {
      return variant.finalPrice || variant.price;
    }
  }

  // If only size is specified, get minimum price for that size
  if (selectedSize) {
    const sizeVariants = variants.filter(v => v.size === selectedSize);
    if (sizeVariants.length > 0) {
      return Math.min(...sizeVariants.map(v => v.finalPrice || v.price));
    }
  }

  // Fallback to minimum price across all variants
  return Math.min(...variants.map(v => v.finalPrice || v.price));
};
