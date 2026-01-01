import React from "react";
import { ChevronDown } from "lucide-react";

type Props = {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  selectedCategory: string;
  onSelect: (id: string) => void;
  dropdownRef: React.RefObject<HTMLDivElement>;
  rounded?: string;
};

const CATEGORIES = [
  { id: "all", name: "All" },
  { id: "whey-protein", name: "Whey Protein" },
  { id: "plant-protein", name: "Plant Protein" },
  { id: "mass-gainer", name: "Mass Gainer" },
  { id: "casein-protein", name: "Casein Protein" },
  { id: "bcaa", name: "BCAA" },
  { id: "pre-workout", name: "Pre-Workout" },
  { id: "creatine", name: "Creatine" },
  { id: "fat-burner", name: "Fat Burner" },
];

export const CategoryDropdown: React.FC<Props> = ({
  isOpen,
  setIsOpen,
  selectedCategory,
  onSelect,
  dropdownRef,
  rounded = "rounded-none",
}) => {
  const current =
    CATEGORIES.find((c) => c.id === selectedCategory)?.name ||
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
          {CATEGORIES.map((cat) => (
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
          ))}
        </div>
      )}
    </div>
  );
};