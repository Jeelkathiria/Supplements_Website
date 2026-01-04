import React, { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";

type Category = {
  id: string;
  name: string;
};

type Props = {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  selectedCategory: string;
  onSelect: (id: string) => void;
  dropdownRef: React.RefObject<HTMLDivElement>;
  rounded?: string;
};

export const CategoryDropdown: React.FC<Props> = ({
  isOpen,
  setIsOpen,
  selectedCategory,
  onSelect,
  dropdownRef,
  rounded = "rounded-none",
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch categories from backend
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await fetch(
          "http://localhost:5000/api/categories",
        );
        if (response.ok) {
          const data = await response.json();
          // Add "All" option at the beginning
          setCategories([
            { id: "all", name: "All" },
            ...data.map((cat: Category) => ({
              id: cat.name, // Use name as ID for filtering
              name: cat.name,
            })),
          ]);
        }
      } catch (error) {
        console.error("Failed to load categories:", error);
        // Fallback to empty categories
        setCategories([{ id: "all", name: "All" }]);
      } finally {
        setIsLoading(false);
      }
    };

    loadCategories();
  }, []);

  const current =
    categories.find((c) => c.id === selectedCategory)?.name ||
    "All";

  return (
    <div
      ref={dropdownRef}
      className="relative w-full"
      onClick={(e) => e.stopPropagation()} // 🔥 IMPORTANT
    >
      {/* BUTTON */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full h-11 px-3 flex items-center justify-between bg-neutral-50 text-sm ${rounded}`}
      >
        <span className="truncate">{current}</span>
        <ChevronDown
          className={`w-4 h-4 transition ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* DROPDOWN */}
      {isOpen && (
        <div className="absolute left-0 top-full w-full bg-white border shadow-lg z-50 max-h-64 overflow-y-auto no-scrollbar">
          {isLoading ? (
            <div className="px-3 py-2 text-sm text-neutral-500">
              Loading categories...
            </div>
          ) : categories.length > 0 ? (
            categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => onSelect(cat.id)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-neutral-100 ${
                  selectedCategory === cat.id
                    ? "bg-neutral-100 font-medium"
                    : ""
                }`}
              >
                {cat.name}
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-neutral-500">
              No categories available
            </div>
          )}
        </div>
      )}
    </div>
  );
};