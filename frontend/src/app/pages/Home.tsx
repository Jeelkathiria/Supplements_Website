import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Dumbbell, ChevronDown, ChevronLeft, ChevronRight, Grid } from "lucide-react";

import { ProductCard } from "../components/ProductCard";
import { CategoryCard } from "../components/CategoryCard";
import { fetchProducts } from "../../services/productService";
import { Product } from "../types";
import { getFullImageUrl } from "../utils/imageUtils";
import heroBg from "../../images/1001380690 (1).jpg";
import heroBg2 from "../../images/heroBg2.jpg";
import heroBg3 from "../../images/heroBg3.webp";

// Marquee brand logos
import logoMuscleTech from "../../images/marquee/MuscleTech.png";
import logoJNX from "../../images/marquee/JNX.png";
import logoNutrex from "../../images/marquee/Nutrex.png";
import logoBPI from "../../images/marquee/bpiSports.png";
import logoDymatize from "../../images/marquee/Dymatize.png";
import logoON from "../../images/marquee/Optimum_Nutrition.png";
import logoCellucor from "../../images/marquee/Cellucor.png";


const HERO_IMAGES = [
  heroBg,
  heroBg2,
  heroBg3,
];

export const Home: React.FC = () => {
  const location = useLocation();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [discountedProducts, setDiscountedProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [highlightDeals, setHighlightDeals] = useState(false);
  const [categoriesWithImages, setCategoriesWithImages] = useState<Array<{ id: string; name: string; image: string }>>([]);

  // Detect hash and scroll to deals section with highlight
  useEffect(() => {
    if (location.hash === '#deals-section') {
      const dealsSection = document.getElementById('deals-section');
      if (dealsSection) {
        setTimeout(() => {
          dealsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          setHighlightDeals(true);
          setTimeout(() => setHighlightDeals(false), 1000);
        }, 100);
      }
    }
  }, [location.hash]);

  // Function to load products
  const loadProducts = async () => {
    try {
      const products = await fetchProducts();

      // Filter featured products
      const featured = products.filter(
        (p) => p.isFeatured === true,
      );
      setFeaturedProducts(featured);

      // Filter special discount products
      const discounted = products.filter(
        (p) => p.isSpecialOffer === true || (p.discountPercent || 0) >= 15,
      );
      setDiscountedProducts(discounted);

      // Save all products for category extraction
      setAllProducts(products);
    } catch (error) {
      console.error("Failed to load products:", error);
    }
  };

  // Fetch and filter products on mount
  useEffect(() => {
    loadProducts();
  }, []);

  // Refetch products every 5 seconds to show updates from Admin panel
  useEffect(() => {
    const interval = setInterval(() => {
      loadProducts();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide(
        (prev) => (prev + 1) % HERO_IMAGES.length,
      );
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  // Process products to extract unique categories with their first product image
  useEffect(() => {
    try {
      const productsForCategories = allProducts.length > 0 ? allProducts : [...featuredProducts, ...discountedProducts];
      const categoryMap = new Map<string, { id: string; name: string; image: string }>();

      productsForCategories.forEach((product) => {
        const categoryName = product.categoryName || 'Uncategorized';
        const categoryId = product.categoryId || categoryName;

        // Add category only if not already added (ensures unique categories)
        if (!categoryMap.has(categoryName) && product.imageUrls && product.imageUrls.length > 0) {
          const fullImagePath = getFullImageUrl(product.imageUrls[0]);

          categoryMap.set(categoryName, {
            id: categoryId,
            name: categoryName,
            image: fullImagePath, // Use backend HTTP URL
          });
        }
      });

      // Convert map to array and set state
      const categories = Array.from(categoryMap.values()).map((data) => ({
        id: data.id,
        name: data.name,
        image: data.image,
      }));

      setCategoriesWithImages(categories);
    } catch (error) {
      console.error("Failed to process categories:", error);
    }
  }, [featuredProducts, discountedProducts, allProducts]);

  return (
    <div className="min-h-screen bg-neutral-50 w-full">
      {/* MOBILE HERO SECTION */}
      <section className="relative h-[380px] sm:h-[400px] md:h-[480px] bg-gradient-to-r from-teal-800 to-teal-900 overflow-hidden w-full">
        {HERO_IMAGES.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-700 ${index === currentSlide
              ? "opacity-100"
              : "opacity-0"
              }`}
          >
            <img
              src={image}
              alt={`Slide ${index + 1}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40 sm:bg-black/60" />
          </div>
        ))}

        {/* MOBILE HERO TEXT - LEFT ALIGNED */}
        <div className="absolute inset-0 flex items-center sm:justify-center text-left sm:text-center px-4 md:px-6 sm:hidden">
          <div className="max-w-[300px] text-white">
            <h1 className="text-4xl font-black mb-4 leading-tight tracking-tight">
              Don't just train.
              <br />
              <span className="text-yellow-400">Transform.</span>
            </h1>
            <p className="text-xs text-neutral-200 mb-6">
              Mobilise fat, maximise strength, do both right.
            </p>
          </div>
        </div>

        {/* DESKTOP CENTER CONTENT */}
        <div className="hidden sm:flex absolute inset-0 items-center justify-center text-center px-4 md:px-6">
          <div className="max-w-[700px] text-white">
            <h1 className="text-3xl sm:text-3xl md:text-5xl font-bold mb-3 md:mb-5 leading-tight tracking-tight">
              Build Strength.
              <br />
              Fuel Performance.
            </h1>

            <p className="text-sm sm:text-base md:text-lg text-neutral-200 mb-6 md:mb-8 max-w-[280px] sm:max-w-none mx-auto">
              Premium supplements designed for muscle growth,
              endurance, and faster recovery.
            </p>

            <Link
              to="/products"
              className="inline-block bg-white text-teal-900 px-7 md:px-8 py-3 md:py-3 rounded-xl font-bold hover:bg-neutral-100 transition shadow-lg shadow-black/20 text-sm md:text-base"
            >
              Shop Supplements
            </Link>
          </div>
        </div>

        {/* NAVIGATION ARROWS (Phone and SM Only) */}
        <button
          onClick={() => setCurrentSlide((prev) => (prev - 1 + HERO_IMAGES.length) % HERO_IMAGES.length)}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-black/20 backdrop-blur-sm p-2 rounded-full text-white active:scale-90 transition-transform md:hidden"
          aria-label="Previous slide"
        >
          <ChevronLeft size={24} />
        </button>
        <button
          onClick={() => setCurrentSlide((prev) => (prev + 1) % HERO_IMAGES.length)}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-black/20 backdrop-blur-sm p-2 rounded-full text-white active:scale-90 transition-transform md:hidden"
          aria-label="Next slide"
        >
          <ChevronRight size={24} />
        </button>

        {/* SLIDE INDICATORS (Tablet & Laptop Only) */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden sm:flex gap-3 z-10">
          {HERO_IMAGES.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`block p-0 leading-none transition-all duration-300
                ${index === currentSlide
                  ? "bg-white sm:w-12 sm:h-[2px] sm:rounded-none"
                  : "bg-white/40 sm:w-6 sm:h-[2px] sm:rounded-none"
                }
              `}
            />
          ))}
        </div>
      </section>

      {/* MOBILE CATEGORY BUTTONS - HORIZONTAL SCROLL */}
      <section className="py-6 bg-neutral-50 w-full sm:hidden">
        <div className="grid grid-cols-4 gap-4 px-4">
          {/* First Circle - Categories */}
          <Link
            to="/categories"
            className="flex flex-col items-center gap-2 group"
          >
            <div className="w-16 h-16 rounded-full bg-yellow-500 flex items-center justify-center group-hover:bg-yellow-600 transition border-2 border-yellow-600">
              <Grid className="w-8 h-8 text-white" />
            </div>
            <span className="text-[10px] font-medium text-neutral-700 text-center">More</span>
          </Link>

          {/* Dynamic Categories */}
          {categoriesWithImages.slice(0, 7).map((category) => (
            <Link
              key={category.id}
              to={`/products?category=${category.name.toLowerCase().replace(/\s+/g, '-')}`}
              className="flex flex-col items-center gap-2 group"
            >
              <div className="w-16 h-16 rounded-full bg-gray-200 group-hover:opacity-90 transition overflow-hidden border-2 border-gray-300">
                <img
                  src={category.image}
                  alt={category.name}
                  loading="lazy"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    target.style.backgroundColor = "#e5e7eb";
                  }}
                />
              </div>
              <span className="text-[10px] font-medium text-neutral-700 text-center line-clamp-1">{category.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* BRAND MARQUEE STRIP */}
      <section className="hidden sm:block bg-neutral-950 border-y border-neutral-800 py-4 overflow-hidden w-full">
        <div className="flex items-center gap-4 mb-0">
          <style>{`
            @keyframes marquee {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
            .brand-marquee {
              display: flex;
              width: max-content;
              animation: marquee 22s linear infinite;
            }
            .brand-marquee:hover {
              animation-play-state: paused;
            }
            .no-scrollbar::-webkit-scrollbar {
              display: none;
            }
            .no-scrollbar {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
          `}</style>
        </div>
        <div className="relative overflow-hidden">
          {/* Fade edges */}
          <div className="absolute left-0 top-0 h-full w-24 z-10 pointer-events-none" style={{ background: 'linear-gradient(to right, #0a0a0a, transparent)' }} />
          <div className="absolute right-0 top-0 h-full w-24 z-10 pointer-events-none" style={{ background: 'linear-gradient(to left, #0a0a0a, transparent)' }} />

          <div className="brand-marquee">
            {/* First set */}
            {[
              { name: "MuscleTech", logo: logoMuscleTech, fallback: "MT", color: "#e63946" },
              { name: "JNX Sports", logo: logoJNX, fallback: "JNX", color: "#ffffff" },
              { name: "Nutrex Research", logo: logoNutrex, fallback: "NUTREX", color: "#f5a623" },
              { name: "BPI Sports", logo: logoBPI, fallback: "BPI", color: "#00b4d8" },
              { name: "Dymatize", logo: logoDymatize, fallback: "DYMATIZE", color: "#2dc7c7" },
              { name: "Optimum Nutrition", logo: logoON, fallback: "ON", color: "#1d8348" },
              { name: "Cellucor", logo: logoCellucor, fallback: "C4", color: "#e67e22" },
              // duplicate set for seamless loop
              { name: "MuscleTech", logo: logoMuscleTech, fallback: "MT", color: "#e63946" },
              { name: "JNX Sports", logo: logoJNX, fallback: "JNX", color: "#ffffff" },
              { name: "Nutrex Research", logo: logoNutrex, fallback: "NUTREX", color: "#f5a623" },
              { name: "BPI Sports", logo: logoBPI, fallback: "BPI", color: "#00b4d8" },
              { name: "Dymatize", logo: logoDymatize, fallback: "DYMATIZE", color: "#2dc7c7" },
              { name: "Optimum Nutrition", logo: logoON, fallback: "ON", color: "#1d8348" },
              { name: "Cellucor", logo: logoCellucor, fallback: "C4", color: "#e67e22" },
            ].map((brand, i) => (
              <div
                key={i}
                className="flex items-center justify-center px-10 md:px-15 border-r border-neutral-800 last:border-r-0 group cursor-default"
                style={{ minWidth: "180px" }}
              >
                <img
                  src={brand.logo}
                  alt={brand.name}
                  className="h-10 md:h-12 object-contain opacity-70 group-hover:opacity-100 transition-opacity duration-300"
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    target.style.display = "none";
                    const next = target.nextElementSibling as HTMLElement | null;
                    if (next) next.style.display = "block";
                  }}
                />
                <span
                  className="text-sm font-bold tracking-widest uppercase"
                  style={{ color: brand.color, display: "none" }}
                >
                  {brand.fallback}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORIES - DESKTOP ONLY */}
      <section className="hidden sm:block py-8 md:py-14 bg-neutral-50 w-full">
        <div className="max-w-[1400px] mx-auto px-4 md:px-12">
          <div className="mb-6 md:mb-8">
            <h2 className="text-xl md:text-4xl font-bold mb-1 md:mb-2 pl-4 border-l-4 border-yellow-500">
              Shop by Category
            </h2>
            <p className="text-xs md:text-sm text-neutral-600">
              Find supplements based on your fitness goals.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
            {/* Explore Categories Card */}
            <Link
              to="/categories"
              className="relative h-72 rounded-2xl bg-gradient-to-br from-teal-600 to-teal-800 p-8 flex flex-col justify-between group overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300"
            >
              <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-500" />

              <div className="bg-white/20 w-14 h-14 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/30 group-hover:scale-110 transition-transform">
                <Grid className="text-white w-7 h-7" />
              </div>

              <div className="space-y-4">
                <h3 className="text-xl md:text-2xl font-black text-white leading-tight uppercase italic tracking-tighter">
                  Explore <span className="text-teal-300">All</span> <br /> Categories
                </h3>
                <div className="flex items-center gap-2 text-white/80 text-sm font-bold group-hover:text-white transition-colors">
                  View full catalog
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>

            {categoriesWithImages.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED PRODUCTS / POPULAR SECTION */}
      <section className="py-8 md:py-14 bg-yellow-50 w-full">
        <div className="max-w-[1400px] mx-auto px-2 md:px-12">
          {/* Section Header */}
          <div className="mb-6 md:mb-8">
            <h2 className="text-xl md:text-4xl font-bold mb-1 md:mb-2 pl-4 border-l-4 border-yellow-500">
              Featured Products
            </h2>
            <p className="text-xs md:text-sm text-neutral-600">
              Best-selling supplements trusted by customers.
            </p>
          </div>

          <div className="ml-3 flex overflow-x-auto no-scrollbar snap-x snap-mandatory gap-4 md:gap-5 pb-4 -mx-4 px-4 md:mx-0 md:px-0">
            {featuredProducts.map((product) => (
              <div
                key={product.id}
                className="snap-start flex-shrink-0 w-[240px] xs:w-[280px] sm:w-[320px] md:w-[310px]"
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>

          <div className="mt-8 md:mt-10 flex justify-center">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 bg-neutral-200 text-neutral-800 px-5 md:px-7 py-2 md:py-3 rounded-lg hover:bg-neutral-300 font-semibold transition text-sm md:text-base"
            >
              View All Products
              <ChevronDown className="animate-bounce" size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* MOBILE DISCOUNT DEALS SECTION - PHONE ONLY */}
      <section id="mobile-deals-section" className="block md:hidden py-10 bg-neutral-950 relative overflow-hidden">
        {/* Subtle Background Mesh/Gradient for premium feel */}
        <div className="absolute inset-0 z-0 opacity-30">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,#134e4a_0%,transparent_50%)]" />
        </div>

        <div className="relative z-10 px-4">
          <div className="mb-6 space-y-2">
            <div className="inline-flex items-center gap-2 bg-teal-500/10 text-teal-400 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border border-teal-500/20">
              <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse" />
              Live Savings
            </div>
            <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">
              Ironclad <span className="text-teal-500 not-italic">Savings</span>
            </h2>
            <p className="text-neutral-400 text-xs font-medium leading-relaxed max-w-[260px]">
              Elite performance fuel at low-maintenance prices. Dominate your next session.
            </p>
          </div>

          {discountedProducts.length > 0 ? (
            <div className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory gap-4 pb-4 -mx-4 px-4 ml-1">
              {discountedProducts.map((product) => (
                <div key={product.id} className="snap-start flex-shrink-0 w-[260px]">
                  <ProductCard product={product} variant="discount" />
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white/5 border border-white/10 rounded-2xl py-12 text-center">
              <h3 className="text-white font-bold">Refreshing Deals</h3>
              <p className="text-neutral-500 text-xs px-10 mt-1">New savings are coming soon. Check back shortly!</p>
            </div>
          )}

          <div className="mt-4">
            <Link
              to="/products"
              className="flex items-center justify-center gap-2 w-full bg-teal-700 text-white py-3 rounded-xl font-bold text-xs"
            >
              View All Discounts
              <ChevronDown className="-rotate-90" size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* DISCOUNT DEALS SECTION - DESKTOP ONLY */}
      <section id="deals-section" className={`hidden md:block relative py-16 md:py-28 overflow-hidden transition-all duration-1000 ${highlightDeals ? 'ring-2 ring-teal-400 ring-opacity-75' : ''}`}>
        {/* Professional Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop"
            alt="Gym Background"
            className="w-full h-full object-cover grayscale opacity-40 brightness-50"
          />
          <div className="absolute inset-0 bg-neutral-950/90 backdrop-blur-[1px]" />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-neutral-950/50" />
        </div>

        <div className="relative z-10 max-w-[1400px] mx-auto px-4 md:px-12">

          {/* Section Header */}
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-12 gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 bg-teal-500/10 text-teal-400 px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-[0.2em] border border-teal-500/20">
                <span className="w-2 h-2 bg-teal-500 rounded-full animate-pulse" />
                Live deals active
              </div>
              <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase italic">
                Ironclad <span className="text-teal-500 not-italic">Savings</span>
              </h2>
              <p className="text-neutral-400 text-sm md:text-lg max-w-xl font-medium leading-relaxed">
                Elite performance fuel at low-maintenance prices. Stock up and dominate your next session.
              </p>
            </div>

            <Link
              to="/products"
              className="flex items-center gap-2 bg-teal-700 text-white px-8 py-4 rounded-2xl font-bold text-sm hover:bg-teal-600 transition-all shadow-2xl shadow-teal-900/40 group active:scale-95"
            >
              Shop All Deals
              <ChevronDown className="-rotate-90 group-hover:translate-x-1 transition-transform" size={18} />
            </Link>
          </div>

          {discountedProducts.length > 0 ? (
            <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
              {discountedProducts.slice(0, 4).map((product) => (
                <div key={product.id} className="group relative min-w-[260px] sm:min-w-0 snap-start">
                  <ProductCard
                    product={product}
                    variant="discount"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-[2.5rem] py-24 text-center">
              <div className="mb-6 flex justify-center">
                <div className="p-6 bg-white/5 rounded-full border border-white/10">
                  <Dumbbell className="h-12 w-12 text-white/20" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Refreshing The Stock</h3>
              <p className="text-neutral-400 text-sm max-w-xs mx-auto font-medium">
                We're currently preparing the next wave of elite savings. Check back shortly.
              </p>
            </div>
          )}

          {/* Glassmorphism Trust Banner */}
          
        </div>
      </section>
    </div>
  );
};