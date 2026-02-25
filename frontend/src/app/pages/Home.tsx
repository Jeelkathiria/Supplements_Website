import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Dumbbell, ChevronDown, CheckCircle2, Zap, Users, ChevronLeft, ChevronRight } from "lucide-react";

import { ProductCard } from "../components/ProductCard";
import { CategoryCard } from "../components/CategoryCard";
import { fetchProducts } from "../../services/productService";
import { Product } from "../types";
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
  const [currentSlide, setCurrentSlide] = useState(0);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [discountedProducts, setDiscountedProducts] = useState<Product[]>([]);

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

  return (
    <div className="min-h-screen bg-neutral-50 w-full">
      {/* HERO */}
      <section className="relative h-[500px] sm:h-[400px] md:h-[480px] bg-gradient-to-r from-teal-800 to-teal-900 overflow-hidden w-full">
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
            <div className="absolute inset-0 bg-black/60" />
          </div>
        ))}

        {/* CENTER CONTENT */}
        <div className="absolute inset-0 flex items-center justify-center text-center px-4 md:px-6">
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

        {/* NAVIGATION ARROWS (Phone Only) */}
        <button
          onClick={() => setCurrentSlide((prev) => (prev - 1 + HERO_IMAGES.length) % HERO_IMAGES.length)}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-black/20 backdrop-blur-sm p-2 rounded-full text-white active:scale-90 transition-transform sm:hidden"
          aria-label="Previous slide"
        >
          <ChevronLeft size={24} />
        </button>
        <button
          onClick={() => setCurrentSlide((prev) => (prev + 1) % HERO_IMAGES.length)}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-black/20 backdrop-blur-sm p-2 rounded-full text-white active:scale-90 transition-transform sm:hidden"
          aria-label="Next slide"
        >
          <ChevronRight size={24} />
        </button>

        {/* SLIDE INDICATORS (Laptop Only) */}
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

      {/* BRAND MARQUEE STRIP */}
      <section className="bg-neutral-950 border-y border-neutral-800 py-4 overflow-hidden w-full">
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

      {/* CATEGORIES */}
      <section className="py-8 md:py-14 bg-neutral-50 w-full">
        <div className="max-w-[1400px] mx-auto px-4 md:px-12">
          <div className="mb-6 md:mb-8">
            <h2 className="text-xl md:text-2xl font-bold mb-1 md:mb-2">
              Shop by Category
            </h2>
            <p className="text-xs md:text-sm text-neutral-600">
              Find supplements based on your fitness goals.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
            {[
              {
                name: "Protein",
                image:
                  "https://plus.unsplash.com/premium_photo-1726842348600-c66c2e2797b4?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
              },
              {
                name: "Mass Gainer",
                image:
                  "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b",
              },
              {
                name: "Fish Oil",
                image:
                  "https://www.cnet.com/a/img/resize/f6178d76d3336133439b50dda02ad15969ac29cd/hub/2023/01/30/aff431f9-9980-476f-aa59-2b29fe5b46e6/gettyimages-1311464336.jpg?auto=webp&width=1200",
              },
              {
                name: "Pre Workout",
                image:
                  "https://images.unsplash.com/photo-1605296867304-46d5465a13f1",
              },
            ].map((category, i) => (
              <CategoryCard key={i} category={category} />
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section className="py-8 md:py-14 bg-white w-full">
        <div className="max-w-[1400px] mx-auto px-4 md:px-12">
          <div className="mb-6 md:mb-8">
            <h2 className="text-xl md:text-2xl font-bold mb-1 md:mb-2">
              Featured Products
            </h2>
            <p className="text-xs md:text-sm text-neutral-600">
              Best-selling supplements trusted by customers.
            </p>
          </div>

          <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
            {featuredProducts.map((product) => (
              <div key={product.id} className="min-w-[260px] sm:min-w-0 snap-start">
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

      {/* DISCOUNT DEALS SECTION */}
      <section className="relative py-16 md:py-28 overflow-hidden">
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
            <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
              {discountedProducts.slice(0, 4).map((product) => (
                <div key={product.id} className="group relative min-w-[260px] sm:min-w-0 snap-start">
                  <div className="absolute -top-3 -right-3 z-20 bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-xl">
                    HOT
                  </div>
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
          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t border-white/10">
            <div className="flex items-center gap-5 p-4 rounded-2xl transition-colors hover:bg-white/5 cursor-default">
              <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
                <CheckCircle2 className="text-teal-500 w-7 h-7" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm tracking-wide">100% AUTHENTIC</h4>
                <p className="text-xs text-neutral-400 font-medium">Direct From Source</p>
              </div>
            </div>
            <div className="flex items-center gap-5 p-4 rounded-2xl transition-colors hover:bg-white/5 cursor-default">
              <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
                <Zap className="text-teal-500 w-7 h-7" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm tracking-wide">FLASH DELIVERY</h4>
                <p className="text-xs text-neutral-400 font-medium">Doorstep In 48 Hours</p>
              </div>
            </div>
            <div className="flex items-center gap-5 p-4 rounded-2xl transition-colors hover:bg-white/5 cursor-default">
              <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
                <Users className="text-teal-500 w-7 h-7" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm tracking-wide">ELITE COACHING</h4>
                <p className="text-xs text-neutral-400 font-medium">Free Nutrition Advice</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};