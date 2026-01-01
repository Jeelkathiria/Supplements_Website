import React, { useState, useEffect, useRef } from "react";
import {
  Link,
  useNavigate,
  useLocation,
} from "react-router-dom";
import {
  Search,
  ShoppingCart,
  User,
  Menu,
  X,
  LogOut,
} from "lucide-react";

import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { CategoryDropdown } from "./CategoryDropdown";

export const Navbar: React.FC = () => {
  const { cartItems } = useCart();
  const { isAuthenticated, logout } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState("all");

  const [desktopOpen, setDesktopOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const desktopDropdownRef = useRef<HTMLDivElement>(null);
  const mobileDropdownRef = useRef<HTMLDivElement>(null);

  const cartItemsCount = cartItems.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );

  const isActive = (path: string) => location.pathname === path;

  const navLinkClass = (path: string) =>
    `text-sm transition relative pb-1 ${
      isActive(path)
        ? "text-neutral-900 font-medium after:absolute after:left-0 after:-bottom-0.5 after:w-full after:h-[2px] after:bg-neutral-900"
        : "text-neutral-700 hover:text-neutral-900"
    }`;

  /* CLICK OUTSIDE */
  useEffect(() => {
    const handler = () => {
      setDesktopOpen(false);
      setMobileOpen(false);
    };

    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  /* LIVE SEARCH */
  useEffect(() => {
    if (!searchQuery.trim() && selectedCategory === "all")
      return;

    const timeout = setTimeout(() => {
      const params = new URLSearchParams();
      if (searchQuery.trim())
        params.set("search", searchQuery.trim());
      if (selectedCategory !== "all")
        params.set("category", selectedCategory);

      navigate(`/products?${params.toString()}`, {
        replace: true,
      });
    }, 400);

    return () => clearTimeout(timeout);
  }, [searchQuery, selectedCategory, navigate]);

  /* RESET ON ROUTE CHANGE */
  useEffect(() => {
    if (!location.pathname.startsWith("/products")) {
      setSearchQuery("");
      setSelectedCategory("all");
      setDesktopOpen(false);
      setMobileOpen(false);
    }
  }, [location.pathname]);

  const handleCategorySelect = (id: string) => {
    setSelectedCategory(id);
    setDesktopOpen(false);
    setMobileOpen(false);

    const params = new URLSearchParams();
    if (id !== "all") params.set("category", id);
    if (searchQuery.trim())
      params.set("search", searchQuery.trim());

    navigate(`/products?${params.toString()}`);
  };

  return (
    <nav className="sticky top-0 z-50 bg-white border-b shadow-sm">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="text-xl font-bold">
            ProFit
          </Link>

          {/* DESKTOP SEARCH */}
          <div className="hidden md:flex flex-1 mx-8 max-w-[760px]">
            <div className="flex w-full border rounded-xl">
              <div className="basis-[120px] shrink-0">
                <CategoryDropdown
                  isOpen={desktopOpen}
                  setIsOpen={setDesktopOpen}
                  selectedCategory={selectedCategory}
                  onSelect={handleCategorySelect}
                  dropdownRef={desktopDropdownRef}
                />
              </div>

              <div className="relative flex-1">
                <input
                  value={searchQuery}
                  onChange={(e) =>
                    setSearchQuery(e.target.value)
                  }
                  placeholder="Search supplements..."
                  className="w-full h-11 px-4 pr-10 focus:outline-none"
                />
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              </div>
            </div>
          </div>

          {/* DESKTOP NAV */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className={navLinkClass("/")}>
              Home
            </Link>
            <Link
              to="/products"
              className={navLinkClass("/products")}
            >
              Products
            </Link>
            <Link
              to="/admin"
              className={navLinkClass("/admin")}
            >
              Admin
            </Link>

            <Link to="/cart" className="relative">
              <ShoppingCart className="w-5 h-5" />
              {cartItemsCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-black text-white text-[10px] rounded-full px-1">
                  {cartItemsCount}
                </span>
              )}
            </Link>

            <Link to="/dashboard">
              <User className="w-5 h-5" />
            </Link>
          </div>

          {/* MOBILE BUTTONS */}
          <div className="md:hidden flex items-center gap-3">
            <Link to="/cart" className="relative">
              <ShoppingCart className="w-5 h-5" />
            </Link>
            <button onClick={() => setIsMenuOpen(true)}>
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* MOBILE SEARCH */}
        <div className="md:hidden pb-4">
          <div className="flex border rounded-xl">
            <div className="basis-[80px] shrink-0 border-r">
              <CategoryDropdown
                isOpen={mobileOpen}
                setIsOpen={setMobileOpen}
                selectedCategory={selectedCategory}
                onSelect={handleCategorySelect}
                dropdownRef={mobileDropdownRef}
                rounded="rounded-l-xl"
              />
            </div>

            <div className="relative flex-1">
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search supplements..."
                className="w-full h-11 px-3 pr-9 focus:outline-none"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};