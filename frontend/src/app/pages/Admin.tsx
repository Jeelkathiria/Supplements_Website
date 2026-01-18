import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, X, Upload } from "lucide-react";
import { Product } from "../types";
import {
  PRODUCTS,
  calculateFinalPrice,
} from "../data/products";
import { toast } from "sonner";
import {
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadImages,
} from "../../services/productService";
import { AdminOrders } from "../components/AdminOrders";

// Helper function to get full image URL
const getFullImageUrl = (imageUrl: string) => {
  if (!imageUrl) return '/placeholder.png';
  if (imageUrl.startsWith('http')) return imageUrl;
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const backendBase = apiBase.replace('/api', '');
  return `${backendBase}${imageUrl}`;
};

const EMPTY_FORM: Partial<Product> = {
  name: "",
  description: "",
  categoryId: "",
  sizes: [],
  flavors: [],
  basePrice: 0,
  discountPercent: 0,
  stockQuantity: 0,
  rating: 4.5,
  reviews: 0,
  imageUrls: [],
  isFeatured: false,
  isSpecialOffer: false,
  isVegetarian: false,
};

export const Admin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"products" | "orders">("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] =
    useState<Product | null>(null);
  const [formData, setFormData] =
    useState<Partial<Product>>(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showCategorySuggestions, setShowCategorySuggestions] =
    useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState("");
  const [isAddingCategory, setIsAddingCategory] = useState(false);
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
      "stockQuantity",
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
  const openModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      // When editing, use categoryName instead of categoryId for display
      setFormData({
        ...product,
        categoryId: product.categoryName || product.categoryId || "",
      });
    } else {
      setEditingProduct(null);
      setFormData(EMPTY_FORM);
    }
    setIsModalOpen(true);
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
    if (!formData.basePrice || formData.basePrice === 0) {
      newErrors.basePrice = "Base price is required and must be greater than 0";
    }
    if (formData.stockQuantity === undefined || formData.stockQuantity === null) {
      newErrors.stockQuantity = "Stock quantity is required";
    } else if (formData.stockQuantity === 0) {
      newErrors.stockQuantity = "Stock can't be 0";
    }
    if (!formData.imageUrls || formData.imageUrls.length === 0) {
      newErrors.imageUrls = "At least one image is required";
    }
    if (!formData.sizes || formData.sizes.length === 0) {
      newErrors.sizes = "At least one size is required";
    }
    if (formData.isVegetarian === undefined || formData.isVegetarian === null) {
      newErrors.isVegetarian = "Please select product type (Vegetarian/Non-Vegetarian)";
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
          "http://localhost:5000/api/categories",
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
        // Refresh products
        const updated = await fetchProducts();
        setProducts(updated);
        toast.success("Product updated", {
          duration: 2000,
        });
      } else {
        await createProduct(dataToSend as any);
        // Refresh products
        const updated = await fetchProducts();
        setProducts(updated);
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
    try {
      await deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      toast.success("Product deleted", {
        duration: 2000,
      });
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

  /* -------------   --------------------*/
  // Add inside Admin component
  const handleAddSize = () => {
    if (
      formData.newSize &&
      !formData.sizes?.includes(formData.newSize)
    ) {
      setFormData((prev) => ({
        ...prev,
        sizes: [...(prev.sizes || []), prev.newSize!],
        newSize: "",
      }));
      // Clear sizes error when user adds a size
      if (errors.sizes) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.sizes;
          return newErrors;
        });
      }
    }
  };

  const handleRemoveSize = (size: string) => {
    setFormData((prev) => ({
      ...prev,
      sizes: prev.sizes?.filter((s) => s !== size),
    }));
  };

  const handleAddFlavor = () => {
    if (
      formData.newFlavor &&
      !formData.flavors?.includes(formData.newFlavor)
    ) {
      setFormData((prev) => ({
        ...prev,
        flavors: [...(prev.flavors || []), prev.newFlavor!],
        newFlavor: "",
      }));
    }
  };

  const handleRemoveFlavor = (flavor: string) => {
    setFormData((prev) => ({
      ...prev,
      flavors: prev.flavors?.filter((f) => f !== flavor),
    }));
  };

  const handleAddCategory = () => {
    const trimmedName = newCategoryInput.trim();
    if (!trimmedName) {
      toast.error("Please enter a category name");
      return;
    }

    // Check if category already exists (case-insensitive)
    const existingCategory = existingCategories.find(
      (cat) => cat.toLowerCase() === trimmedName.toLowerCase()
    );

    if (existingCategory) {
      // If category already exists, select it
      setFormData((prev) => ({
        ...prev,
        categoryId: existingCategory,
      }));
      setNewCategoryInput("");
      setIsAddingCategory(false);
      toast.success(`Category "${existingCategory}" selected`);
    } else {
      // Add new category
      setCategoryNames((prev) => [...prev, trimmedName].sort());
      setFormData((prev) => ({
        ...prev,
        categoryId: trimmedName,
      }));
      setNewCategoryInput("");
      setIsAddingCategory(false);
      toast.success(`Category "${trimmedName}" added`);
    }
  };

  /* ---------------- RENDER ---------------- */
  return (
    <div className="p-6">
      {/* TABS */}
      <div className="mb-8 border-b border-neutral-200">
        <div className="flex gap-8">
          <button
            onClick={() => setActiveTab("products")}
            className={`pb-4 font-semibold transition-colors ${
              activeTab === "products"
                ? "border-b-2 border-neutral-900 text-neutral-900"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            Product Management
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`pb-4 font-semibold transition-colors ${
              activeTab === "orders"
                ? "border-b-2 border-neutral-900 text-neutral-900"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            Order Management
          </button>
        </div>
      </div>

      {/* PRODUCTS TAB */}
      {activeTab === "products" && (
        <>
      {/* HEADER */}
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Product Management
          </h1>
          <p className="text-sm text-neutral-600">
            Add and edit products
          </p>
        </div>

        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Search by name or category..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-64 rounded-lg border px-4 py-2"
          />

          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-white"
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
                <th className="px-4 py-3 text-left">Product</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Base Price</th>
                <th className="px-4 py-3">Discount</th>
                <th className="px-4 py-3">Final Price</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>

            <tbody>
              {paginatedProducts.map((p) => (
                <tr key={p.id} className="border-t">
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
                        <div className="flex gap-2">
                          {p.isFeatured && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Featured
                            </span>
                          )}
                          {p.isSpecialOffer && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                              Discounted
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="text-center">{p.categoryName || (typeof p.category === 'object' ? p.category?.name : p.category) || p.categoryId || "—"}</td>
                  <td className="text-center">₹{p.basePrice}</td>
                  <td className="text-center text-green-600">
                    {p.discountPercent ? `${p.discountPercent}%` : "—"}
                  </td>
                  <td className="text-center font-bold">
                    ₹{p.finalPrice}
                  </td>
                  <td className="text-center">{p.stockQuantity}</td>

                  <td>
                    <div className="flex justify-center gap-2">
                      <button onClick={() => openModal(p)}>
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDeleteProduct(p.id)}>
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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

              {/* SIZES */}
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Sizes Available
                </label>

                {/* Existing sizes */}
                <div className="flex gap-2 flex-wrap mb-2">
                  {(formData.sizes || []).map((size) => (
                    <span
                      key={size}
                      className="flex items-center gap-1 rounded-full bg-neutral-200 px-2 py-1 text-sm"
                    >
                      {size}
                      <button
                        type="button"
                        onClick={() => handleRemoveSize(size)}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>

                {/* Add new size */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add new size..."
                    value={formData.newSize || ""}
                    onChange={(e) => {
                      const numericValue =
                        e.target.value.replace(/\D/g, ""); // remove non-numeric
                      setFormData((prev) => ({
                        ...prev,
                        newSize: numericValue,
                      }));
                    }}
                    className="w-full rounded-lg border px-3 py-2"
                  />

                  {/* Unit dropdown */}
                  <select
                    value={formData.newSizeUnit || "kg"}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        newSizeUnit: e.target.value,
                      }))
                    }
                    className="rounded-lg border px-3 py-2"
                  >
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => {
                      if (formData.newSize) {
                        const sizeWithUnit = `${formData.newSize}${formData.newSizeUnit || "kg"}`;
                        if (
                          !(formData.sizes || []).includes(
                            sizeWithUnit,
                          )
                        ) {
                          setFormData((prev) => ({
                            ...prev,
                            sizes: [
                              ...(prev.sizes || []),
                              sizeWithUnit,
                            ],
                            newSize: "",
                            newSizeUnit: "kg",
                          }));
                        }
                      }
                    }}
                    className="rounded-lg bg-neutral-900 px-4 py-2 text-white"
                  >
                    Add
                  </button>
                </div>
                {errors.sizes && <p className="mt-1 text-xs text-red-500">{errors.sizes}</p>}
              </div>

              {/* FLAVORS */}
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Flavors Available
                </label>
                <div className="flex gap-2 flex-wrap mb-2">
                  {(formData.flavors || []).map((flavor) => (
                    <span
                      key={flavor}
                      className="flex items-center gap-1 rounded-full bg-neutral-200 px-2 py-1 text-sm"
                    >
                      {flavor}
                      <button
                        type="button"
                        onClick={() =>
                          handleRemoveFlavor(flavor)
                        }
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add new flavor..."
                    value={formData.newFlavor || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        newFlavor: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border px-3 py-2"
                  />
                  <button
                    type="button"
                    onClick={handleAddFlavor}
                    className="rounded-lg bg-neutral-900 px-4 py-2 text-white"
                  >
                    Add
                  </button>
                </div>
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

              {/* PRICING & STOCK */}
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Base Price
                  </label>
                  <input
                    type="number"
                    name="basePrice"
                    value={formData.basePrice}
                    onChange={handleInputChange}
                    className={`w-full rounded-lg border px-3 py-2 ${errors.basePrice ? "border-b-2 border-b-red-500" : ""}`}
                  />
                  {errors.basePrice && <p className="mt-1 text-xs text-red-500">{errors.basePrice}</p>}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Discount (%)
                  </label>
                  <input
                    type="number"
                    name="discountPercent"
                    value={formData.discountPercent}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border px-3 py-2"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    name="stockQuantity"
                    value={formData.stockQuantity}
                    onChange={handleInputChange}
                    className={`w-full rounded-lg border px-3 py-2 ${errors.stockQuantity ? "border-b-2 border-b-red-500" : ""}`}
                  />
                  {errors.stockQuantity && <p className="mt-1 text-xs text-red-500">{errors.stockQuantity}</p>}
                </div>
              </div>

              {/* FINAL PRICE */}
              <div className="rounded-lg bg-neutral-100 p-4 font-bold">
                Final Price: ₹{" "}
                {calculateFinalPrice(
                  formData.basePrice || 0,
                  formData.discountPercent || 0,
                )}
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
          <div className="mb-8">
            <h1 className="text-2xl font-bold">Order Management</h1>
            <p className="text-sm text-neutral-600">
              View and manage all customer orders
            </p>
          </div>
          <AdminOrders />
        </div>
      )}
    </div>
  );
};