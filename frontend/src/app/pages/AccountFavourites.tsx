import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useCart } from '../components/context/CartContext';
import { useFavorites } from '../components/context/FavoritesContext';
import { toast } from 'sonner';

export const AccountFavourites: React.FC = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { favorites } = useFavorites();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-neutral-900">Your Favorites</h2>
        <p className="text-neutral-600 mt-2">Items you've saved for later</p>
      </div>

      {favorites.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {favorites.map((product) => {
            const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            const baseUrl = apiBaseUrl.replace('/api', '');
            let imageUrl = null;
            if (Array.isArray(product.imageUrls) && product.imageUrls.length > 0) {
              const imgPath = product.imageUrls[0];
              imageUrl = imgPath.startsWith('http') ? imgPath : `${baseUrl}${imgPath}`;
            }

            return (
              <div
                key={product.id}
                className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden hover:shadow-md hover:border-neutral-300 transition-all"
              >
                {/* Image */}
                <div
                  className="relative pt-[100%] bg-neutral-50 cursor-pointer group"
                  onClick={() => navigate(`/product/${product.id}`)}
                >
                  {imageUrl && (
                    <img
                      src={imageUrl}
                      alt={product.name}
                      className="absolute inset-0 w-full h-full object-contain group-hover:scale-105 transition-transform"
                    />
                  )}
                </div>

                {/* Content */}
                <div className="p-2 space-y-2">
                  {/* Category & Stock */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-neutral-500 font-medium">
                      {product.categoryName || 'Supplement'}
                    </span>
                    {product.isOutOfStock ? (
                      <span className="text-xs font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                        Out
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                        Stock
                      </span>
                    )}
                  </div>

                  {/* Name */}
                  <h3
                    onClick={() => navigate(`/product/${product.id}`)}
                    className="font-semibold text-sm text-neutral-900 line-clamp-2 hover:text-teal-700 cursor-pointer transition-colors"
                  >
                    {product.name}
                  </h3>

                  {/* Price */}
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-base font-bold text-neutral-900">
                      ₹{(product.basePrice - (product.basePrice * (product.discountPercent || 0) / 100)).toFixed(0)}
                    </span>
                    {(product.discountPercent || 0) > 0 && (
                      <span className="text-xs font-bold text-green-600 bg-green-50 px-1 py-0.5 rounded">
                        {product.discountPercent}% OFF
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1 pt-2 border-t border-neutral-100">
                    <button
                      onClick={() => {
                        navigate(`/product/${product.id}`);
                      }}
                      className="flex-1 py-1 px-2 bg-teal-900 hover:bg-teal-800 text-white rounded text-xs font-medium transition-colors"
                    >
                      View
                    </button>
                    <button
                      onClick={() => {
                        const selectedSize = product.sizes?.[0];
                        const selectedFlavor = (product.flavors || product.colors)?.[0];
                        addToCart(product, 1, selectedSize, selectedFlavor);
                        toast.success(`${product.name} added to cart`);
                      }}
                      disabled={product.isOutOfStock}
                      className={`flex-1 py-1 px-2 border rounded text-xs font-medium transition-colors ${
                        product.isOutOfStock
                          ? 'border-neutral-300 text-neutral-400 cursor-not-allowed'
                          : 'border-teal-900 text-teal-900 hover:bg-teal-50'
                      }`}
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md p-12 text-center border border-neutral-200">
          <Heart className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
          <p className="text-neutral-700 font-medium mb-2">No favorites yet</p>
          <p className="text-neutral-500 text-sm mb-6">Start adding your favorite products</p>
          <button
            onClick={() => navigate('/products')}
            className="bg-teal-900 text-white px-6 py-2 rounded-lg hover:bg-teal-800 transition font-medium"
          >
            Explore Products
          </button>
        </div>
      )}
    </div>
  );
};

export default AccountFavourites;
