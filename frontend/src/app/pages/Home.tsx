import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { ProductCard } from "../components/ProductCard";
import { CategoryCard } from "../components/CategoryCard";
import { PRODUCTS } from "../data/products";

const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1693996046865-19217d179161?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  "https://images.unsplash.com/photo-1709976142774-ce1ef41a8378?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  "https://images.unsplash.com/photo-1701859082181-663004d346d2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
];

export const Home: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const featuredProducts = PRODUCTS.slice(0, 15);
  const discountedProducts = PRODUCTS.filter(
    (p) => p.discount >= 15,
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide(
        (prev) => (prev + 1) % HERO_IMAGES.length,
      );
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* HERO */}
      {/* HERO */}
      <section className="relative h-[480px] bg-neutral-900 overflow-hidden">
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
        <div className="absolute inset-0 flex items-center justify-center text-center px-6">
          <div className="max-w-[700px] text-white">
            <h1 className="text-4xl md:text-5xl font-bold mb-5 leading-tight">
              Build Strength.
              <br />
              Fuel Performance.
            </h1>

            <p className="text-base md:text-lg text-neutral-200 mb-8">
              Premium supplements designed for muscle growth,
              endurance, and faster recovery.
            </p>

            <Link
              to="/products"
              className="inline-block bg-white text-neutral-900 px-8 py-3 rounded-lg font-medium hover:bg-neutral-100 transition"
            >
              Shop Supplements
            </Link>
          </div>
        </div>

        {/* SLIDE INDICATORS */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
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
      <section className="py-14 bg-neutral-50">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12">
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2">
              Shop by Category
            </h2>
            <p className="text-sm text-neutral-600">
              Find supplements based on your fitness goals.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                name: "Whey Protein",
                image:
                  "https://plus.unsplash.com/premium_photo-1726842348600-c66c2e2797b4?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
              },
              {
                name: "Muscle Builder",
                image:
                  "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b",
              },
              {
                name: "Fat Burner",
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
      <section className="py-14 bg-white">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12">
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2">
              Featured Products
            </h2>
            <p className="text-sm text-neutral-600">
              Best-selling supplements trusted by customers.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          <div className="mt-10">
            <Link
              to="/products"
              className="inline-block bg-neutral-900 text-white px-7 py-3 rounded-lg hover:bg-neutral-800"
            >
              View All Products
            </Link>
          </div>
        </div>
      </section>

      {/* DISCOUNTS */}
      <section className="relative py-16 bg-neutral-900">
        <div className="absolute inset-0 bg-white/10 backdrop-blur-xl" />

        <div className="relative max-w-[1400px] mx-auto px-6 md:px-12 text-white">
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-2">
              Special Discounts
            </h2>
            <p className="text-sm text-white/80">
              Limited-time deals on premium supplements.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-8">
            {discountedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                variant="discount"
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};