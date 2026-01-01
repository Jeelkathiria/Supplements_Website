import React from 'react';
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

  // Price calculation
  const discountedPrice =
    product.basePrice - (product.basePrice * product.discount) / 100;
  const finalPrice =
    discountedPrice + (discountedPrice * product.tax) / 100;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addToCart(product, 1);
    toast.success(`${product.name} added to cart!`);
  };

  const isDiscount = variant === 'discount';

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
        <div className="relative h-64 bg-neutral-100 overflow-hidden">
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />

          {/* Discount Badge */}
          {product.discount > 0 && (
            <div className="absolute top-3 left-3 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium">
              {product.discount}% OFF
            </div>
          )}

          {/* Quick Add Button */}
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
        </div>

        {/* Product Info */}
        <div className="p-4">
          {/* Category */}
          <div
            className={`text-xs uppercase tracking-wide mb-2 ${
              isDiscount ? 'text-white/70' : 'text-neutral-500'
            }`}
          >
            {product.category}
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
                {product.rating.toFixed(1)}
              </span>
            </div>
            <span
              className={`text-xs ${
                isDiscount ? 'text-white/60' : 'text-neutral-500'
              }`}
            >
              ({product.reviews} reviews)
            </span>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold">
              ₹{finalPrice.toFixed(2)}
            </span>
            {product.discount > 0 && (
              <span
                className={`text-sm line-through ${
                  isDiscount ? 'text-white/60' : 'text-neutral-500'
                }`}
              >
                ₹{product.basePrice.toFixed(2)}
              </span>
            )}
          </div>

          {/* Stock Status */}
          {product.stock < 10 && product.stock > 0 && (
            <div className="mt-2 text-xs text-orange-400">
              Only {product.stock} left in stock
            </div>
          )}
          {product.stock === 0 && (
            <div className="mt-2 text-xs text-red-500 font-medium">
              Out of Stock
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};
