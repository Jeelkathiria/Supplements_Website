import React, { useState, useMemo, useEffect } from "react";
import { Filter, ChevronDown } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { ProductCard } from "../components/ProductCard";
import { PRODUCTS } from "../data/products";
import { Breadcrumb } from "../components/Breadcrumb";

type SortType =
  | "popularity"
  | "price-low"
  | "price-high"
  | "rating";

export const ProductListing: React.FC = () => {
  const [priceRange] = useState<[number, number]>([0, 5000]);

  const [sortBy, setSortBy] = useState<SortType>("popularity");
  const [selectedCategory, setSelectedCategory] =
    useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [showFilters, setShowFilters] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  /* ---------- READ QUERY PARAMS ---------- */

  useEffect(() => {
    const params = new URLSearchParams(location.search);

    const search = params.get("search") || "";
    const category = params.get("category") || "all";

    setSearchQuery(search);
    setSelectedCategory(category);
  }, [location.search]);

  const categories = useMemo(() => {
    return ["all", ...new Set(PRODUCTS.map((p) => p.category))];
  }, []);

  /* ---------- RESET ---------- */

  const handleResetFilters = () => {
    setSelectedCategory("all");
    setSearchQuery("");
    setSortBy("popularity");
    navigate("/products");
  };

  /* ---------- FILTER + SEARCH + SORT ---------- */

  const filteredAndSortedProducts = useMemo(() => {
    let result = PRODUCTS.filter((product) => {
      const finalPrice =
        product.basePrice -
        (product.basePrice * product.discount) / 100;

      const priceMatch =
        finalPrice >= priceRange[0] &&
        finalPrice <= priceRange[1];

      const categoryMatch =
        selectedCategory === "all" ||
        product.category === selectedCategory;

      const searchMatch =
        product.name
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        product.description
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

      return priceMatch && categoryMatch && searchMatch;
    });

    result.sort((a, b) => {
      const priceA =
        a.basePrice - (a.basePrice * a.discount) / 100;
      const priceB =
        b.basePrice - (b.basePrice * b.discount) / 100;

      switch (sortBy) {
        case "popularity":
          return b.rating - a.rating;
        case "price-low":
          return priceA - priceB;
        case "price-high":
          return priceB - priceA;
        case "rating":
          return b.rating - a.rating;
        default:
          return 0;
      }
    });

    return result;
  }, [priceRange, sortBy, selectedCategory, searchQuery]);

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
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg text-sm appearance-none focus:ring-2 focus:ring-neutral-900"
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
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg text-sm appearance-none focus:ring-2 focus:ring-neutral-900"
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

            {/* Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 lg:gap-10">
              {filteredAndSortedProducts.map((product) => (
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
          </div>
        </div>
      </div>
    </div>
  );
};