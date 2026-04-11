import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { fetchProducts } from "../../services/productService";

interface CategoryWithImage {
  id: string;
  name: string;
  image: string;
  color: string;
}

const categoryColors = [
  "bg-blue-500",
  "bg-red-600",
  "bg-green-500",
  "bg-yellow-500",
  "bg-teal-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-indigo-500",
];

export const Categories: React.FC = () => {
  const [categories, setCategories] = useState<CategoryWithImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const products = await fetchProducts();
        const categoryMap = new Map<string, { id: string; name: string; image: string }>();

        // Extract unique categories based on categoryName
        products.forEach((product) => {
          const categoryName = product.categoryName || "Uncategorized";
          const categoryId = product.categoryId || categoryName;

          if (
            !categoryMap.has(categoryName) &&
            product.imageUrls &&
            product.imageUrls.length > 0
          ) {
            // Get the filename from imageUrls and construct HTTP URL
            let imagePath = product.imageUrls[0];
            const filename = imagePath.includes('/') ? imagePath.split('/').pop() : imagePath;
            const fullImagePath = `http://localhost:5000/uploads/${filename}`;
            
            categoryMap.set(categoryName, {
              id: categoryId,
              name: categoryName,
              image: fullImagePath,
            });
          }
        });

        // Convert map to array with colors
        const categoriesArray = Array.from(categoryMap.values()).map(
          (data, index) => ({
            id: data.id,
            name: data.name,
            image: data.image,
            color: categoryColors[index % categoryColors.length],
          })
        );

        setCategories(categoriesArray);
      } catch (error) {
        console.error("Failed to load categories:", error);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-[1400px] mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center justify-center">
              <ChevronLeft className="w-6 h-6 text-neutral-800" />
            </Link>
            <div>
              <div className="h-1 w-16 bg-yellow-500 rounded-full mb-2"></div>
              <h1 className="text-2xl md:text-4xl font-black text-neutral-900">
                Categories
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="max-w-[1400px] mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-neutral-500">Loading categories...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-neutral-500">No categories available yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-2 gap-4 md:gap-6">
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/products?category=${encodeURIComponent(category.name)}`}
                className="group relative overflow-hidden rounded-2xl shadow-md transition-all duration-500 hover:shadow-2xl hover:-translate-y-1"
              >
                <div className="relative h-40 sm:h-56 overflow-hidden bg-gray-200">
                  {/* Product Image */}
                  {category.image && (
                    <img
                      src={category.image}
                      alt={category.name}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        target.style.backgroundColor = "#e5e7eb";
                      }}
                    />
                  )}

                  {/* Colored Header */}
                  <div
                    className={`${category.color} absolute top-0 right-0 h-10 w-24 sm:h-16 sm:w-32 transform rotate-12 -translate-y-2 sm:-translate-y-4 translate-x-6 sm:translate-x-8 flex items-center justify-center z-10`}
                  >
                    <span className="text-white font-bold text-xs sm:text-lg text-center px-2 sm:px-4 leading-tight">
                      {category.name}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
