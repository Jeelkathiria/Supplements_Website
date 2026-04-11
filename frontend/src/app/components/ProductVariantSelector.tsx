import React, { useState, useMemo } from "react";
import { ProductVariant } from "../../services/productService";

interface ProductVariantSelectorProps {
  variants: ProductVariant[];
  productName: string;
  onSelect?: (variant: ProductVariant) => void;
}

/**
 * Component to display product variants (sizes + flavors) like:
 * 
 * Flavour: [Cola Frost] [Fruit Fury] [Mango Mayhem] [Natty Berries] [Sour Green]
 * Weight: [20g ₹999] [40g ₹999] [150g ₹999] [340g ₹999★] [510g ₹1499★] [540g ₹1999]
 * 
 * Selected options marked with ★
 */
export const ProductVariantSelector: React.FC<ProductVariantSelectorProps> = ({
  variants,
  onSelect,
}) => {
  const [selectedFlavor, setSelectedFlavor] = useState<string>(
    variants.length > 0 ? variants[0].flavor : ""
  );
  const [selectedSize, setSelectedSize] = useState<string>(
    variants.length > 0 ? variants[0].size : ""
  );

  // Get unique flavors and sizes
  const flavors = useMemo(() => {
    return Array.from(new Set(variants.map((v) => v.flavor))).sort();
  }, [variants]);

  const sizes = useMemo(() => {
    return Array.from(new Set(variants.map((v) => v.size))).sort(
      (a, b) => {
        // Custom sort for sizes (340g before 510g before 540g)
        const order = ["20g", "40g", "150g", "340g", "510g", "540g"];
        return order.indexOf(a) - order.indexOf(b);
      }
    );
  }, [variants]);

  // Get available sizes for selected flavor
  const availableSizesForFlavor = useMemo(() => {
    return variants
      .filter((v) => v.flavor === selectedFlavor)
      .map((v) => v.size);
  }, [variants, selectedFlavor]);

  // Get selected variant
  const selectedVariant = useMemo(() => {
    return variants.find(
      (v) => v.flavor === selectedFlavor && v.size === selectedSize
    );
  }, [variants, selectedFlavor, selectedSize]);

  // Handle flavor selection
  const handleFlavorSelect = (flavor: string) => {
    setSelectedFlavor(flavor);
    // Auto-select first available size for this flavor
    const availableSizes = variants
      .filter((v) => v.flavor === flavor)
      .map((v) => v.size);
    if (availableSizes.length > 0 && !availableSizes.includes(selectedSize)) {
      setSelectedSize(availableSizes[0]);
    }
  };

  // Handle size selection
  const handleSizeSelect = (size: string) => {
    setSelectedSize(size);
    if (selectedVariant) {
      onSelect?.(selectedVariant);
    }
  };

  if (variants.length === 0) {
    return <div className="text-neutral-600">No variants available</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-neutral-900">
          Choose Flavour and Weight: {selectedFlavor}, {selectedSize}
        </h3>
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="text-neutral-400 hover:text-neutral-600"
        >
          ▲
        </button>
      </div>

      {/* Flavour Section */}
      <div className="space-y-3">
        <label className="block text-sm font-bold text-neutral-900">
          Flavour
        </label>
        <div className="flex flex-wrap gap-3">
          {flavors.map((flavor) => (
            <button
              key={flavor}
              onClick={() => handleFlavorSelect(flavor)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedFlavor === flavor
                  ? "bg-yellow-300 text-neutral-900 border-2 border-yellow-400"
                  : "bg-white text-neutral-900 border-2 border-neutral-300 hover:border-neutral-400"
              } ${
                flavors.length > 4 && !flavors.slice(0, 4).includes(flavor)
                  ? "opacity-50"
                  : ""
              }`}
            >
              {flavor}
            </button>
          ))}
        </div>
      </div>

      {/* Weight/Size Section */}
      <div className="space-y-3">
        <label className="block text-sm font-bold text-neutral-900">
          Weight
        </label>
        <div className="flex flex-wrap gap-3">
          {sizes.map((size) => {
            const variantForSize = variants.find(
              (v) => v.size === size && v.flavor === selectedFlavor
            );
            const isAvailable =
              availableSizesForFlavor.includes(size);
            const isSelected = selectedSize === size;

            return (
              <button
                key={size}
                onClick={() => isAvailable && handleSizeSelect(size)}
                disabled={!isAvailable}
                className={`px-4 py-3 rounded-lg font-medium transition-all min-w-20 text-center ${
                  isSelected
                    ? "bg-yellow-300 text-neutral-900 border-2 border-yellow-400"
                    : isAvailable
                    ? "bg-white text-neutral-900 border-2 border-neutral-300 hover:border-neutral-400"
                    : "bg-neutral-100 text-neutral-400 border-2 border-dotted border-neutral-300 cursor-not-allowed"
                }`}
              >
                <div className="text-sm">{size}</div>
                {variantForSize && (
                  <div className="text-xs font-bold text-green-600">
                    ₹{variantForSize.finalPrice}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Variant Info */}
      {selectedVariant && (
        <div className="bg-yellow-50 border-l-4 border-yellow-300 p-4 rounded">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-neutral-600">Selected Variant:</p>
              <p className="font-bold text-neutral-900">
                {selectedVariant.flavor} - {selectedVariant.size}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-neutral-600">Price:</p>
              <p className="text-2xl font-bold text-green-600">
                ₹{selectedVariant.finalPrice}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
