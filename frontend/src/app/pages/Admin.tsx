import React, { useState, useEffect, useCallback } from "react";
import { Plus, Edit2, Trash2, X, Upload } from "lucide-react";
import { Product, ProductSize } from "../types";
import { toast } from "sonner";
import {
  fetchProducts,
  fetchProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadImages,
} from "../../services/productService";
import { AdminOrders } from "../components/AdminOrders";
import { AdminCancellationRequests } from "../components/AdminCancellationRequests";
import { AdminRefundStatus } from "../components/AdminRefundStatus";
import { AdminLayout } from "../components/AdminLayout";
import { getFullImageUrl } from "../utils/imageUtils";
import { AdminCouponManagement } from "../components/AdminCoupon";
import { OrderCancellationService } from "../../services/orderCancellationService";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper: Get price range from product variants
const getPriceRange = (product: Product): { min: number; max: number; display: string } => {
  const variants = product.productVariants || product.variants || [];
  if (!variants || variants.length === 0) {
    return { min: 0, max: 0, display: '₹0' };
  }
  const prices = variants.map(v => v.finalPrice || v.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const min = Math.round(Number(minPrice) || 0);
  const max = Math.round(Number(maxPrice) || 0);
  
  return {
    min,
    max,
    display: min === max ? `₹${min}` : `₹${min} – ₹${max}`
  };
};

// Helper: Check if product has any discount
const hasDiscount = (product: Product): boolean => {
  const variants = product.productVariants || product.variants || [];
  return variants.some(v => (v.discount ?? 0) > 0);
};

// Helper: Get maximum discount percentage from variants
const getMaxDiscount = (product: Product): number => {
  const variants = product.productVariants || product.variants || [];
  if (variants.length === 0) return 0;
  return Math.max(...variants.map(v => {
    if (v.discountType === 'percent') {
      return v.discount ?? 0;
    }
    return ((v.discount ?? 0) / (v.price || 1)) * 100;
  }));
};

interface AdminFormData extends Partial<Product> {
  newSizeValue?: string;
  newSizeUnit?: string;
  newFlavor?: string;
  sizes?: string[]; // Used by some legacy logic
}

const EMPTY_FORM: AdminFormData = {
  name: "",
  description: "",
  categoryId: "",
  productSizes: [],
  flavors: ["Unflavoured"],
  isOutOfStock: false,
  rating: 4.5,
  reviews: 0,
  imageUrls: [],
  isFeatured: false,
  isSpecialOffer: false,
  isVegetarian: false,
  newSizeValue: "",
  newSizeUnit: "g",
  newFlavor: "",
};

export const Admin: React.FC = () => {
  // Initialize activeTab from localStorage, default to "orders"
  const [activeTabState, setActiveTabState] = useState<"products" | "orders" | "cancellations" | "cancelled-orders" | "refunds" | "coupons">(
    (localStorage.getItem("adminActiveTab") as "products" | "orders" | "cancellations" | "cancelled-orders" | "refunds" | "coupons") || "orders"
  );
  
  // Initialize cancellation type from localStorage, default to "all"
  const [activeCancellationType, setActiveCancellationType] = useState<"all" | "after-delivery" | "pre-delivery">(
    (localStorage.getItem("adminCancellationType") as "all" | "after-delivery" | "pre-delivery") || "all"
  );

  const [refundRefreshTrigger, setRefundRefreshTrigger] = useState(0);
  const [pendingCancellationCounts, setPendingCancellationCounts] = useState({
    all: 0,
    preDelivery: 0,
    postDelivery: 0,
  });
  const [pendingOrdersCancellationCount, setPendingOrdersCancellationCount] = useState(0);

  // Handle cancellation approval - trigger refund refresh
  const handleCancellationApproved = () => {
    setRefundRefreshTrigger(prev => prev + 1);
    // Switch to refunds tab
    setActiveTab('refunds');
  };

  // Handle pending counts change from AdminCancellationRequests
  const handlePendingCountsChange = useCallback((counts: { all: number; preDelivery: number; postDelivery: number }) => {
    setPendingCancellationCounts(counts);
    setPendingOrdersCancellationCount(counts.preDelivery);
  }, []);

  // Load pending counts on page mount
  useEffect(() => {
    const loadPendingCounts = async () => {
      try {
        const allRequests = await OrderCancellationService.getAllRequests();
        
        // Calculate pending counts
        const pendingAll = allRequests.filter(r => r.status === "PENDING").length;
        
        const pendingPreDelivery = allRequests.filter(req => {
          if (req.status !== "PENDING") return false;
          const orderStatus = req.order?.status;
          return ["PENDING", "PAID", "SHIPPED"].includes(orderStatus || "");
        }).length;

        const pendingPostDelivery = allRequests.filter(req => {
          if (req.status !== "PENDING") return false;
          const orderStatus = req.order?.status;
          const deliveredAt = req.order?.deliveredAt;
          const requestCreatedAt = new Date(req.createdAt);
          
          if (orderStatus === "DELIVERED") return true;
          if (orderStatus === "CANCELLED" && deliveredAt) {
            const deliveredDate = new Date(deliveredAt);
            return requestCreatedAt > deliveredDate;
          }
          return false;
        }).length;

        handlePendingCountsChange({
          all: pendingAll,
          preDelivery: pendingPreDelivery,
          postDelivery: pendingPostDelivery,
        });
      } catch (error) {
        console.error("Error loading pending counts:", error);
      }
    };

    loadPendingCounts();
  }, [handlePendingCountsChange]);

  // Wrapper function to update both state and localStorage
  const setActiveTab = (tab: "products" | "orders" | "cancellations" | "cancelled-orders" | "refunds" | "coupons") => {
    setActiveTabState(tab);
    localStorage.setItem("adminActiveTab", tab);
  };

  // Wrapper function for cancellation type
  const handleCancellationTypeChange = (type: "all" | "after-delivery" | "pre-delivery") => {
    setActiveCancellationType(type);
    localStorage.setItem("adminCancellationType", type);
  };

  const activeTab = activeTabState;
  const [activeOrderStatus, setActiveOrderStatus] = useState<"all" | "pending" | "delivered" | "shipped">("pending");
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] =
    useState<Product | null>(null);
  const [formData, setFormData] = useState<AdminFormData>(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState("");

  // Delete confirmation modal state
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; productId: string | null; productName: string }>({ isOpen: false, productId: null, productName: "" });
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const ITEMS_PER_PAGE = 10;

  // Load products on component mount
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setIsLoading(true);
        const data = await fetchProducts();
        setProducts(data);
      } catch (error) {
        toast.error("Failed to load products");
      } finally {
        setIsLoading(false);
      }
    };

    loadProducts();
  }, []);

  /* ---------------- INPUT HANDLING ---------------- */
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, type } = e.target;
    const target = e.target as HTMLInputElement;
    const value = type === "checkbox" ? target.checked : target.value;

    const numberFields = [
      "basePrice",
      "discountPercent",
      "rating",
      "reviews",
    ];

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? value
          : numberFields.includes(name)
            ? Number(value) || 0
            : value,
    }));

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  /* ---------------- IMAGE HANDLING ---------------- */
  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = e.target.files;
    if (!files) return;

    try {
      toast.loading(`Uploading ${files.length} image(s)...`);
      
      // Upload files to backend
      const uploadedUrls = await uploadImages(Array.from(files));
      
      // Add uploaded URLs to form data
      setFormData((prev) => ({
        ...prev,
        imageUrls: [...(prev.imageUrls || []), ...uploadedUrls],
      }));

      // Clear imageUrls error when images are uploaded
      if (errors.imageUrls) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.imageUrls;
          return newErrors;
        });
      }
      
      toast.dismiss();
      toast.success(`${files.length} image(s) uploaded successfully`);
    } catch (error) {
      toast.dismiss();
      toast.error(error instanceof Error ? error.message : "Failed to upload images");
      console.error("Image upload error:", error);
    }
  };

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      imageUrls: (prev.imageUrls || []).filter((_, i) => i !== index),
    }));
    toast.success("Image removed");
  };

  /* ---------------- MODAL HANDLING ---------------- */
  const openModal = async (product?: Product) => {
    try {
      // Refresh categories list when opening modal to ensure latest data
      let updatedCategories = categoryNames;
      try {
        const categoriesResponse = await fetch(`${API_BASE_URL}/categories?t=${Date.now()}`);
        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json();
          updatedCategories = categoriesData.map((cat: any) => cat.name).sort();
          setCategoryNames(updatedCategories);
        }
      } catch (error) {
        console.error("Failed to refresh categories:", error);
      }

      if (product) {
        // Fetch latest product data from database
        const latestProduct = await fetchProductById(product.id);
        if (latestProduct) {
          setEditingProduct(latestProduct);
          
          // Transform productVariants from database to productSizes format for form
          let productSizes: ProductSize[] = [];
          if (latestProduct.productVariants && latestProduct.productVariants.length > 0) {
            // Group variants by size
            const sizeMap = new Map<string, Map<string, number>>();
            const discountMap = new Map<string, number>();
            
            latestProduct.productVariants.forEach(variant => {
              if (!sizeMap.has(variant.size)) {
                sizeMap.set(variant.size, new Map());
              }
              sizeMap.get(variant.size)!.set(variant.flavor, variant.price);
              discountMap.set(variant.size, Math.max(0, variant.discount || 0));
            });
            
            // Convert to productSizes format
            productSizes = Array.from(sizeMap.entries()).map(([size, flavorsMap]) => ({
              size,
              flavors: Array.from(flavorsMap.entries()).map(([name, price]) => ({
                name,
                price
              })),
              discount: Math.max(0, discountMap.get(size) || 0)
            }));
          }
          
          // Extract unique flavors
          const flavorsSet = new Set<string>();
          latestProduct.productVariants?.forEach(v => {
            flavorsSet.add(v.flavor);
          });
          const flavors = Array.from(flavorsSet).length > 0 ? Array.from(flavorsSet) : ["Unflavoured"];
          
          // Get product's category
          const productCategory = latestProduct.categoryName || latestProduct.categoryId;
          
          // Ensure product's category is in the dropdown list and update the local copy
          if (productCategory && !updatedCategories.includes(productCategory)) {
            updatedCategories = [...updatedCategories, productCategory].sort();
            setCategoryNames(updatedCategories);
          }
          
          // Set form data with transformed structure
          setFormData({
            ...latestProduct,
            categoryId: productCategory || "",
            productSizes,
            flavors
          });

          setIsModalOpen(true);
        } else {
          toast.error("Failed to load product data");
        }
      } else {
        setEditingProduct(null);
        setFormData(EMPTY_FORM);
        setIsModalOpen(true);
      }
    } catch (error) {
      console.error("Error opening modal:", error);
      toast.error("Failed to load product");
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setErrors({});
  };

  /* ---------------- VALIDATION ---------------- */
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Check required fields
    if (!formData.name || formData.name.trim() === "") {
      newErrors.name = "Product name is required";
    }
    if (!formData.description || formData.description.trim() === "") {
      newErrors.description = "Description is required";
    }
    if (!formData.categoryId || formData.categoryId.trim() === "") {
      newErrors.categoryId = "Category is required";
    }
    if (!formData.imageUrls || formData.imageUrls.length === 0) {
      newErrors.imageUrls = "At least one image is required";
    }
    if (formData.isVegetarian === undefined || formData.isVegetarian === null) {
      newErrors.isVegetarian = "Please select product type (Vegetarian/Non-Vegetarian)";
    }

    // Check sizes and pricing
    if (!formData.productSizes || formData.productSizes.length === 0) {
      newErrors.productSizes = "At least one size is required";
    } else {
      // Validate each size has flavors with prices
      let hasPricedFlavors = false;
      for (let i = 0; i < formData.productSizes.length; i++) {
        const size = formData.productSizes[i];
        if (!size.flavors || size.flavors.length === 0) {
          newErrors.productSizes = `Size "${size.size}" must have at least one flavor`;
          break;
        }
        // Check if all flavors have prices
        for (let j = 0; j < size.flavors.length; j++) {
          const flavor = size.flavors[j];
          if (flavor.price === undefined || flavor.price === null || flavor.price === 0) {
            newErrors.productSizes = `All flavors must have a price. "${size.size}" - "${flavor.name}" is missing price`;
            break;
          }
          if (flavor.price > 0) {
            hasPricedFlavors = true;
          }
        }
        if (newErrors.productSizes) break;
      }
      if (!hasPricedFlavors) {
        newErrors.productSizes = "At least one flavor must have a price greater than 0";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const [categoryNames, setCategoryNames] = useState<string[]>([]);

  // Fetch category names from backend
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/categories?t=${Date.now()}`,
        );
        if (response.ok) {
          const data = await response.json();
          // Extract category names from the response
          setCategoryNames(
            data.map((cat: any) => cat.name).sort(),
          );
        }
      } catch (error) {
        console.error("Failed to load categories:", error);
      }
    };

    loadCategories();
  }, []);

  const existingCategories = categoryNames;

  // Add this inside Admin component, near other useState

  /* ---------------- SUBMIT ---------------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form before submitting
    if (!validateForm()) {
      toast.error("Please fill all required fields correctly");
      return;
    }

    setIsSubmitting(true);

    try {
      // The imageUrls now contain only uploaded URLs from the backend
      const dataToSend = {
        ...formData,
        imageUrls: formData.imageUrls || [],
      };

      if (editingProduct) {
        await updateProduct(editingProduct.id, dataToSend as any);
        // Refresh products and categories
        const updated = await fetchProducts();
        setProducts(updated);
        
        // Refresh categories in case new ones were created
        const categoriesResponse = await fetch(`${API_BASE_URL}/categories?t=${Date.now()}`);
        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json();
          setCategoryNames(categoriesData.map((cat: any) => cat.name).sort());
        }
        
        toast.success("Product updated", {
          duration: 2000,
        });
      } else {
        await createProduct(dataToSend as any);
        // Refresh products and categories
        const updated = await fetchProducts();
        setProducts(updated);
        
        // Refresh categories in case new ones were created
        const categoriesResponse = await fetch(`${API_BASE_URL}/categories?t=${Date.now()}`);
        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json();
          setCategoryNames(categoriesData.map((cat: any) => cat.name).sort());
        }
        
        toast.success("Product added", {
          duration: 2000,
        });
      }

      closeModal();
    } catch (error: any) {
      toast.error(error.message || "Failed to save product");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    const productToDelete = products.find(p => p.id === id);
    setDeleteConfirmation({ isOpen: true, productId: id, productName: productToDelete?.name || "Product" });
    setDeleteConfirmText("");
  };

  const confirmDeleteProduct = async () => {
    if (deleteConfirmText !== "Delete Confirm") {
      toast.error("Type 'Delete Confirm' exactly to confirm deletion");
      return;
    }

    try {
      if (deleteConfirmation.productId) {
        await deleteProduct(deleteConfirmation.productId);
        setProducts((prev) => prev.filter((p) => p.id !== deleteConfirmation.productId));
        toast.success("Product deleted", {
          duration: 2000,
        });
      }
      setDeleteConfirmation({ isOpen: false, productId: null, productName: "" });
      setDeleteConfirmText("");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete product");
    }
  };

  /* ---------------- SEARCH & PAGINATION ---------------- */
  const filteredProducts = products.filter(
    (product) =>
      product.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (product.categoryId || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()),
  );

  const totalPages = Math.ceil(
    filteredProducts.length / ITEMS_PER_PAGE,
  );

  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  /* --------- Product Form Handlers ---------- */
  const handleAddCategory = () => {
    // Automatically convert to uppercase and trim
    const categoryName = newCategoryInput.trim().toUpperCase();
    if (!categoryName) {
      toast.error("Please enter a category name");
      return;
    }

    // Check if category already exists (now consistent uppercase)
    const existingCategory = existingCategories.find(
      (cat) => cat.toUpperCase().trim() === categoryName
    );

    if (existingCategory) {
      // If category already exists, select it
      setFormData((prev) => ({
        ...prev,
        categoryId: existingCategory.toUpperCase(),
      }));
      setNewCategoryInput("");
      setIsAddingCategory(false);
      toast.success(`Category "${existingCategory.toUpperCase()}" selected`);
    } else {
      // Add new category as uppercase
      const upperCategory = categoryName;
      setCategoryNames((prev) => [...prev, upperCategory].sort());
      setFormData((prev) => ({
        ...prev,
        categoryId: upperCategory,
      }));
      setNewCategoryInput("");
      setIsAddingCategory(false);
      toast.success(`Category "${upperCategory}" added`);
    }
  };

  /* ---------------- RENDER ---------------- */
  return (
    <AdminLayout
      activeSection={activeTab}
      onSectionChange={setActiveTab}
      activeCancellationType={activeCancellationType}
      onCancellationTypeChange={handleCancellationTypeChange}
      activeOrderStatus={activeOrderStatus}
      onOrderStatusChange={setActiveOrderStatus}
      pendingPreDeliveryCount={pendingCancellationCounts.preDelivery}
      pendingPostDeliveryCount={pendingCancellationCounts.postDelivery}
      pendingAllCancellationsCount={pendingCancellationCounts.all}
      pendingOrdersCount={pendingOrdersCancellationCount}
    >
      {/* PRODUCTS SECTION */}
      {activeTab === "products" && (
        <>
      {/* HEADER */}
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

        <div className="flex gap-3 relative">
          {/* Search Bar - Desktop Only - UNIQUE DESIGN */}
          <div 
            className="relative w-96 hidden lg:block"
            onMouseEnter={() => searchQuery && setIsSearchOpen(true)}
            onMouseLeave={() => setIsSearchOpen(false)}
          >
            <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
              if (e.target.value) setIsSearchOpen(true);
            }}
            className="w-full border border-gray-300 rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
            
            {/* Search Dropdown - Shows on hover with z-index fix */}
            {isSearchOpen && searchQuery && (
              <div className=" left-0 right-0 bg-white border-2 border-emerald-300 rounded-2xl shadow-2xl z-[999] max-h-64 overflow-y-auto">
                {filteredProducts.length > 0 ? (
                  <div className="divide-y-2">
                    {filteredProducts.slice(0, 5).map((product) => (
                      <div
                        key={product.id}
                        onClick={() => {
                          setSearchQuery(product.name);
                          setIsSearchOpen(false);
                        }}
                        className="px-5 py-4 hover:bg-emerald-50 cursor-pointer transition-colors border-b last:border-b-0"
                      >
                        <p className="text-sm font-semibold text-neutral-900">{product.name}</p>
                        <p className="text-xs text-emerald-600 font-medium">{product.categoryName || product.categoryId || "Uncategorized"}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-5 py-4 text-center text-sm text-neutral-500">
                    No products found
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-3 text-white font-medium hover:bg-neutral-800 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Product
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-hidden rounded-xl border bg-white">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-neutral-600">Loading products...</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-neutral-100">
              <tr>
                <th className="px-4 py-3 text-left">Product Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Price (Range)</th>
                <th className="px-4 py-3">Discount</th>
                <th className="px-4 py-3">Stock Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>

            <tbody>
              {paginatedProducts.map((p) => {
                const priceInfo = getPriceRange(p);
                const hasDiscountFlag = hasDiscount(p);
                const maxDiscount = getMaxDiscount(p);

                return (
                  <tr key={p.id} className="border-t hover:bg-neutral-50 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={getFullImageUrl(p.imageUrls?.[0] || "")}
                          className="h-10 w-10 rounded-lg border object-cover"
                          alt={p.name}
                        />
                        <div className="flex flex-col gap-1">
                          <span className="font-medium">
                            {p.name}
                          </span>
                          <div className="flex gap-2 flex-wrap">
                            {p.isFeatured && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Featured
                              </span>
                            )}
                            {p.isSpecialOffer && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                Special Offer
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="text-center">{p.categoryName || (typeof p.category === 'object' ? p.category?.name : p.category) || p.categoryId || "—"}</td>

                    <td className="text-center">
                      <span className="font-semibold text-neutral-900">
                        {priceInfo.display}
                      </span>
                    </td>

                    <td className="text-center">
                      {hasDiscountFlag ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                          Yes {maxDiscount > 0 && `(${Math.round(maxDiscount)}%)`}
                        </span>
                      ) : (
                        <span className="text-neutral-400">No</span>
                      )}
                    </td>

                    <td className="text-center">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                        p.isOutOfStock 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {p.isOutOfStock ? 'Out of Stock' : 'In Stock'}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => openModal(p)}
                          className="p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-md transition"
                          title="Edit product"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p.id)}
                          className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-md transition"
                          title="Delete product"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          {/* PREVIOUS */}
          <button
            onClick={() =>
              setCurrentPage((p) => Math.max(1, p - 1))
            }
            disabled={currentPage === 1}
            className="rounded-md border px-3 py-1 text-sm bg-white hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Prev
          </button>

          {/* PAGE NUMBERS */}
          {Array.from({ length: totalPages }).map(
            (_, index) => {
              const page = index + 1;
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`rounded-md border px-3 py-1 text-sm ${
                    currentPage === page
                      ? "bg-neutral-900 text-white"
                      : "bg-white hover:bg-neutral-100"
                  }`}
                >
                  {page}
                </button>
              );
            },
          )}

          {/* NEXT */}
          <button
            onClick={() =>
              setCurrentPage((p) => Math.min(totalPages, p + 1))
            }
            disabled={currentPage === totalPages}
            className="rounded-md border px-3 py-1 text-sm bg-white hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmation.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-red-600 mb-2">Delete Product?</h3>
            <p className="text-neutral-600 mb-4">
              Are you sure you want to delete <strong>{deleteConfirmation.productName}</strong>? This action cannot be undone.
            </p>
            <p className="text-sm text-neutral-500 mb-3">To confirm, type the text below (no pasting allowed):</p>
            <input
              type="text"
              placeholder="Type 'Delete Confirm' exactly"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              onPaste={(e) => e.preventDefault()}
              className="w-full px-3 py-2 border rounded-lg mb-4 font-mono text-center"
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setDeleteConfirmation({ isOpen: false, productId: null, productName: "" });
                  setDeleteConfirmText("");
                }}
                className="flex-1 rounded-lg border border-neutral-300 px-4 py-2 hover:bg-neutral-100"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteProduct}
                disabled={deleteConfirmText !== "Delete Confirm"}
                className="flex-1 rounded-lg bg-red-600 text-white px-4 py-2 hover:bg-red-700 disabled:bg-neutral-300 disabled:cursor-not-allowed"
              >
                Delete Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-semibold">
                {editingProduct
                  ? "Edit Product"
                  : "Add Product"}
              </h2>
              <button onClick={closeModal}>
                <X />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-6"
            >
              {/* PRODUCT NAME */}
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Product Name
                </label>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full rounded-lg border px-3 py-2 ${errors.name ? "border-b-2 border-b-red-500" : ""}`}
                />
                {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
              </div>

              {/* DESCRIPTION */}
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className={`w-full rounded-lg border px-3 py-2 ${errors.description ? "border-b-2 border-b-red-500" : ""}`}
                />
                {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description}</p>}
              </div>

              {/* FLAVORS */}
              <div>
                <label className="mb-3 block text-sm font-medium">Flavors</label>
                
                {/* Flavor Tags */}
                <div className="flex gap-2 flex-wrap mb-3">
                  {(formData.flavors || []).map((flavor) => (
                    <div
                      key={flavor}
                      className="flex items-center gap-2 rounded-full bg-blue-100 text-blue-800 px-3 py-1.5 text-sm font-medium"
                    >
                      {flavor}
                      {flavor !== "Unflavoured" && (
                        <button
                          type="button"
                          onClick={() => {
                            const newFlavors = (formData.flavors || []).filter(f => f !== flavor);
                            const newSizes = (formData.productSizes || []).map(size => ({
                              ...size,
                              flavors: size.flavors.filter(f => f.name !== flavor)
                            }));
                            setFormData((prev) => ({
                              ...prev,
                              flavors: newFlavors.length === 0 ? ["Unflavoured"] : newFlavors,
                              productSizes: newSizes
                            }));
                          }}
                          className="text-blue-600 hover:text-blue-800 font-bold"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add Flavor Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add new flavor (e.g., Mango, Chocolate)..."
                    value={formData.newFlavor || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        newFlavor: e.target.value,
                      }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const flavorName = (formData.newFlavor || "").trim();
                        if (flavorName && !(formData.flavors || []).includes(flavorName)) {
                          const newFlavors = (formData.flavors || []).filter(f => f !== "Unflavoured");
                          setFormData((prev) => ({
                            ...prev,
                            flavors: [...newFlavors, flavorName],
                            newFlavor: ""
                          }));
                        }
                      }
                    }}
                    className="flex-1 rounded-lg border px-3 py-2"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const flavorName = (formData.newFlavor || "").trim();
                      if (flavorName && !(formData.flavors || []).includes(flavorName)) {
                        const newFlavors = (formData.flavors || []).filter(f => f !== "Unflavoured");
                        setFormData((prev) => ({
                          ...prev,
                          flavors: [...newFlavors, flavorName],
                          newFlavor: ""
                        }));
                      }
                    }}
                    className="rounded-lg bg-neutral-900 px-4 py-2 text-white hover:bg-neutral-800"
                  >
                    Add
                  </button>
                </div>
                {errors.flavors && <p className="mt-1 text-xs text-red-500">{errors.flavors}</p>}
              </div>

              {/* SIZES WITH FLAVORS & PRICING */}
              <div>
                <label className="mb-3 block text-sm font-medium">Sizes & Pricing</label>
                
                {/* Existing Sizes */}
                {(formData.productSizes || []).map((size, sizeIdx) => (
                  <div key={sizeIdx} className="mb-4 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                    <div className="flex justify-between items-center mb-3 gap-3">
                      <div className="flex items-end gap-2">
                        <div>
                          <h4 className="font-semibold">{size.size}</h4>
                        </div>
                        <div className="flex-1 min-w-[150px]">
                          <label className="text-xs font-medium text-neutral-600">Base Price (₹)</label>
                          <input
                            type="number"
                            placeholder="Enter price for all flavors"
                            onChange={(e) => {
                              const basePrice = Math.round(parseFloat(e.target.value) || 0);
                              const newSizes = [...(formData.productSizes || [])];
                              if (basePrice > 0) {
                                newSizes[sizeIdx].flavors = newSizes[sizeIdx].flavors.map(f => ({
                                  ...f,
                                  price: basePrice
                                }));
                              }
                              setFormData((prev) => ({
                                ...prev,
                                productSizes: newSizes
                              }));
                            }}
                            className="w-full text-sm rounded border px-2 py-1"
                            step="1"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const newSizes = (formData.productSizes || []).filter((_, idx) => idx !== sizeIdx);
                          setFormData((prev) => ({
                            ...prev,
                            productSizes: newSizes
                          }));
                        }}
                        className="text-red-600 hover:text-red-800 font-bold"
                      >
                        Remove
                      </button>
                    </div>
                    
                    {/* Flavor Pricing for this Size */}
                    <div className="mb-4 space-y-2">
                      <div className="text-xs font-medium text-neutral-600 mb-2">Flavor, Price, Final Price</div>
                      {size.flavors.map((flavorItem, flavorIdx) => {
                        const discount = size.discount || 0;
                        const finalPrice = Math.round(flavorItem.price - (flavorItem.price * discount / 100));
                        return (
                          <div key={flavorIdx} className="flex gap-3 items-end bg-white p-2 rounded border">
                            <div className="flex-1">
                              <label className="text-xs font-medium text-neutral-600">Flavor</label>
                              <select
                                value={flavorItem.name}
                                onChange={(e) => {
                                  const newSizes = [...(formData.productSizes || [])];
                                  newSizes[sizeIdx].flavors[flavorIdx].name = e.target.value;
                                  setFormData((prev) => ({
                                    ...prev,
                                    productSizes: newSizes
                                  }));
                                }}
                                className="w-full text-sm rounded border px-2 py-1"
                              >
                                {(formData.flavors || []).map(f => (
                                  <option key={f} value={f}>{f}</option>
                                ))}
                              </select>
                            </div>
                            <div className="flex-1">
                              <label className="text-xs font-medium text-neutral-600">Price (₹)</label>
                              <input
                                type="number"
                                value={flavorItem.price}
                                onChange={(e) => {
                                  const newSizes = [...(formData.productSizes || [])];
                                  newSizes[sizeIdx].flavors[flavorIdx].price = Math.round(parseFloat(e.target.value) || 0);
                                  setFormData((prev) => ({
                                    ...prev,
                                    productSizes: newSizes
                                  }));
                                }}
                                className="w-full text-sm rounded border px-2 py-1"
                                step="1"
                              />
                            </div>
                            <div className="flex-1">
                              <label className="text-xs font-medium text-neutral-600">Final Price (₹)</label>
                              <input
                                type="number"
                                value={finalPrice}
                                readOnly
                                className="w-full text-sm rounded border px-2 py-1 bg-neutral-100"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const newSizes = [...(formData.productSizes || [])];
                                newSizes[sizeIdx].flavors.splice(flavorIdx, 1);
                                if (newSizes[sizeIdx].flavors.length === 0) {
                                  newSizes.splice(sizeIdx, 1);
                                }
                                setFormData((prev) => ({
                                  ...prev,
                                  productSizes: newSizes
                                }));
                              }}
                              className="text-red-600 hover:text-red-800 font-bold"
                            >
                              ×
                            </button>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Discount Section - Applied on Size */}
                    <div className="bg-white p-3 rounded border border-neutral-200">
                      <label className="text-xs font-medium text-neutral-600">Discount (%) - Applied on Size</label>
                      <input
                        type="number"
                        value={size.discount || 0}
                        onChange={(e) => {
                          const newSizes = [...(formData.productSizes || [])];
                          const discountValue = Math.round(parseFloat(e.target.value) || 0);
                          newSizes[sizeIdx].discount = Math.max(0, discountValue);
                          setFormData((prev) => ({
                            ...prev,
                            productSizes: newSizes
                          }));
                        }}
                        className="w-full text-sm rounded border px-2 py-1"
                        step="1"
                        min="0"
                      />
                    </div>
                  </div>
                ))}

                {/* Add New Size */}
                <div className="rounded-lg border-2 border-dashed border-neutral-300 p-4">
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Enter size (e.g., 250, 500, 1000)"
                      value={formData.newSizeValue || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          newSizeValue: e.target.value,
                        }))
                      }
                      className="flex-1 rounded-lg border px-3 py-2"
                      step="1"
                    />
                    <select
                      value={formData.newSizeUnit || "g"}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          newSizeUnit: e.target.value,
                        }))
                      }
                      className="rounded-lg border px-3 py-2"
                    >
                      <option value="g">g</option>
                      <option value="kg">kg</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        const sizeValue = formData.newSizeValue?.trim();
                        if (sizeValue) {
                          const sizeName = `${sizeValue}${formData.newSizeUnit || "g"}`;
                          if (!(formData.productSizes || []).some(s => s.size === sizeName)) {
                            const newSize = {
                              size: sizeName,
                              discount: 0,
                              flavors: (formData.flavors || ["Unflavoured"]).map(flavor => ({
                                name: flavor,
                                price: 0,
                                discount: 0
                              }))
                            };
                            setFormData((prev) => ({
                              ...prev,
                              productSizes: [...(prev.productSizes || []), newSize],
                              newSizeValue: "",
                              newSizeUnit: "g"
                            }));
                          }
                        }
                      }}
                      className="rounded-lg bg-neutral-900 px-4 py-2 text-white hover:bg-neutral-800"
                    >
                      Add Size
                    </button>
                  </div>
                </div>
                {errors.productSizes && <p className="mt-2 text-xs text-red-500">{errors.productSizes}</p>}
              </div>

              {/* CATEGORY (Dropdown + Add New) */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Category
                </label>

                {!isAddingCategory ? (
                  <div className="flex gap-2">
                    <select
                      value={formData.categoryId || ""}
                      onChange={(e) => {
                        setFormData((prev) => ({
                          ...prev,
                          categoryId: e.target.value,
                        }));
                        // Clear category error when user selects
                        if (errors.categoryId) {
                          setErrors((prev) => {
                            const newErrors = { ...prev };
                            delete newErrors.categoryId;
                            return newErrors;
                          });
                        }
                      }}
                      className={`flex-1 rounded-lg border px-3 py-2 ${errors.categoryId ? "border-b-2 border-b-red-500" : ""}`}
                    >
                      <option value="">Select a category...</option>
                      {existingCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => setIsAddingCategory(true)}
                      className="flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-white hover:bg-neutral-800"
                    >
                      <Plus className="h-4 w-4" />
                      Add
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCategoryInput}
                      onChange={(e) =>
                        setNewCategoryInput(e.target.value)
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleAddCategory();
                        } else if (e.key === "Escape") {
                          setIsAddingCategory(false);
                          setNewCategoryInput("");
                        }
                      }}
                      placeholder="Enter category name..."
                      autoFocus
                      className="flex-1 rounded-lg border px-3 py-2"
                    />
                    <button
                      type="button"
                      onClick={handleAddCategory}
                      className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingCategory(false);
                        setNewCategoryInput("");
                      }}
                      className="rounded-lg bg-neutral-300 px-4 py-2 text-neutral-700 hover:bg-neutral-400"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {errors.categoryId && <p className="mt-1 text-xs text-red-500">{errors.categoryId}</p>}
                <p className="mt-1 text-xs text-neutral-500">
                  {existingCategories.length} categories available
                </p>
              </div>

              {/* HOME PAGE VISIBILITY */}
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="isFeatured"
                    checked={!!formData.isFeatured}
                    onChange={handleInputChange}
                    className="h-4 w-4"
                  />
                  <div>
                    <p className="font-medium">
                      Featured Product
                    </p>
                    <p className="text-xs text-neutral-500">
                      Show in Featured section on Home
                    </p>
                  </div>
                </label>

                <label className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="isSpecialOffer"
                    checked={!!formData.isSpecialOffer}
                    onChange={handleInputChange}
                    className="h-4 w-4"
                  />
                  <div>
                    <p className="font-medium">
                      Special Discount
                    </p>
                    <p className="text-xs text-neutral-500">
                      Show in Special Offers on Home
                    </p>
                  </div>
                </label>
              </div>

              {/* VEG/NON-VEG */}
              <div>
                <p className="mb-3 text-sm font-medium">Type</p>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-green-50">
                    <input
                      type="radio"
                      name="isVegetarian"
                      checked={formData.isVegetarian === true}
                      onChange={() => {
                        setFormData((prev) => ({ ...prev, isVegetarian: true }));
                        if (errors.isVegetarian) {
                          setErrors((prev) => {
                            const newErrors = { ...prev };
                            delete newErrors.isVegetarian;
                            return newErrors;
                          });
                        }
                      }}
                      className="h-4 w-4"
                    />
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 border-2 border-green-600 rounded-sm flex items-center justify-center bg-white">
                        <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                      </div>
                      <div>
                        <p className="font-medium">Vegetarian</p>
                        <p className="text-xs text-neutral-500">
                          Veg products
                        </p>
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-red-50">
                    <input
                      type="radio"
                      name="isVegetarian"
                      checked={formData.isVegetarian === false}
                      onChange={() => {
                        setFormData((prev) => ({ ...prev, isVegetarian: false }));
                        if (errors.isVegetarian) {
                          setErrors((prev) => {
                            const newErrors = { ...prev };
                            delete newErrors.isVegetarian;
                            return newErrors;
                          });
                        }
                      }}
                      className="h-4 w-4"
                    />
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 border-2 border-red-600 rounded-sm flex items-center justify-center bg-white">
                        <div className="w-1.5 h-1.5 bg-red-600 rounded-full"></div>
                      </div>
                      <div>
                        <p className="font-medium">Non-Vegetarian</p>
                        <p className="text-xs text-neutral-500">
                          Non-veg products
                        </p>
                      </div>
                    </div>
                  </label>
                </div>
                {errors.isVegetarian && <p className="mt-1 text-xs text-red-500">{errors.isVegetarian}</p>}
              </div>

              {/* IMAGES */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Product Images (Multiple)
                </label>
                
                {/* Image Preview Grid */}
                {(formData.imageUrls || []).length > 0 && (
                  <div className="mb-4 grid grid-cols-4 gap-3">
                    {(formData.imageUrls || []).map((img, idx) => (
                      <div key={idx} className="relative">
                        <img
                          src={getFullImageUrl(img)}
                          alt={`Preview ${idx}`}
                          className="w-full h-24 object-cover rounded-lg border"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <label className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 hover:bg-neutral-50 ${errors.imageUrls ? "border-b-2 border-b-red-500" : ""}`}>
                  <Upload className="h-4 w-4" />
                  Upload Images
                  <input
                    type="file"
                    multiple
                    hidden
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </label>
                {errors.imageUrls && <p className="mt-1 text-xs text-red-500">{errors.imageUrls}</p>}
                <p className="mt-1 text-xs text-neutral-500">
                  {(formData.imageUrls || []).length} image(s) added
                </p>
              </div>

              {/* OUT OF STOCK */}
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Stock Status
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    name="isOutOfStock"
                    checked={formData.isOutOfStock || false}
                    onChange={handleInputChange}
                    className="w-5 h-5 rounded border-gray-300 cursor-pointer"
                  />
                  <span className="text-sm text-gray-600">Mark this product as out of stock</span>
                </div>
              </div>

              {/* SUBMIT */}
              <button
                disabled={isSubmitting}
                className="w-full rounded-lg bg-neutral-900 py-2 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting
                  ? "Saving..."
                  : editingProduct
                  ? "Update Product"
                  : "Add Product"}
              </button>
            </form>
          </div>
        </div>
      )}
      </>
      )}

      {/* ORDERS TAB */}
      {activeTab === "orders" && (
        <div>
          <AdminOrders filterStatus={activeOrderStatus} />
        </div>
      )}

      {/* CANCELLATIONS TAB */}
      {activeTab === "cancellations" && (
        <div>
          <AdminCancellationRequests 
            cancellationType={activeCancellationType}
            onCancellationApproved={handleCancellationApproved}
            onPendingCountsChange={handlePendingCountsChange}
          />
        </div>
      )}

      {/* CANCELLED ORDERS TAB */}
      {activeTab === "cancelled-orders" && (
        <div>
          <AdminOrders filterStatus="cancelled" />
        </div>
      )}

      {/* REFUNDS TAB */}
      {activeTab === "refunds" && (
        <div>
          <AdminRefundStatus refreshTrigger={refundRefreshTrigger} />
        </div>
      )}

      {/* COUPONS TAB */}
      {activeTab === "coupons" && (
        <div>
          <AdminCouponManagement />
        </div>
      )}
    </AdminLayout>
  );
};