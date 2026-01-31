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
  LogOut,
} from "lucide-react";

import { useCart } from "./context/CartContext";
import { useAuth } from "./context/AuthContext";
import { CategoryDropdown } from "./CategoryDropdown";

export const Navbar: React.FC = () => {
  const { cartItems } = useCart();
  const { isAuthenticated, logout, user } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState("all");

  const [desktopOpen, setDesktopOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const desktopDropdownRef = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;
  const mobileDropdownRef = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;

  const cartItemsCount = cartItems.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );

  const isAdmin = user?.email === 'admin@gmail.com';

  const isActive = (path: string) => location.pathname === path;

  const navLinkClass = (path: string) =>
    `text-sm transition relative pb-1 text-white ${
      isActive(path)
        ? "font-medium after:absolute after:left-0 after:-bottom-0.5 after:w-full after:h-[2px] after:bg-white"
        : "hover:text-neutral-200"
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
      setIsMenuOpen(false);
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

  const handleMenuItemClick = (path: string) => {
    navigate(path);
    setIsMenuOpen(false);
  };

  return (
    <>
      <nav className="sticky top-0 z-50 bg-teal-900 border-b shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between h-16 gap-2">
            <Link to="/" className="text-lg md:text-xl font-bold text-white flex-shrink-0">
              Saturnimports
            </Link>

            {/* DESKTOP SEARCH */}
            <div className="hidden md:flex flex-1 mx-8 max-w-[760px]">
              <div className="flex w-full border rounded-2xl ">
                <div className="basis-[120px] shrink-0 rounded-l-2xl">
                  <CategoryDropdown
                    isOpen={desktopOpen}
                    setIsOpen={setDesktopOpen}
                    selectedCategory={selectedCategory}
                    onSelect={handleCategorySelect}
                    dropdownRef={desktopDropdownRef}
                  />
                </div>

                <div className="relative flex-1 rounded-r-2xl">
                  <input
                    value={searchQuery}
                    onChange={(e) =>
                      setSearchQuery(e.target.value)
                    }
                    placeholder="Search supplements..."
                    className="w-full h-11 px-4 pr-10 focus:outline-none bg-white text-neutral-900 placeholder:text-neutral-400 rounded-r-2xl"
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
              {isAdmin && (
                <Link
                  to="/admin"
                  className={navLinkClass("/admin")}
                >
                  Admin
                </Link>
              )}

              <Link to="/cart" className="relative text-white hover:text-neutral-200 transition">
                <ShoppingCart className="w-5 h-5" />
                {cartItemsCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-black text-white text-[10px] rounded-full px-1.5 py-0.5">
                    {cartItemsCount}
                  </span>
                )}
              </Link>

              {isAuthenticated ? (
                <>
                  <Link to="/account" title="My Account" className="text-white hover:text-neutral-200 transition">
                    <User className="w-5 h-5" />
                  </Link>
                  <button 
                    onClick={() => {
                      logout();
                      navigate('/');
                    }}
                    title="Logout"
                    className="text-white hover:text-neutral-200 transition"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <Link to="/login" title="Login" className="text-white hover:text-neutral-200 transition">
                  <User className="w-5 h-5" />
                </Link>
              )}
            </div>

            {/* MOBILE BUTTONS */}
            <div className="md:hidden flex items-center gap-3 text-white">
              <Link to="/cart" className="relative hover:text-neutral-200 transition">
                <ShoppingCart className="w-5 h-5" />
                {cartItemsCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-black text-white text-[10px] rounded-full px-1 py-0.5">
                    {cartItemsCount}
                  </span>
                )}
              </Link>

              {/* Hamburger Menu with Animation */}
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-1 hover:bg-teal-800 rounded transition"
                aria-label="Menu"
              >
                <div className="w-6 h-5 flex flex-col justify-between relative">
                  <span
                    className={`h-0.5 w-full bg-white rounded-full transition-all duration-300 ${
                      isMenuOpen ? "rotate-45 absolute top-1/2 -translate-y-1/2" : ""
                    }`}
                  />
                  <span
                    className={`h-0.5 w-full bg-white rounded-full transition-all duration-300 ${
                      isMenuOpen ? "opacity-0" : ""
                    }`}
                  />
                  <span
                    className={`h-0.5 w-full bg-white rounded-full transition-all duration-300 ${
                      isMenuOpen ? "-rotate-45 absolute top-1/2 -translate-y-1/2" : ""
                    }`}
                  />
                </div>
              </button>
            </div>
          </div>

          {/* MOBILE SEARCH */}
          <div className="md:hidden pb-4">
            <div className="flex gap-2 border rounded-xl overflow-hidden">
              <div className="basis-[80px] shrink-0">
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
                  placeholder="Search..."
                  className="w-full h-11 px-3 pr-9 focus:outline-none bg-white text-neutral-900 placeholder:text-neutral-400 text-sm"
                />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* MOBILE MENU MODAL */}
      {isMenuOpen && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setIsMenuOpen(false)}
            style={{ top: "64px" }}
          />

          {/* Menu Panel */}
          <div className="fixed left-0 right-0 top-16 bg-teal-800 z-40 md:hidden shadow-lg animate-in slide-in-from-top-2 duration-200">
            <div className="max-w-[1400px] mx-auto px-4 py-4 space-y-1">
              <button
                onClick={() => handleMenuItemClick("/")}
                className={`w-full text-left px-4 py-3 rounded-lg transition ${
                  isActive("/")
                    ? "bg-teal-700 text-white font-medium"
                    : "text-white hover:bg-teal-700"
                }`}
              >
                Home
              </button>

              <button
                onClick={() => handleMenuItemClick("/products")}
                className={`w-full text-left px-4 py-3 rounded-lg transition ${
                  isActive("/products")
                    ? "bg-teal-700 text-white font-medium"
                    : "text-white hover:bg-teal-700"
                }`}
              >
                Products
              {isAdmin && (
                <button
                  onClick={() => handleMenuItemClick("/admin")}
                  className={`w-full text-left px-4 py-3 rounded-lg transition ${
                    isActive("/admin")
                      ? "bg-teal-700 text-white font-medium"
                      : "text-white hover:bg-teal-700"
                  }`}
                >
                  Admin
                </button>
              )}
                Admin
              </button>

              <div className="border-t border-teal-700 my-2 pt-2" />

              {isAuthenticated ? (
                <>
                  <button
                    onClick={() => handleMenuItemClick("/account")}
                    className={`w-full text-left px-4 py-3 rounded-lg transition flex items-center gap-3 ${
                      isActive("/account")
                        ? "bg-teal-700 text-white font-medium"
                        : "text-white hover:bg-teal-700"
                    }`}
                  >
                    <User className="w-4 h-4" />
                    My Account
                  </button>

                  <button
                    onClick={() => {
                      logout();
                      setIsMenuOpen(false);
                      navigate("/");
                    }}
                    className="w-full text-left px-4 py-3 rounded-lg transition text-white hover:bg-teal-700 flex items-center gap-3"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </>
              ) : (
                <button
                  onClick={() => handleMenuItemClick("/login")}
                  className={`w-full text-left px-4 py-3 rounded-lg transition flex items-center gap-3 ${
                    isActive("/login")
                      ? "bg-teal-700 text-white font-medium"
                      : "text-white hover:bg-teal-700"
                  }`}
                >
                  <User className="w-4 h-4" />
                  Login
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
};