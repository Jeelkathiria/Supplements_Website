import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {

  Truck,
  Shield,
  Heart,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
} from "lucide-react";
import { useCart } from "../components/context/CartContext";
import { useFavorites } from "../components/context/FavoritesContext";
import { toast } from "sonner";
import { Breadcrumb } from "../components/Breadcrumb";
import { fetchProducts } from "../../services/productService";
import { getProductPricing } from "../utils/pricingUtils";
import { getFullImageUrl } from "../utils/imageUtils";
import { Product } from "../types";

export const ProductDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { favorites, addFavorite, removeFavorite } = useFavorites();

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPriceLoading, setIsPriceLoading] = useState(false);
  const imageRef = useRef<HTMLDivElement | null>(null);

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedFlavor, setSelectedFlavor] = useState("");
  const [selectedWeight, setSelectedWeight] = useState("");
  const [quantity, setQuantity] = useState(1);

  const [isHovering, setIsHovering] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });

  // Fetch product
  useEffect(() => {
    const loadProduct = async () => {
      try {
        setIsLoading(true);
        const products = await fetchProducts();
        const found = products.find((p) => p.id === id);
        if (found) {
          setProduct(found);
        } else {
          setProduct(null);
        }
      } catch (error) {
        console.error("Error loading product:", error);
        setProduct(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadProduct();
  }, [id]);

  // Auto-select first size and flavor when product loads
  useEffect(() => {
    if (product) {
      const sizes = getSizesFromVariants();
      const flavors = getFlavorsFromVariants();
      
      if (sizes.length > 0 && !selectedSize) {
        setSelectedSize(sizes[0]);
      }
      
      if (flavors.length > 0 && !selectedFlavor) {
        setSelectedFlavor(flavors[0]);
      }
    }
  }, [product]);

  // Check if product is favorited whenever favorites change
  const isProductFavorited = product ? favorites.some(fav => fav.id === product.id) : false;

  // Build productSizes structure from productVariants
  const getProductSizesFromVariants = (): Array<{ size: string; flavors: Array<{ name: string; price: number }> }> => {
    if (!product?.productVariants || product.productVariants.length === 0) {
      return [];
    }

    // Group variants by size and collect flavors
    const sizeMap = new Map<string, Array<{ name: string; price: number }>>();
    
    product.productVariants.forEach((variant) => {
      if (!sizeMap.has(variant.size)) {
        sizeMap.set(variant.size, []);
      }
      sizeMap.get(variant.size)!.push({
        name: variant.flavor,
        price: variant.finalPrice || variant.price,
      });
    });

    // Convert to productSizes structure
    return Array.from(sizeMap.entries()).map(([size, flavors]) => ({
      size,
      flavors,
    }));
  };

  const productSizes = getProductSizesFromVariants();

  // Helper: Get all unique sizes from productSizes
  const getSizesFromVariants = (): string[] => {
    return productSizes.map((s) => s.size);
  };

  // Helper: Get all unique flavors from productSizes
  const getFlavorsFromVariants = (): string[] => {
    const flavors = new Set<string>();
    productSizes.forEach((size) => {
      size.flavors.forEach((flavor) => {
        flavors.add(flavor.name);
      });
    });
    return Array.from(flavors);
  };

  // Helper: Get flavors available for a specific size
  const getFlavorsForSize = (sizeName: string): string[] => {
    const size = productSizes.find((s) => s.size === sizeName);
    if (!size) {
      return [];
    }
    return size.flavors.map((f) => f.name);
  };

  // Get minimum price from all productVariants
  const getMinimumPriceFromSizes = (): number => {
    if (!product?.productVariants || product.productVariants.length === 0) {
      return Infinity;
    }

    let minPrice = Infinity;
    product.productVariants.forEach((variant) => {
      const price = variant.finalPrice || variant.price;
      if (price < minPrice) {
        minPrice = price;
      }
    });

    return minPrice === Infinity ? Infinity : minPrice;
  };

  // Get minimum price for a specific size
  const getMinimumPriceForSize = (sizeName: string): number => {
    if (!product?.productVariants || product.productVariants.length === 0) {
      return Infinity;
    }

    const sizeVariants = product.productVariants.filter((v) => v.size === sizeName);
    if (sizeVariants.length === 0) {
      return Infinity;
    }

    return Math.min(...sizeVariants.map((v) => v.finalPrice || v.price));
  };

  // Get price for a specific size AND flavor combination
  const getPriceForSizeAndFlavor = (sizeName: string, flavorName: string): number => {
    if (!product?.productVariants || product.productVariants.length === 0) {
      return Infinity;
    }

    const variant = product.productVariants.find(
      (v) => v.size === sizeName && v.flavor === flavorName
    );

    if (!variant) {
      return Infinity;
    }

    return variant.finalPrice || variant.price;
  };

  // Get price from variant or default, showing lowest price from productVariants
  const getDisplayPrice = (): number => {
    // If we have productVariants, use specific price logic
    if (product?.productVariants && product.productVariants.length > 0) {
      // If both size and flavor are selected, show exact variant price
      if (selectedSize && selectedFlavor) {
        const exactPrice = getPriceForSizeAndFlavor(selectedSize, selectedFlavor);
        if (exactPrice !== Infinity) {
          return exactPrice;
        }
      }

      // If only size is selected, show lowest price for that size
      if (selectedSize) {
        const sizeMinPrice = getMinimumPriceForSize(selectedSize);
        if (sizeMinPrice !== Infinity) {
          return sizeMinPrice;
        }
      }

      // Show absolute minimum price across all variants
      const allMinPrice = getMinimumPriceFromSizes();
      if (allMinPrice !== Infinity) {
        return allMinPrice;
      }
    }

    // Fallback to old pricing system
    const pricing = getProductPricing(product || {} as Product);
    return pricing.finalPrice;
  };

  // Get discount percentage and base price for selected size and flavor
  const getDiscountForSelectedSize = (): { discount: number; basePrice: number } => {
    if (!product?.productVariants || product.productVariants.length === 0) {
      return { discount: 0, basePrice: 0 };
    }

    // Get variant for selected size and flavor
    let variant = null;
    
    if (selectedSize && selectedFlavor) {
      // If both are selected, get exact variant
      variant = product.productVariants.find((v) => v.size === selectedSize && v.flavor === selectedFlavor);
    } else if (selectedSize) {
      // If only size is selected, get first variant of that size
      variant = product.productVariants.find((v) => v.size === selectedSize);
    } else {
      // Fallback to first variant
      variant = product.productVariants[0];
    }

    if (!variant) {
      return { discount: 0, basePrice: 0 };
    }

    // Discount is stored as a percentage for size-level discounts
    const discountPercent = variant.discountType === "percent" ? variant.discount : 0;
    
    return {
      discount: discountPercent,
      basePrice: variant.price,
    };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-neutral-600">Loading product...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-4">
            Product Not Found
          </h2>
          <button
            onClick={() => navigate("/products")}
            className="text-neutral-600 underline"
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }



  // Get images array
  const images = product.imageUrls || product.images || [];

  const pricing = getProductPricing(product);
  const finalPrice = getDisplayPrice();
  const sizeDiscount = getDiscountForSelectedSize();
  const discountPercent = selectedSize ? sizeDiscount.discount : pricing.discountPercent;
  const basePrice = selectedSize ? sizeDiscount.basePrice : pricing.basePrice;

  const handleMouseMove = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
  ) => {
    if (!imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    let x = ((e.clientX - rect.left) / rect.width) * 100;
    let y = ((e.clientY - rect.top) / rect.height) * 100;

    setZoomPos({
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    });
  };

  const handleAddToCart = () => {
    if (product.isOutOfStock) {
      toast.error('This product is out of stock');
      return;
    }

    // Require size selection if variants exist
    const sizes = getSizesFromVariants();
    if (sizes.length > 0 && !selectedSize) {
      toast.error('Please select a size');
      return;
    }

    // For backward compatibility: use selectedSize and selectedFlavor from variant selector
    addToCart(product, quantity, selectedSize, selectedFlavor, undefined);
    toast.success(
      `${quantity} × ${product.name} added to cart`,
    );
  };

  const handleBuyNow = () => {
    if (product.isOutOfStock) {
      toast.error('This product is out of stock');
      return;
    }

    // Require size selection if variants exist
    const sizes = getSizesFromVariants();
    if (sizes.length > 0 && !selectedSize) {
      toast.error('Please select a size');
      return;
    }

    // Add to cart with selected variant data
    addToCart(product, quantity, selectedSize, selectedFlavor, undefined);

    // Success toast
    toast.success(`${quantity} × ${product.name} added to cart`);

    // Navigate to cart page
    navigate("/cart");
  };

  const handleToggleFavorite = async () => {
    if (isProductFavorited) {
      await removeFavorite(product!.id);
    } else {
      await addFavorite(product!.id);
    }
  };

  // Handle size change with price loading animation
  const handleSizeChange = (size: string) => {
    setSelectedSize(size);
    // Auto-select first flavor for this size
    const flavorsForSize = getFlavorsForSize(size);
    if (flavorsForSize.length > 0) {
      setSelectedFlavor(flavorsForSize[0]);
    }
    setIsPriceLoading(true);
    // Simulate price update delay (1-2 seconds)
    setTimeout(() => {
      setIsPriceLoading(false);
    }, 1200);
  };

  // Handle flavor change with price loading animation
  const handleFlavorChange = (flavor: string) => {
    setSelectedFlavor(flavor);
    setIsPriceLoading(true);
    // Simulate price update delay (1-2 seconds)
    setTimeout(() => {
      setIsPriceLoading(false);
    }, 1200);
  };


  return (
    <div className="bg-white pb-24 md:pb-0">
      {/* LAPTOP VIEW - UNTOUCHED */}
      <div className="hidden md:block">
        <div className="max-w-[1400px] mx-auto px-4 md:px-12 py-10">
          <Breadcrumb
            items={[
              { label: "Home", path: "/" },
              { label: "Products", path: "/products" },
              { label: product.name },
            ]}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mt-6">
            {/* IMAGE */}
            <div className="flex gap-4">
              {/* Left Sidebar - Vertical Thumbnails */}
              {images.length > 1 && (
                <div className="flex flex-col gap-2 overflow-y-auto" style={{ maxHeight: '600px', scrollbarWidth: 'thin' }}>
                  {images.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`flex-shrink-0 w-20 h-20 border-2 rounded-lg overflow-hidden transition ${selectedImage === index
                        ? "border-neutral-900"
                        : "border-neutral-300 hover:border-neutral-400"
                        }`}
                    >
                      <img
                        src={getFullImageUrl(img)}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Main Image - Right Side */}
              <div className="flex-1">
                <div
                  ref={imageRef}
                  className="relative bg-neutral-100 rounded-xl overflow-hidden group"
                  onMouseEnter={() => setIsHovering(true)}
                  onMouseLeave={() => setIsHovering(false)}
                  onMouseMove={handleMouseMove}
                >
                  <img
                    src={getFullImageUrl((product.imageUrls || product.images)?.[selectedImage] || '')}
                    alt={product.name}
                    className="w-full aspect-square object-cover"
                  />

                  {isHovering && (
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        backgroundImage: `url(${getFullImageUrl((product.imageUrls || product.images)?.[selectedImage] || '')})`,
                        backgroundRepeat: "no-repeat",
                        backgroundSize: "220%",
                        backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
                      }}
                    />
                  )}

                  {/* Heart Icon - Top Right */}
                  <button
                    onClick={handleToggleFavorite}
                    className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-md hover:shadow-lg transition z-10"
                  >
                    <Heart
                      className={`w-6 h-6 transition ${isProductFavorited
                        ? 'fill-red-500 text-red-500'
                        : 'text-gray-600 hover:text-red-500'
                        }`}
                    />
                  </button>

                  {/* Left Navigation Arrow */}
                  {selectedImage > 0 && (
                    <button
                      onClick={() => setSelectedImage(selectedImage - 1)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow-md hover:shadow-lg z-10 opacity-0 group-hover:opacity-100 transition"
                    >
                      <ChevronLeft className="w-5 h-5 text-neutral-700" />
                    </button>
                  )}

                  {/* Right Navigation Arrow */}
                  {selectedImage < images.length - 1 && (
                    <button
                      onClick={() => setSelectedImage(selectedImage + 1)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow-md hover:shadow-lg z-10 opacity-0 group-hover:opacity-100 transition"
                    >
                      <ChevronRight className="w-5 h-5 text-neutral-700" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* INFO */}
            <div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-neutral-500">
                  {product.categoryName || (typeof product.category === 'object' ? product.category?.name : product.category) || "Uncategorized"}
                </p>
                {product.isVegetarian ? (
                  <div className="w-10 h-10 border-2 border-green-600 rounded-sm flex items-center justify-center bg-white">
                    <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                  </div>
                ) : (
                  <div className="w-10 h-10 border-2 border-red-600 rounded-sm flex items-center justify-center bg-white">
                    <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                  </div>
                )}
              </div>
              <h1 className="text-2xl font-bold mt-1">
                {product.name}
              </h1>

              <div className="mt-5 border-b pb-5">
                <div className="space-y-1">

                  {/* Price + Discount */}
                  <div className="flex items-center gap-3">
                    <span className="text-4xl font-bold">
                      {isPriceLoading ? (
                        <span className="inline-flex items-center gap-1">
                          <span className="text-2xl text-neutral-400">Loading</span>
                          <span className="text-2xl text-neutral-400 animate-pulse">
                            <span className="inline-block mx-0.5">.</span>
                            <span className="inline-block mx-0.5">.</span>
                            <span className="inline-block mx-0.5">.</span>
                          </span>
                        </span>
                      ) : (
                        `₹${finalPrice.toFixed(0)}`
                      )}
                    </span>

                    {discountPercent > 0 && !isPriceLoading && (
                      <div className="flex flex-col gap-1">
                        {basePrice > finalPrice && (
                          <span className="text-sm line-through text-neutral-500">
                            ₹{basePrice.toFixed(0)}
                          </span>
                        )}
                        <span className="text-red-600 font-semibold text-lg">
                          {discountPercent}% OFF
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Dynamic Price Info */}
                  {selectedSize && (
                    <div className="text-sm text-blue-600 font-medium">
                      Price for selected {selectedFlavor && "flavor"}{selectedFlavor && selectedSize && " & "}{selectedSize && "size"}
                    </div>
                  )}

                  {/* MRP */}
                  {discountPercent > 0 && (
                    <div className="text-sm text-neutral-500">
                      MRP{" "}
                      <span className="line-through">
                        ₹{basePrice.toFixed(0)}
                      </span>
                    </div>
                  )}

                  {/* Tax text */}
                  <div className="text-sm text-neutral-600">
                    Inclusive of all taxes
                  </div>

                  {/* Stock */}
                  <div className="mt-3">
                    {product.isOutOfStock ? (
                      <span className="text-sm font-medium text-red-600">
                        Out of stock
                      </span>
                    ) : (
                      <span className="text-sm font-medium text-green-600 flex items-center gap-1">
                        ✓ In stock!
                      </span>
                    )}
                  </div>

                </div>
              </div>

              {getSizesFromVariants().length > 0 && (
                <div className="mt-5">
                  <p className="text-sm font-medium mb-2">Size</p>
                  <div className="flex gap-2 flex-wrap">
                    {getSizesFromVariants().map((size: string) => (
                      <button
                        key={size}
                        onClick={() => handleSizeChange(size)}
                        className={`px-4 py-2 border rounded-md ${selectedSize === size
                          ? "bg-black text-white"
                          : "border-neutral-300"
                          }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {((product.weights || [])?.length) > 0 && (
                <div className="mt-5">
                  <p className="text-sm font-medium mb-2">Weight</p>
                  <div className="flex gap-2 flex-wrap">
                    {(product.weights || []).map((weight: string) => (
                      <button
                        key={weight}
                        onClick={() => setSelectedWeight(weight)}
                        className={`px-4 py-2 border rounded-md ${selectedWeight === weight
                          ? "bg-blue-600 text-white border-blue-600"
                          : "border-neutral-300"
                          }`}
                      >
                        {weight}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedSize && getFlavorsForSize(selectedSize).length > 0 && (
                <div className="mt-5">
                  <p className="text-sm font-medium mb-2">
                    Flavor
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {getFlavorsForSize(selectedSize).map((flavor: string) => (
                      <button
                        key={flavor}
                        onClick={() => handleFlavorChange(flavor)}
                        className={`px-4 py-2 border rounded-md ${selectedFlavor === flavor
                          ? "bg-orange-600 text-white border-orange-600"
                          : "border-neutral-300"
                          }`}
                      >
                        {flavor}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-5">
                <p className="text-sm font-medium mb-2">
                  Quantity
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() =>
                      setQuantity(Math.max(1, quantity - 1))
                    }
                    className="w-8 h-8 border rounded-md"
                  >
                    −
                  </button>
                  <span>{quantity}</span>
                  <button
                    onClick={() =>
                      setQuantity(quantity + 1)
                    }
                    className="w-8 h-8 border rounded-md"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="hidden md:flex gap-3 mt-6">
                <button
                  onClick={handleAddToCart}
                  disabled={product.isOutOfStock}
                  className={`flex-1 border border-black py-3 rounded-md transition ${product.isOutOfStock
                    ? 'bg-neutral-100 text-neutral-400 border-neutral-300 cursor-not-allowed'
                    : 'hover:bg-neutral-50'
                    }`}
                >
                  {product.isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                </button>
                <button
                  onClick={handleBuyNow}
                  disabled={product.isOutOfStock}
                  className={`flex-1 text-white py-3 rounded-md transition ${product.isOutOfStock
                    ? 'bg-neutral-400 cursor-not-allowed'
                    : 'bg-black hover:bg-neutral-800'
                    }`}
                >
                  {product.isOutOfStock ? 'Out of Stock' : 'Buy Now'}
                </button>
              </div>

              <div className="mt-8 space-y-2 text-sm text-neutral-600">
                <div className="flex gap-2">
                  <Truck className="w-4 h-4" /> order placed before 4pm will be shipped on the same day
                </div>
                <div className="flex gap-2">
                  <Shield className="w-4 h-4" /> 100% authentic products
                </div>
              </div>
            </div>
          </div>

          {product.description && (
            <div className="mt-12 bg-neutral-100 rounded-xl p-8">
              <h2 className="text-xl font-bold mb-4">Product Description</h2>
              <p className="text-neutral-700 leading-relaxed whitespace-pre-wrap">
                {product.description}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* MOBILE VIEW */}
      <div className="block md:hidden bg-neutral-50 min-h-screen pb-32">
        <div className="px-5 pt-6 space-y-6">

          {/* Breadcrumb */}
          <p className="text-xs text-neutral-400">
            <span onClick={() => navigate('/')} className="cursor-pointer hover:text-[#003D45]">
              Home
            </span> / <span className="text-[#003D45] font-semibold truncate">{product.name}</span>
          </p>

          {/* Product Image Carousel - Premium */}
          <div className="relative -mx-5 bg-white py-4 shadow-sm border-y border-neutral-100">
            <div className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar scroll-smooth">
              {images.map((img, idx) => (
                <div key={idx} className="min-w-full snap-center px-8">
                  <div className="aspect-square flex items-center justify-center p-2">
                    <img
                      src={getFullImageUrl(img)}
                      alt={product.name}
                      className="w-full h-full object-contain mix-blend-multiply"
                    />
                  </div>
                </div>
              ))}
            </div>
            {/* Heart Icon - Top Right on Image */}
            <button
              onClick={handleToggleFavorite}
              className={`absolute top-6 right-8 w-11 h-11 rounded-full flex items-center justify-center border transition-all duration-300 z-20 active:scale-90 ${
                isProductFavorited
                  ? "bg-rose-50 border-rose-100 text-rose-500 shadow-lg shadow-rose-500/20"
                  : "bg-white/80 backdrop-blur-md border-neutral-100 text-neutral-400 shadow-sm"
              }`}
            >
              <Heart className={`w-5 h-5 ${isProductFavorited ? "fill-rose-500" : ""}`} />
            </button>

            {/* Carousel Indicators */}
            <div className="flex justify-center gap-1.5 mt-4">
              {images.map((_, idx) => (
                <div 
                  key={idx} 
                  className={`h-1 rounded-full transition-all duration-300 ${
                    selectedImage === idx ? "w-6 bg-teal-800" : "w-1.5 bg-neutral-200"
                  }`} 
                />
              ))}
            </div>
          </div>
          {/* Product Title Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                {product.categoryName || "Premium Supplement"}
              </span>
              <span
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-widest border ${
                  product.isVegetarian
                    ? "bg-green-50 text-green-700 border-green-100"
                    : "bg-rose-50 text-rose-700 border-rose-100"
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${product.isVegetarian ? "bg-green-600" : "bg-rose-600"}`} />
                {product.isVegetarian ? "VEGETARIAN" : "NON-VEG"}
              </span>
            </div>

            <h1 className="text-2xl font-[900] text-neutral-900 leading-tight tracking-tight uppercase italic">
              {product.name}
            </h1>
            
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black text-teal-800 italic">
                ₹{finalPrice.toFixed(0)}
              </span>
              {discountPercent > 0 && (
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-neutral-300 line-through leading-none">
                    ₹{basePrice.toFixed(0)}
                  </span>
                  <span className="text-[10px] font-black text-rose-500 uppercase tracking-tighter">
                    {discountPercent}% OFF TODAY
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Selections Section */}
          <div className="space-y-8 py-4 bg-white -mx-5 px-5 border-y border-neutral-100 shadow-sm">
            {/* Flavor Selection */}
            {selectedSize && getFlavorsForSize(selectedSize).length > 0 && (
              <div className="space-y-4">
                <p className="text-xs font-black text-neutral-400 uppercase tracking-[0.2em]">Select Flavor</p>
                <div className="flex flex-wrap gap-2.5">
                  {getFlavorsForSize(selectedSize).map((flavor: string) => (
                    <button
                      key={flavor}
                      onClick={() => handleFlavorChange(flavor)}
                      className={`px-6 py-3 rounded-2xl text-[10px] font-bold tracking-widest border transition-all duration-300 active:scale-95 ${
                        selectedFlavor === flavor
                          ? "bg-teal-800 text-white border-teal-800 shadow-lg shadow-teal-800/20"
                          : "bg-white text-neutral-400 border-neutral-100"
                      }`}
                    >
                      {flavor.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size Selection */}
            {getSizesFromVariants().length > 0 && (
              <div className="space-y-4">
                <p className="text-xs font-black text-neutral-400 uppercase tracking-[0.2em]">Select Container Size</p>
                <div className="grid grid-cols-2 gap-3">
                  {getSizesFromVariants().map((size: string) => (
                    <button
                      key={size}
                      onClick={() => handleSizeChange(size)}
                      className={`py-4 rounded-[2rem] text-[10px] font-black border-2 transition-all duration-300 tracking-widest active:scale-95 ${
                        selectedSize === size
                          ? "border-teal-800 bg-teal-50/50 text-teal-800"
                          : "border-neutral-100 text-neutral-400 bg-white"
                      }`}
                    >
                      {size.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Quantity Selector */}
            <div className="space-y-4">
              <p className="text-xs font-black text-neutral-400 uppercase tracking-[0.2em]">Quantity</p>
              <div className="flex items-center bg-neutral-50 rounded-2xl w-fit p-1 border border-neutral-100">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 flex items-center justify-center text-teal-800 active:bg-neutral-200 rounded-xl transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-6 font-black text-teal-800 text-sm min-w-[50px] text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 flex items-center justify-center text-teal-800 active:bg-neutral-200 rounded-xl transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Trust Badges Section */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-3xl border border-neutral-100 flex flex-col items-center text-center">
              <Shield className="w-6 h-6 text-teal-800 mb-2" />
              <p className="text-[10px] font-black text-neutral-900 uppercase tracking-tighter">100% Authentic</p>
              <p className="text-[8px] text-neutral-400 font-bold">GENUINE PRODUCTS</p>
            </div>
            <div className="bg-white p-4 rounded-3xl border border-neutral-100 flex flex-col items-center text-center">
              <Truck className="w-6 h-6 text-teal-800 mb-2" />
              <p className="text-[10px] font-black text-neutral-900 uppercase tracking-tighter">Fast Delivery</p>
              <p className="text-[8px] text-neutral-400 font-bold">SAME DAY SHIPPING</p>
            </div>
          </div>

          {/* Product Description - More readable */}
          <div className="space-y-4 pt-4">
            <div className="flex items-center gap-4">
              <h3 className="text-xs font-[900] text-neutral-900 uppercase tracking-[0.2em] whitespace-nowrap">Description</h3>
              <div className="h-[1px] w-full bg-neutral-100" />
            </div>
            <p className="text-xs text-neutral-500 leading-loose font-medium italic">
              {product.description || "No description available for this premium supplement."}
            </p>
          </div>
        </div>

        {/* STICKY BOTTOM ACTION BAR - PREMIUM DUAL BUTTONS */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-neutral-100 p-5 z-[60] safe-area-bottom">
          <div className="flex gap-4">
            <button
              onClick={handleAddToCart}
              disabled={product.isOutOfStock}
              className={`flex-1 h-15 rounded-3xl font-black text-[11px] tracking-[0.2em] border-2 transition-all duration-300 active:scale-95 border-teal-800 text-teal-800 hover:bg-teal-50 disabled:opacity-30 uppercase`}
            >
              {product.isOutOfStock ? "Out of Stock" : "Add to Bag"}
            </button>

            <button
              onClick={handleBuyNow}
              disabled={product.isOutOfStock}
              className={`flex-1 h-15 rounded-3xl font-black text-[11px] tracking-[0.2em] transition-all duration-300 active:scale-95 bg-teal-800 text-white shadow-xl shadow-teal-800/20 disabled:opacity-30 uppercase`}
            >
              {product.isOutOfStock ? "NOT AVAILABLE" : "BUY NOW"}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};