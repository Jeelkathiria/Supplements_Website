import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Dumbbell, ChevronDown } from "lucide-react";

import { ProductCard } from "../components/ProductCard";
import { CategoryCard } from "../components/CategoryCard";
import { fetchProducts } from "../../services/productService";
import { Product } from "../types";
import heroBg from "../../images/1001380690 (1).jpg";
import heroBg2 from "../../images/heroBg2.jpg";
import heroBg3 from "../../images/heroBg3.webp";


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
      <section className="relative h-[480px] md:h-[480px] sm:h-[320px] bg-gradient-to-r from-teal-800 to-teal-900 overflow-hidden w-full">
        {HERO_IMAGES.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-700 ${
              index === currentSlide
                ? "opacity-100"
                : "opacity-0"
            }`}
          >
            <img
              src={image}
              alt={`Slide ${index + 1}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/55" />
          </div>
        ))}

        {/* CENTER CONTENT */}
        <div className="absolute inset-0 flex items-center justify-center text-center px-4 md:px-6">
          <div className="max-w-[700px] text-white">
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-3 md:mb-5 leading-tight">
              Build Strength.
              <br />
              Fuel Performance.
            </h1>

            <p className="text-sm sm:text-base md:text-lg text-neutral-200 mb-4 md:mb-8">
              Premium supplements designed for muscle growth,
              endurance, and faster recovery.
            </p>

            <Link
              to="/products"
              className="inline-block bg-white text-teal-900 px-6 md:px-8 py-2 md:py-3 rounded-lg font-medium hover:bg-neutral-100 transition font-semibold text-sm md:text-base"
            >
              Shop Supplements
            </Link>
          </div>
        </div>

        {/* SLIDE INDICATORS */}
        <div className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {HERO_IMAGES.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? "bg-white w-8"
                  : "bg-white/50 w-3"
              }`}
            />
          ))}
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

          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
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

      {/* DISCOUNTS */}
      <section className="relative py-10 md:py-16 bg-gradient-to-br from-teal-900 to-neutral-900 w-full">
        <div className="absolute inset-0 bg-white/5 backdrop-blur-xl" />

        <div className="relative max-w-[1400px] mx-auto px-4 md:px-12 text-white">
          <div className="mb-8 md:mb-10">
            <h2 className="text-xl md:text-2xl font-bold mb-1 md:mb-2">
              Special Discounts
            </h2>
            <p className="text-xs md:text-sm text-white/80">
              Limited-time deals on premium supplements.
            </p>
          </div>

          {discountedProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-8">
              {discountedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  variant="discount"
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 md:py-16 text-center">
              <div className="mb-4 flex justify-center">
                <Dumbbell className="h-14 w-14 text-white" />
              </div>
              <h3 className="text-lg md:text-2xl font-bold mb-2">No Special Discounts Available</h3>
              <p className="text-sm md:text-base text-neutral-300 mb-6">
                Check back soon for amazing deals on premium supplements!
              </p>
              <Link
                to="/products"
                className="inline-block bg-white text-teal-900 px-5 md:px-7 py-2 md:py-3 rounded-lg hover:bg-neutral-100 font-semibold text-sm md:text-base"
              >
                Browse All Products
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};