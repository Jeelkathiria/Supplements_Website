import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Star,
  ShoppingCart,
  Truck,
  Shield,
  RotateCcw,
} from "lucide-react";
import { useCart } from "../context/CartContext";
import { toast } from "sonner";
import { Breadcrumb } from "../components/Breadcrumb";
import { fetchProducts } from "../../services/productService";
import { Product } from "../types";

export const ProductDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const imageRef = useRef<HTMLDivElement | null>(null);

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
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

  const finalPrice = product.finalPrice || 
    (product.basePrice - (product.basePrice * (product.discountPercent || 0)) / 100) * (1 + (product.gstPercent || 0) / 100);

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
    if (product.stockQuantity === 0) {
      toast.error('This product is out of stock');
      return;
    }
    if ((product.sizes || [])?.length && !selectedSize) {
      toast.error("Please select a size");
      return;
    }
    if ((product.flavors || product.colors || [])?.length && !selectedColor) {
      toast.error("Please select a flavor");
      return;
    }

    addToCart(product, quantity, selectedSize, selectedColor);
    toast.success(
      `${quantity} × ${product.name} added to cart`,
    );
  };

  const handleBuyNow = () => {
  if (product.stockQuantity === 0) {
    toast.error('This product is out of stock');
    return;
  }
  // Check size selection if sizes exist
  if ((product.sizes || [])?.length && !selectedSize) {
    toast.error("Please select a size");
    return;
  }

  // Check flavor selection if flavors exist
  if ((product.flavors || product.colors || [])?.length && !selectedColor) {
    toast.error("Please select a flavor");
    return;
  }

  // Add to cart
  addToCart(product, quantity, selectedSize, selectedColor);

  // Success toast
  toast.success(`${quantity} × ${product.name} added to cart`);

  // Navigate to cart page
  navigate("/cart");
};


  return (
    <div className="bg-white pb-24 md:pb-0">
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
          <div>
            <div
              ref={imageRef}
              className="relative bg-neutral-100 rounded-xl overflow-hidden"
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
              onMouseMove={handleMouseMove}
            >
              <img
                src={(product.imageUrls || product.images)?.[selectedImage] || '/placeholder.png'}
                alt={product.name}
                className="w-full aspect-square object-cover"
              />

              {isHovering && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    backgroundImage: `url(${(product.imageUrls || product.images)?.[selectedImage]})`,
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "220%",
                    backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
                  }}
                />
              )}
            </div>

            <div className="grid grid-cols-4 gap-3 mt-4">
              {(product.imageUrls || product.images || []).map((img, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`border rounded-lg overflow-hidden ${
                    selectedImage === index
                      ? "border-neutral-900"
                      : "border-neutral-300"
                  }`}
                >
                  <img
                    src={img}
                    className="w-full aspect-square object-cover"
                  />
                </button>
              ))}
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

            <div className="flex items-center gap-2 mt-2">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm">
                {(product.rating || 4.5).toFixed(1)} ({product.reviews || 0})
              </span>
            </div>

            <div className="mt-5 border-b pb-5">
              <div className="space-y-2">
                {/* Final Price */}
                <div>
                  <span className="text-4xl font-bold">
                    ₹{finalPrice.toFixed(2)}
                  </span>
                </div>
                
                {/* Tax Info */}
                <p className="text-sm text-neutral-600">
                  Inclusive of all taxes
                </p>

                {/* Original Price and Savings */}
                {(product.discountPercent || 0) > 0 && (
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-lg line-through text-neutral-500">
                      MRP ₹{product.basePrice.toFixed(2)}
                    </span>
                    <span className="text-lg font-medium text-green-600">
                      Save ₹{(product.basePrice - finalPrice).toFixed(2)} ({product.discountPercent}%)
                    </span>
                  </div>
                )}

                {/* Stock Status and Sales */}
                <div className="flex items-center gap-4 mt-3 flex-wrap">
                  {product.stockQuantity > 0 ? (
                    <span className="text-sm font-medium text-green-600 flex items-center gap-1">
                      ✓ In stock!
                    </span>
                  ) : (
                    <span className="text-sm font-medium text-red-600">
                      Out of stock
                    </span>
                  )}
                  {product.reviews && (
                    <span className="text-sm text-neutral-600">
                      {product.reviews}+ sold
                    </span>
                  )}
                </div>
              </div>
            </div>

            {((product.sizes || [])?.length) > 0 && (
              <div className="mt-5">
                <p className="text-sm font-medium mb-2">Size</p>
                <div className="flex gap-2 flex-wrap">
                  {(product.sizes || []).map((size: string) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-4 py-2 border rounded-md ${
                        selectedSize === size
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

            {((product.flavors || product.colors || [])?.length) > 0 && (
              <div className="mt-5">
                <p className="text-sm font-medium mb-2">
                  Flavor
                </p>
                <div className="flex gap-2 flex-wrap">
                  {(product.flavors || product.colors || []).map((flavor: string) => (
                    <button
                      key={flavor}
                      onClick={() => setSelectedColor(flavor)}
                      className={`px-4 py-2 border rounded-md ${
                        selectedColor === flavor
                          ? "bg-black text-white"
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
                    setQuantity(
                      Math.min(product.stockQuantity || product.stock || 0, quantity + 1),
                    )
                  }
                  className="w-8 h-8 border rounded-md"
                >
                  +
                </button>
                <span className="text-xs text-neutral-500">
                  {product.stockQuantity || product.stock || 0} left
                </span>
              </div>
            </div>

            {/* DESKTOP BUTTONS */}
            <div className="hidden md:flex gap-3 mt-6">
              <button
                onClick={handleAddToCart}
                disabled={product.stockQuantity === 0}
                className={`flex-1 border border-black py-3 rounded-md transition ${
                  product.stockQuantity === 0
                    ? 'bg-neutral-100 text-neutral-400 border-neutral-300 cursor-not-allowed'
                    : 'hover:bg-neutral-50'
                }`}
              >
                {product.stockQuantity === 0 ? 'Out of Stock' : 'Add to Cart'}
              </button>
              <button
                onClick={handleBuyNow}
                disabled={product.stockQuantity === 0}
                className={`flex-1 text-white py-3 rounded-md transition ${
                  product.stockQuantity === 0
                    ? 'bg-neutral-400 cursor-not-allowed'
                    : 'bg-black hover:bg-neutral-800'
                }`}
              >
                {product.stockQuantity === 0 ? 'Out of Stock' : 'Buy Now'}
              </button>
            </div>

            {/* MOBILE STICKY BAR */}
            <div className="sticky bottom-0 bg-white border-t p-3 flex gap-3 md:hidden z-30">
              <button
                onClick={handleAddToCart}
                disabled={product.stockQuantity === 0}
                className={`flex-1 border border-black py-3 rounded-md transition ${
                  product.stockQuantity === 0
                    ? 'bg-neutral-100 text-neutral-400 border-neutral-300 cursor-not-allowed'
                    : 'hover:bg-neutral-50'
                }`}
              >
                {product.stockQuantity === 0 ? 'Out of Stock' : 'Add to Cart'}
              </button>
              <button
                onClick={handleBuyNow}
                disabled={product.stockQuantity === 0}
                className={`flex-1 text-white py-3 rounded-md transition ${
                  product.stockQuantity === 0
                    ? 'bg-neutral-400 cursor-not-allowed'
                    : 'bg-black hover:bg-neutral-800'
                }`}
              >
                {product.stockQuantity === 0 ? 'Out of Stock' : 'Buy Now'}
              </button>
            </div>

            <div className="mt-8 space-y-2 text-sm text-neutral-600">
              <div className="flex gap-2">
                <Truck className="w-4 h-4" /> Free delivery
                above ₹499
              </div>
              <div className="flex gap-2">
                <RotateCcw className="w-4 h-4" /> 30-day easy
                returns
              </div>
              <div className="flex gap-2">
                <Shield className="w-4 h-4" /> 100% authentic
                products
              </div>
            </div>
          </div>
        </div>

        {/* DESCRIPTION SECTION */}
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
  );
};