import React, { useState, useMemo, useEffect } from "react";
import { Filter, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { ProductCard } from "../components/ProductCard";
import { Breadcrumb } from "../components/Breadcrumb";
import { fetchProducts } from "../../services/productService";
import { Product } from "../types";

type SortType =
  | "popularity"
  | "price-low"
  | "price-high"
  | "rating";

export const ProductListing: React.FC = () => {
  const [priceRange] = useState<[number, number]>([0, 5000]);
  const [products, setProducts] = useState<Product[]>([]);

  const [sortBy, setSortBy] = useState<SortType>("popularity");
  const [selectedCategory, setSelectedCategory] =
    useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("all"); // all, vegetarian, non-vegetarian

  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12; // 4 rows × 3 columns

  const location = useLocation();
  const navigate = useNavigate();

  // Load products on component mount
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await fetchProducts();
        setProducts(data);
      } catch (error) {
        console.error("Failed to load products:", error);
      }
    };

    loadProducts();
  }, []);

  /* ---------- READ QUERY PARAMS ---------- */

  useEffect(() => {
    const params = new URLSearchParams(location.search);

    const search = params.get("search") || "";
    const category = params.get("category") || "all";
    const type = params.get("type") || "all";

    setSearchQuery(search);
    setSelectedCategory(category);
    setSelectedType(type);
  }, [location.search]);

  const categories = useMemo(() => {
    const uniqueCategories = [
      ...new Set(products.map((p) => p.categoryName || (typeof p.category === 'object' ? p.category?.name : p.category) || p.categoryId).filter(Boolean)),
    ];
    return ["all", ...(uniqueCategories as string[])];
  }, [products]);

  /* ---------- RESET ---------- */

  const handleResetFilters = () => {
    setSelectedCategory("all");
    setSelectedType("all");
    setSearchQuery("");
    setSortBy("popularity");
    navigate("/products");
  };

  /* ---------- FILTER + SEARCH + SORT ---------- */

  const filteredAndSortedProducts = useMemo(() => {
    let result = products.filter((product) => {
      const finalPrice = product.finalPrice;

      const priceMatch =
        finalPrice >= priceRange[0] &&
        finalPrice <= priceRange[1];

      const categoryMatch =
        selectedCategory === "all" ||
        (product.categoryName || (typeof product.category === 'object' ? product.category?.name : product.category)) === selectedCategory;

      const typeMatch =
        selectedType === "all" ||
        (selectedType === "vegetarian" ? product.isVegetarian : !product.isVegetarian);

      const searchMatch =
        product.name
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        product.description
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

      return priceMatch && categoryMatch && typeMatch && searchMatch;
    });

    result.sort((a, b) => {
      switch (sortBy) {
        case "popularity":
          return (b.rating || 0) - (a.rating || 0);
        case "price-low":
          return a.finalPrice - b.finalPrice;
        case "price-high":
          return b.finalPrice - a.finalPrice;
        case "rating":
          return (b.rating || 0) - (a.rating || 0);
        default:
          return 0;
      }
    });

    return result;
  }, [priceRange, sortBy, selectedCategory, selectedType, searchQuery, products]);

  // Pagination logic
  const totalPages = Math.ceil(filteredAndSortedProducts.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedProducts = filteredAndSortedProducts.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedType, searchQuery, sortBy]);

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-14">
        <Breadcrumb
          items={[
            { label: "Home", path: "/" },
            { label: "Products" },
          ]}
        />
        <div className="flex flex-col md:flex-row gap-12">
          {/* FILTERS — LEFT */}
          <aside
            className={`w-full md:w-[280px] ${
              showFilters ? "block" : "hidden md:block"
            }`}
          >
            <div className="bg-white rounded-xl border border-neutral-200 p-6 sticky top-24 space-y-8">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2 text-lg">
                  <Filter className="w-4 h-4" />
                  Filters
                </h3>
                <button
                  onClick={handleResetFilters}
                  className="text-xs px-3 py-1 border border-neutral-300 rounded-md hover:bg-neutral-100 transition"
                >
                  RESET
                </button>
              </div>

              {/* Category */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Category
                </label>
                <div className="relative">
                  <select
                    value={selectedCategory}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSelectedCategory(value);

                      const params = new URLSearchParams(
                        location.search,
                      );
                      value === "all"
                        ? params.delete("category")
                        : params.set("category", value);

                      navigate(
                        `/products?${params.toString()}`,
                      );
                    }}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg text-sm appearance-none focus:ring-2 focus:ring-teal-800"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat === "all" ? "All Categories" : cat}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                </div>
              </div>

              {/* Sort */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Sort By
                </label>
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) =>
                      setSortBy(e.target.value as SortType)
                    }
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg text-sm appearance-none focus:ring-2 focus:ring-teal-800"
                  >
                    <option value="popularity">
                      Popularity
                    </option>
                    <option value="price-low">
                      Price: Low to High
                    </option>
                    <option value="price-high">
                      Price: High to Low
                    </option>
                    <option value="rating">
                      Rating: High to Low
                    </option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                </div>
              </div>

              {/* Type - Veg/Non-Veg */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Type
                </label>
                <div className="relative">
                  <select
                    value={selectedType}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSelectedType(value);

                      const params = new URLSearchParams(
                        location.search,
                      );
                      value === "all"
                        ? params.delete("type")
                        : params.set("type", value);

                      navigate(
                        `/products?${params.toString()}`,
                      );
                    }}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg text-sm appearance-none focus:ring-2 focus:ring-teal-800"
                  >
                    <option value="all">All Types</option>
                    <option value="vegetarian">Vegetarian</option>
                    <option value="non-vegetarian">Non-Vegetarian</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </aside>

          {/* PRODUCTS — RIGHT */}
          <div className="flex-1">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-1">
                All Products
              </h1>
              <p className="text-neutral-600">
                Browse our complete range of supplements
              </p>
            </div>

            {/* Mobile filter toggle */}
            <div className="flex justify-between items-center mb-6 md:hidden">
              <p className="text-sm text-neutral-600">
                {filteredAndSortedProducts.length} products
              </p>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 border border-neutral-300 rounded-lg text-sm"
              >
                <Filter className="w-4 h-4" />
                {showFilters ? "Hide Filters" : "Show Filters"}
              </button>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {paginatedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                />
              ))}
            </div>

            {/* Empty */}
            {filteredAndSortedProducts.length === 0 && (
              <div className="text-center py-32">
                <p className="text-neutral-600">
                  No products found for selected filters
                </p>
              </div>
            )}

            {/* Pagination */}
            {filteredAndSortedProducts.length > 0 && totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-2 border border-neutral-300 rounded-lg hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-2 rounded-lg transition ${
                          currentPage === page
                            ? 'bg-teal-800 text-white'
                            : 'border border-neutral-300 hover:bg-neutral-100'
                        }`}
                      >
                        {page}
                      </button>
                    ),
                  )}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 border border-neutral-300 rounded-lg hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
