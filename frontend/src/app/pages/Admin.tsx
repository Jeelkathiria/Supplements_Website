import React, { useState } from "react";
import { Plus, Edit2, Trash2, X, Upload } from "lucide-react";
import { Product } from "../types";
import {
  PRODUCTS,
  calculateFinalPrice,
} from "../data/products";
import { toast } from "sonner";

const EMPTY_FORM: Partial<Product> = {
  name: "",
  description: "",
  category: "",
  sizes: [],
  flavors: [],
  basePrice: 0,
  discount: 0,
  tax: 5,
  stock: 0,
  rating: 4.5,
  reviews: 0,
  images: [],
  isFeatured: false,
  isSpecialOffer: false,
};

export const Admin: React.FC = () => {
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] =
    useState<Product | null>(null);
  const [formData, setFormData] =
    useState<Partial<Product>>(EMPTY_FORM);

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const ITEMS_PER_PAGE = 10;

  /* ---------------- INPUT HANDLING ---------------- */
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;

    const numberFields = [
      "basePrice",
      "discount",
      "tax",
      "stock",
      "rating",
      "reviews",
    ];

    setFormData((prev) => ({
      ...prev,
      [name]: numberFields.includes(name)
        ? Number(value) || 0
        : value,
    }));
  };

  /* ---------------- IMAGE HANDLING ---------------- */
  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = e.target.files;
    if (!files) return;

    const images = Array.from(files).map((file) =>
      URL.createObjectURL(file),
    );

    setFormData((prev) => ({
      ...prev,
      images: [...(prev.images || []), ...images],
    }));

    toast.success(`${files.length} image(s) added`);
  };

  /* ---------------- MODAL HANDLING ---------------- */
  const openModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData(product);
    } else {
      setEditingProduct(null);
      setFormData(EMPTY_FORM);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const existingCategories = Array.from(
    new Set(products.map((p) => p.category).filter(Boolean)),
  );

  // Add this inside Admin component, near other useState
  const [showCategorySuggestions, setShowCategorySuggestions] =
    useState(false);

  /* ---------------- SUBMIT ---------------- */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingProduct) {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === editingProduct.id
            ? { ...p, ...formData }
            : p,
        ),
      );
      toast.success("Product updated", {
        duration: 2000, // 2 seconds
        action: {
          label: "×",
          onClick: (toastObj) => toastObj.dismiss(),
        },
      });
    } else {
      setProducts((prev) => [
        ...prev,
        { ...(formData as Product), id: Date.now().toString() },
      ]);
      toast.success("Product added", {
        duration: 2000,
        action: {
          label: "×",
          onClick: (toastObj) => toastObj.dismiss(),
        },
      });
    }

    closeModal();
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    toast.success("Product deleted", {
      duration: 2000,
      action: {
        label: "×",
        onClick: (toastObj) => toastObj.dismiss(),
      },
    });
  };

  /* ---------------- SEARCH & PAGINATION ---------------- */
  const filteredProducts = products.filter(
    (product) =>
      product.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      product.category
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

  /* ---------------- RENDER ---------------- */
  return (
    <div className="p-6">
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
                      src={p.images?.[0] || "/placeholder.png"}
                      className="h-10 w-10 rounded-lg border object-cover"
                      alt={p.name}
                    />
                    <span className="font-medium">
                      {p.name}
                    </span>
                  </div>
                </td>

                <td className="text-center">{p.category}</td>
                <td className="text-center">₹{p.basePrice}</td>
                <td className="text-center text-green-600">
                  {p.discount ? `${p.discount}%` : "—"}
                </td>
                <td className="text-center font-bold">
                  ₹
                  {calculateFinalPrice(
                    p.basePrice,
                    p.discount,
                    p.tax,
                  )}
                </td>
                <td className="text-center">{p.stock}</td>

                <td>
                  <div className="flex justify-center gap-2">
                    <button onClick={() => openModal(p)}>
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button onClick={() => deleteProduct(p.id)}>
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
                  className="w-full rounded-lg border px-3 py-2"
                  required
                />
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
                  className="w-full rounded-lg border px-3 py-2"
                />
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

              {/* CATEGORY (Search + Create) */}
              <div className="relative">
                <label className="mb-1 block text-sm font-medium">
                  Category
                </label>

                <input
                  name="category"
                  value={formData.category || ""}
                  onChange={(e) => {
                    handleInputChange(e);
                    setShowCategorySuggestions(true);
                  }}
                  onFocus={() =>
                    setShowCategorySuggestions(true)
                  }
                  onBlur={() =>
                    setTimeout(
                      () => setShowCategorySuggestions(false),
                      150,
                    )
                  }
                  placeholder="Search or type new category..."
                  className="w-full rounded-lg border px-3 py-2"
                />

                {/* DROPDOWN */}
                {showCategorySuggestions &&
                  formData.category &&
                  existingCategories.length > 0 && (
                    <div className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border bg-white shadow">
                      {existingCategories
                        .filter((cat) =>
                          cat
                            .toLowerCase()
                            .includes(
                              formData.category!.toLowerCase(),
                            ),
                        )
                        .map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => {
                              setFormData((prev) => ({
                                ...prev,
                                category: cat,
                              }));
                              setShowCategorySuggestions(false);
                            }}
                            className="block w-full px-3 py-2 text-left text-sm hover:bg-neutral-100"
                          >
                            {cat}
                          </button>
                        ))}

                      {/* CREATE NEW */}
                      {!existingCategories.some(
                        (cat) =>
                          cat.toLowerCase() ===
                          formData.category!.toLowerCase(),
                      ) && (
                        <div className="px-3 py-2 text-xs text-neutral-500 border-t">
                          Press Enter to create new category
                        </div>
                      )}
                    </div>
                  )}
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

              {/* IMAGES */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Product Images
                </label>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2">
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
                    className="w-full rounded-lg border px-3 py-2"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Discount (%)
                  </label>
                  <input
                    type="number"
                    name="discount"
                    value={formData.discount}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border px-3 py-2"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Tax (%)
                  </label>
                  <input
                    type="number"
                    name="tax"
                    value={formData.tax}
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
                    name="stock"
                    value={formData.stock}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border px-3 py-2"
                  />
                </div>
              </div>

              {/* FINAL PRICE */}
              <div className="rounded-lg bg-neutral-100 p-4 font-bold">
                Final Price: ₹{" "}
                {calculateFinalPrice(
                  formData.basePrice || 0,
                  formData.discount || 0,
                  formData.tax || 0,
                )}
              </div>

              {/* SUBMIT */}
              <button className="w-full rounded-lg bg-neutral-900 py-2 text-white">
                {editingProduct
                  ? "Update Product"
                  : "Add Product"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};