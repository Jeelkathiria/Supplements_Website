import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Zap } from 'lucide-react';
import { Product } from '../types';
import { calculateFinalPrice } from '../data/products';

interface ProductCardProps {
  product: Product;
  variant?: 'featured' | 'discount';
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  variant = 'featured',
}) => {
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);

  // Price calculation - handle both old and new field names
  const basePrice = product.basePrice || 0;
  const discount = product.discountPercent || product.discount || 0;
  
  const finalPrice = calculateFinalPrice(basePrice, discount);

  // Get images from either field
  const images = product.imageUrls || product.images || [];
  
  // Build full image URL if it's relative
  const getFullImageUrl = (imageUrl: string) => {
    if (!imageUrl) return '/placeholder.png';
    if (imageUrl.startsWith('http')) return imageUrl;
    // If it's a relative path, add the API base URL
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const backendBase = apiBase.replace('/api', '');
    return `${backendBase}${imageUrl}`;
  };
  
  // Filter out base64 images that might be too large, use placeholder if none available
  const displayImage = images.length > 0 ? getFullImageUrl(images[0]) : '/placeholder.png';

  const handleQuickBuy = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(`/product/${product.id}`);
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
        <div className="relative h-64 bg-neutral-100 overflow-hidden flex items-center justify-center">
          {!imageError ? (
            <img
              src={displayImage}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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

          {/* Discount Badge */}
          {discount > 0 && (
            <div className="absolute top-3 left-3 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold">
              {discount}% OFF
            </div>
          )}

          {/* Veg/Non-Veg Badge */}
          <div className="absolute top-3 right-3">
            {product.isVegetarian ? (
              <div className="w-8 h-8 border-2 border-green-600 rounded-sm flex items-center justify-center bg-white">
                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
              </div>
            ) : (
              <div className="w-8 h-8 border-2 border-red-600 rounded-sm flex items-center justify-center bg-white">
                <div className="w-2 h-2 bg-red-600 rounded-full"></div>
              </div>
            )}
          </div>
        </div>

        {/* Product Info */}
        <div className="p-4">
          {/* Category */}
          <div
            className={`text-xs uppercase tracking-widest font-semibold mb-1 ${
              isDiscount ? 'text-white/70' : 'text-neutral-500'
            }`}
          >
            {product.categoryName || (typeof product.category === 'object' ? product.category?.name : product.category) || 'Product'}
          </div>

          {/* Product Name */}
          <h3
            className={`font-bold mb-2 line-clamp-2 transition-colors text-sm ${
              isDiscount
                ? 'text-white'
                : 'text-neutral-900 group-hover:text-neutral-600'
            }`}
          >
            {product.name}
          </h3>

          {/* Price Section */}
          <div className="mb-3">
            {/* Final Price */}
            <div className={`text-2xl font-bold mb-1 ${isDiscount ? 'text-white' : 'text-neutral-900'}`}>
              ₹{finalPrice.toFixed(0)}
            </div>
            
            {/* MRP Section */}
            {discount > 0 && (
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold ${isDiscount ? 'text-white/90' : 'text-neutral-600'}`}>MRP</span>
                <div className={`px-2 py-1 rounded ${isDiscount ? 'bg-white/20' : 'bg-red-100'}`}>
                  <span className={`text-sm line-through ${isDiscount ? 'text-white/80' : 'text-neutral-600'}`}>
                    ₹{basePrice.toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Two Info Lines */}
          <div className="mb-3 space-y-1">
            <p className={`text-xs ${isDiscount ? 'text-white/90' : 'text-neutral-600'}`}>
              {isOutOfStock ? 'Out of Stock' : 'In Stock'}
            </p>
            <p className={`text-xs font-medium ${isDiscount ? 'text-yellow-200' : 'text-green-600'}`}>
              {isDiscount ? '⭐ Limited Time Deal' : '✓ Verified Authentic Product'}
            </p>
          </div>

          {/* Quick Buy Button - Fantastic Style */}
          <button
            onClick={handleQuickBuy}
            disabled={isOutOfStock}
            className={`
              w-full mt-2 py-3 px-4 rounded-lg font-bold transition-all 
              relative overflow-hidden group/btn text-sm tracking-wide 
              ${isOutOfStock
                ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                : isDiscount
                  ? 'bg-white text-neutral-900 hover:bg-neutral-100 shadow-lg hover:shadow-xl hover:scale-110 active:scale-95 font-black'
                  : 'bg-teal-800 text-white hover:bg-teal-900 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95'
              }
            `}
          >
            <span className="flex items-center justify-center gap-2 ">
              <Zap className="w-4 h-4 " />
              QUICK BUY
            </span>
          </button>
        </div>
      </div>
    </Link>
  );
};
