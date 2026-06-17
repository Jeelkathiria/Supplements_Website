import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Eye, Heart } from 'lucide-react';
import { useCart } from './context/CartContext';
import { useFavorites } from './context/FavoritesContext';
import { toast } from 'sonner';
import { Product } from '../types';
import { getProductPricing, getProductSizes, getProductFlavors } from '../utils/pricingUtils';
import { getFullImageUrl } from '../utils/imageUtils';

interface ProductCardProps {
  product: Product;
  variant?: 'featured' | 'discount';
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  variant = 'featured',
}) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { favorites, addFavorite, removeFavorite } = useFavorites();
  const [imageError, setImageError] = useState(false);

  const isProductFavorited = favorites.some((fav) => fav.id === product.id);

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigating to product detail
    if (isProductFavorited) {
      await removeFavorite(product.id);
    } else {
      await addFavorite(product.id);
    }
  };

  // Price calculation - use variant pricing from database
  const pricing = getProductPricing(product);
  const discountPercent = pricing.discountPercent;
  const finalPrice = pricing.finalPrice;

  // Get images from either field
  const images = product.imageUrls || product.images || [];



  // Filter out base64 images that might be too large, use placeholder if none available
  const displayImage = images.length > 0 ? getFullImageUrl(images[0]) : '/placeholder.png';

  const handleView = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(`/product/${product.id}`);
  };

  const handleQuickBuy = (e: React.MouseEvent) => {
    e.preventDefault();
    if (product.isOutOfStock) {
      toast.error('This product is out of stock');
      return;
    }

    // Auto-select 1st size and 1st flavor if available
    const selectedSize = getProductSizes(product)[0];
    const selectedFlavor = getProductFlavors(product)[0];

    addToCart(product, 1, selectedSize, selectedFlavor);
    toast.success(`${product.name} added to cart`);
  };

  const isDiscount = variant === 'discount';
  const isOutOfStock = product.isOutOfStock || false;

  return (
    <Link to={`/product/${product.id}`} className="group block">
      <div
        className={`
          relative rounded-lg overflow-hidden transition-all
          ${isDiscount
            ? 'border border-opacity-50 text-white hover:shadow-2xl hover:scale-105 bg-neutral-800'
            : 'bg-white border border-neutral-200 hover:shadow-lg'}
        `}
      >
        {/* Product Image */}
        <div className="relative h-32 md:h-40 bg-neutral-100 overflow-hidden flex items-center justify-center">
          {!imageError ? (
            <img
              src={displayImage}
              alt={product.name}
              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-neutral-200">
              <div className="text-center">
                <ShoppingCart className="w-12 h-12 text-neutral-400 mx-auto mb-2" />
                <p className="text-sm text-neutral-500">{product.name}</p>
              </div>
            </div>
          )}

          {/* Discount Ribbon Strip */}
          {discountPercent > 0 && (
            <div className="absolute -top-1 -left-1 flex items-center justify-center">
              <div className="relative w-20 h-10 bg-red-600 text-white flex items-center justify-center font-bold text-[11px] shadow-lg"
                style={{
                  clipPath: 'polygon(0 0, 85% 0, 100% 50%, 85% 100%, 0 100%, 15% 50%)',
                  boxShadow: 'inset -2px -2px 5px rgba(0,0,0,0.3)'
                }}>
                {discountPercent}% OFF
              </div>
            </div>
          )}

          {/* HOT Badge for Discount Variant */}
          {isDiscount && (
            <div className="absolute -top-2 -right-2 flex items-center justify-center z-20">
              <div className="relative w-24 h-12 bg-red-600 text-white flex items-center justify-center font-black text-[13px] shadow-2xl border-2 border-red-500 animate-pulse"
                style={{
                  clipPath: 'polygon(15% 0%, 100% 0%, 85% 100%, 0% 100%, 0% 50%)',
                  boxShadow: '0 4px 12px rgba(220, 38, 38, 0.6)'
                }}>
                HOT
              </div>
            </div>
          )}

          {/* Favorite Button */}
          <button
            onClick={handleToggleFavorite}
            className="absolute top-3 right-3 bg-white/80 backdrop-blur-sm rounded-full w-8 h-8 flex items-center justify-center shadow-sm hover:shadow-md transition-all z-10"
          >
            <Heart
              className={`w-4 h-4 transition-colors ${isProductFavorited
                ? 'fill-red-500 text-red-500'
                : 'text-neutral-600 hover:text-red-500'
                }`}
            />
          </button>
        </div>

        {/* Product Info */}
        <div className="p-2 sm:p-3">
          {/* Category */}
          <div
            className={`text-[12px] uppercase tracking-wide font-semibold mb-0.5 ${isDiscount ? 'text-white/70' : 'text-neutral-500'
              }`}
          >
            {product.categoryName || (typeof product.category === 'object' ? product.category?.name : product.category) || 'Product'}
          </div>

          {/* Product Name */}
          <h3
            className={`font-medium mb-1.5 line-clamp-2 transition-colors text-base leading-tight ${isDiscount
              ? 'text-white'
              : 'text-neutral-900 group-hover:text-neutral-600'
              }`}
          >
            {product.name}
          </h3>

          {/* Price Section - Compact */}
          <div className="mb-2 h-14">
            {/* Price with Offer */}
            <div className={`text-x ${isDiscount ? 'text-white/90' : 'text-neutral-600'}`}>
              <span className={`italic text-lg font-bold ${isDiscount ? 'text-white' : 'text-neutral-900'}`}>
                ₹{finalPrice.toFixed(0)}
              </span>
              {discountPercent > 0 && (
                <>
                  <span className="ml-1 text-xs line-through">
                    ₹{pricing.basePrice.toFixed(0)}
                  </span>
                  <span className={`ml-1 text-xs font-bold ${isDiscount ? 'text-yellow-300' : 'text-green-600'}`}>
                    {discountPercent}% off
                  </span>
                </>
              )}
            </div>
            <p className="text-[11px] text-neutral-400 mt-2">
              Inclusive of all taxes
            </p>
            {discountPercent === 0 && <div className="h-3"></div>}

          </div>


          {/* Two Info Lines */}
          <div className="mb-2 space-y-0.5">
            <p className={`text-[10px] ${isDiscount ? 'text-white/90' : 'text-neutral-600'}`}>
              {isOutOfStock ? 'Out of Stock' : 'In Stock'}
            </p>
            <p className={`text-[10px] font-medium ${isDiscount ? 'text-yellow-200' : 'text-green-600'}`}>
              {isDiscount ? 'Limited Time Deal' : '✓ Verified Authentic Product'}
            </p>
          </div>

          {/* View and Add to Cart Buttons */}
          <div className="flex gap-2 mt-2">
            {/* View Button */}
            <button
              onClick={handleView}
              className={`
                flex-1 py-2 px-3 rounded-lg font-bold transition-all text-xs flex items-center justify-center gap-1
                ${isDiscount
                  ? 'bg-neutral-200 text-neutral-800 hover:bg-neutral-300 active:scale-95'
                  : 'bg-neutral-200 text-neutral-800 hover:bg-neutral-300 active:scale-95'
                }
              `}
            >
              <Eye size={14} />
              VIEW
            </button>

            {/* Add to Cart Button */}
            <button
              onClick={handleQuickBuy}
              disabled={isOutOfStock}
              className={`
                flex-1 py-2 px-3 rounded-lg font-bold transition-all text-xs flex items-center justify-center gap-1
                ${isOutOfStock
                  ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                  : isDiscount
                    ? 'bg-white text-neutral-900 hover:bg-neutral-100 active:scale-95'
                    : 'bg-teal-800 text-white hover:bg-teal-900 active:scale-95'
                }
              `}
            >
              <ShoppingCart size={14} />
              ADD
            </button>
          </div>


        </div>
      </div>
    </Link>
  );
};
