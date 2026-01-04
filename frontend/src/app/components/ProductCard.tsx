import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, ShoppingCart } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { toast } from 'sonner';

interface ProductCardProps {
  product: Product;
  variant?: 'featured' | 'discount';
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  variant = 'featured',
}) => {
  const { addToCart } = useCart();
  const [imageError, setImageError] = useState(false);

  // Price calculation - handle both old and new field names
  const basePrice = product.basePrice || 0;
  const discount = product.discountPercent || product.discount || 0;
  const tax = product.gstPercent || product.tax || 0;
  
  const discountedPrice = basePrice - (basePrice * discount) / 100;
  const finalPrice = discountedPrice + (discountedPrice * tax) / 100;

  // Get images from either field
  const images = product.imageUrls || product.images || [];
  
  // Filter out base64 images that might be too large, use placeholder if none available
  const displayImage = images.length > 0 ? images[0] : '/placeholder.png';

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (product.stockQuantity === 0) {
      toast.error('This product is out of stock');
      return;
    }
    addToCart(product, 1);
    toast.success(`${product.name} added to cart!`);
  };

  const isDiscount = variant === 'discount';
  const isOutOfStock = product.stockQuantity === 0;

  return (
    <Link to={`/product/${product.id}`} className="group block">
      <div
        className={`
          relative rounded-xl overflow-hidden transition-all
          ${isDiscount
            ? 'bg-white/10 backdrop-blur-lg border border-white/20 text-white hover:shadow-xl'
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
            <div className="absolute top-3 left-3 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium">
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

          {/* Quick Add Button */}
          {!isOutOfStock && (
            <button
              onClick={handleAddToCart}
              className={`
                absolute bottom-3 right-3 p-3 rounded-full transition
                ${isDiscount
                  ? 'bg-white text-neutral-900 opacity-100 hover:bg-neutral-200'
                  : 'bg-neutral-900 text-white opacity-0 group-hover:opacity-100 hover:bg-neutral-800'}
              `}
              aria-label="Add to cart"
            >
              <ShoppingCart className="w-5 h-5" />
            </button>
          )}

          {/* Out of Stock Badge */}
          {isOutOfStock && (
            <div className="absolute bottom-3 right-3 bg-red-600 text-white px-3 py-2 rounded-lg text-xs font-medium">
              Out of Stock
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-4">
          {/* Category */}
          <div
            className={`text-xs uppercase tracking-wide mb-2 ${
              isDiscount ? 'text-white/70' : 'text-neutral-500'
            }`}
          >
            {product.categoryName || (typeof product.category === 'object' ? product.category?.name : product.category) || 'Product'}
          </div>

          {/* Product Name */}
          <h3
            className={`font-medium mb-2 line-clamp-2 transition-colors ${
              isDiscount
                ? 'text-white'
                : 'group-hover:text-neutral-600'
            }`}
          >
            {product.name}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium">
                {(product.rating || 4.5).toFixed(1)}
              </span>
            </div>
            <span
              className={`text-xs ${
                isDiscount ? 'text-white/60' : 'text-neutral-500'
              }`}
            >
              ({product.reviews || 0} reviews)
            </span>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold">
              ₹{finalPrice.toFixed(2)}
            </span>
            {discount > 0 && (
              <span
                className={`text-sm line-through ${
                  isDiscount ? 'text-white/60' : 'text-neutral-500'
                }`}
              >
                ₹{basePrice.toFixed(2)}
              </span>
            )}
          </div>

          {/* Stock Status */}
          {product.stockQuantity !== undefined && product.stockQuantity < 10 && product.stockQuantity > 0 && (
            <div className="mt-2 text-xs text-orange-400">
              Only {product.stockQuantity} left in stock
            </div>
          )}
          {product.stockQuantity === 0 && (
            <div className="mt-2 text-xs text-red-500 font-medium">
              Out of Stock
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};
