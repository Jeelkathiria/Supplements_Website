import React from 'react';
import { Product, ProductVariant } from '../types';
import { getProductFlavors, getProductSizes } from '../utils/pricingUtils';

interface VariantSelectorProps {
  product: Product;
  selectedFlavor: string;
  selectedSize: string;
  onFlavorChange: (flavor: string) => void;
  onSizeChange: (size: string) => void;
  onVariantChange?: (variant: ProductVariant | undefined) => void;
}

export const VariantSelector: React.FC<VariantSelectorProps> = ({
  product,
  selectedFlavor,
  selectedSize,
  onFlavorChange,
  onSizeChange,
  onVariantChange,
}) => {
  const flavors = getProductFlavors(product);
  const sizes = getProductSizes(product);
  const variants = product.productVariants || product.variants || [];

  // Get variant for any combination (to check availability)
  const getVariantForCombo = (flavor: string, size: string): ProductVariant | undefined => {
    return variants.find(v => v.flavor === flavor && v.size === size);
  };

  // Get all variants for a given size
  const getVariantsForSize = (size: string): ProductVariant[] => {
    return variants.filter(v => v.size === size);
  };

  // Check if a flavor is available for current size
  const isFlavorAvailable = (flavor: string): boolean => {
    if (!selectedSize) return true; // All flavors available if no size selected
    return getVariantForCombo(flavor, selectedSize) !== undefined;
  };

  // Check if a size is available for current flavor  
  const isSizeAvailable = (size: string): boolean => {
    if (!selectedFlavor) return true; // All sizes available if no flavor selected
    return getVariantForCombo(selectedFlavor, size) !== undefined;
  };

  // Handle flavor change
  const handleFlavorChange = (flavor: string) => {
    if (!isFlavorAvailable(flavor) && selectedSize) {
      return; // Can't select unavailable flavor
    }
    onFlavorChange(flavor);

    // If this flavor has variants for current size, notify
    if (selectedSize) {
      const variant = getVariantForCombo(flavor, selectedSize);
      onVariantChange?.(variant);
    }
  };

  // Handle size change
  const handleSizeChange = (size: string) => {
    if (!isSizeAvailable(size) && selectedFlavor) {
      return; // Can't select unavailable size
    }
    onSizeChange(size);

    // If this size has variants for current flavor, notify
    if (selectedFlavor) {
      const variant = getVariantForCombo(selectedFlavor, size);
      onVariantChange?.(variant);
    }
  };

  // Get price for size (show first available flavor's price if no flavor selected)
  const getPriceForSize = (size: string): number | null => {
    if (selectedFlavor) {
      const variant = getVariantForCombo(selectedFlavor, size);
      return variant ? variant.finalPrice : null;
    }

    // Show first available variant's price
    const availableVariants = getVariantsForSize(size);
    if (availableVariants.length > 0) {
      return availableVariants[0].finalPrice;
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Flavor Selection */}
      {flavors.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-bold text-neutral-900">Flavour</p>
          <div className="flex flex-wrap gap-2">
            {flavors.map((flavor) => {
              const available = isFlavorAvailable(flavor);
              const isSelected = selectedFlavor === flavor;

              return (
                <button
                  key={flavor}
                  onClick={() => handleFlavorChange(flavor)}
                  disabled={!available}
                  className={`px-4 py-2 border rounded-lg text-sm font-medium transition ${
                    isSelected
                      ? 'border-amber-400 bg-amber-50 text-neutral-900'
                      : available
                        ? 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300'
                        : 'border-neutral-200 bg-neutral-50 text-neutral-400 cursor-not-allowed opacity-50'
                  }`}
                >
                  {flavor}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Size/Weight Selection with Prices */}
      {sizes.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-bold text-neutral-900">Weight</p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {sizes.map((size) => {
              const available = isSizeAvailable(size);
              const isSelected = selectedSize === size;
              const price = getPriceForSize(size);

              return (
                <button
                  key={size}
                  onClick={() => handleSizeChange(size)}
                  disabled={!available}
                  className={`py-3 px-2 border-2 rounded-lg text-center transition ${
                    isSelected
                      ? 'border-amber-400 bg-amber-50'
                      : available
                        ? 'border-neutral-200 bg-white hover:border-neutral-300'
                        : 'border-dashed border-neutral-200 bg-neutral-50 cursor-not-allowed opacity-50'
                  }`}
                >
                  <div className="text-xs font-semibold text-neutral-600">
                    {size}
                  </div>
                  {price !== null && (
                    <div className={`text-sm font-bold mt-1 ${
                      isSelected ? 'text-green-600' : 'text-neutral-900'
                    }`}>
                      ₹{price}
                    </div>
                  )}
                  {!available && (
                    <div className="text-[10px] text-neutral-400 mt-1">
                      -
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
