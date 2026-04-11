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
  ChevronRight,
  X,
} from "lucide-react";

import { useCart } from "./context/CartContext";
import { useAuth } from "./context/AuthContext";
import { CategoryDropdown } from "./CategoryDropdown";
import saturnLogo from "../../images/LOGO.png";

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

  const desktopDropdownRef = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;

  const cartItemsCount = cartItems.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );

  const isActive = (path: string) => location.pathname === path;

  const isAdmin = user?.email === 'admin@gmail.com';

  /* CLICK OUTSIDE */
  useEffect(() => {
    const handler = () => {
      setDesktopOpen(false);
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

      // Check if the current URL already reflects the state to avoid redundant navigations
      const currentParams = new URLSearchParams(location.search);
      if (params.toString() === currentParams.toString() && location.pathname.startsWith("/products")) return;

      navigate(`/products?${params.toString()}`, {
        replace: true,
      });
    }, 400);

    return () => clearTimeout(timeout);
  }, [searchQuery, selectedCategory, navigate, location.pathname, location.search]);

  /* RESET ON ROUTE CHANGE & SYNC WITH URL */
  useEffect(() => {
    if (!location.pathname.startsWith("/products")) {
      setSearchQuery("");
      setSelectedCategory("all");
      setDesktopOpen(false);
      setIsMenuOpen(false);
    } else {
      // Sync state with URL params when on products page
      const params = new URLSearchParams(location.search);
      const search = params.get("search") || "";
      const category = params.get("category") || "all";

      if (search !== searchQuery) {
        setSearchQuery(search);
      }
      if (category !== selectedCategory) {
        setSelectedCategory(category);
      }
    }
  }, [location.pathname, location.search]);

  const handleCategorySelect = (id: string) => {
    setSelectedCategory(id);
    setDesktopOpen(false);

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
      <nav className="sticky top-0 z-50 transition-all duration-300">
        {/* TOP BANNER */}
        <div className="hidden lg:block bg-teal-950 border-b">
          <div className="max-w-[1400px] mx-auto px-8">
            <div className="flex items-center justify-center gap-8 h-10 text-xs text-gray-200">
              <span>Same Day Dispatch Before 4PM</span>
              <span className="text-gray-500">|</span>
              <Link to="/account" className="hover:text-white transition">100% Authentic Products</Link>
              <span className="text-gray-500">|</span>
              <Link to="/contact" className="hover:text-white transition">Easy Returns</Link>
            </div>
          </div>
        </div>

        {/* MAIN NAVBAR */}
        <div className="hidden lg:block bg-teal-900 border-b shadow-sm">
          <div className="max-w-[1400px] mx-auto px-8">
            <div className="flex items-center justify-between h-16 gap-4">
              {/* Logo */}
              <Link to="/" className="flex items-center flex-shrink-0 hover:opacity-90 transition">
                <img
                  src={saturnLogo}
                  alt="Logo"
                  className="h-38 w-40 object-contain mt-3"
                />
              </Link>

              {/* Combined Category Dropdown + Search Bar (Amazon Style) */}
              <div className="flex-1 max-w-[700px]">
                <div className="flex w-full bg-white rounded-lg shadow-sm hover:shadow-md transition">
                  {/* Category Dropdown (Left) */}
                  <div className="w-40 border-r border-gray-200 shrink-0">
                    <CategoryDropdown
                      isOpen={desktopOpen}
                      setIsOpen={setDesktopOpen}
                      selectedCategory={selectedCategory}
                      onSelect={handleCategorySelect}
                      dropdownRef={desktopDropdownRef}
                    />
                  </div>

                  {/* Search Input (Middle) */}
                  <div className="relative flex-1">
                    <input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search supplements..."
                      className="w-full h-11 px-4 pr-10 focus:outline-none text-neutral-900 placeholder:text-neutral-500 text-sm"
                    />
                    {/* Search Icon (Right) */}
                    <button
                      onClick={() => {
                        if (searchQuery.trim()) {
                          navigate(`/products?search=${searchQuery.trim()}`);
                        }
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                    >
                      <Search className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Right: Products | Admin | Orders | Cart | Login */}
              <div className="flex items-center gap-8 text-white">
                <Link to="/products" className="text-sm font-semibold hover:text-gray-200 transition">
                  Products
                </Link>

                {isAdmin && (
                  <Link to="/admin" className="text-sm font-semibold hover:text-gray-200 transition">
                    Admin
                  </Link>
                )}

                {isAuthenticated && (
                  <Link to="/account/orders" className="text-sm font-semibold hover:text-gray-200 transition">
                    Orders
                  </Link>
                )}

                <Link to="/cart" className="relative hover:text-gray-200 transition">
                  <ShoppingCart className="w-5 h-5" />
                  {cartItemsCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-black rounded-full w-5 h-5 flex items-center justify-center">
                      {cartItemsCount}
                    </span>
                  )}
                </Link>

                {isAuthenticated ? (
                  <button
                    onClick={() => navigate('/account')}
                    className="text-white hover:text-gray-200 transition"
                    title="Go to Account"
                  >
                    <User className="w-5 h-5" />
                  </button>
                ) : (
                  <Link to="/login" className="text-sm font-semibold hover:text-gray-200 transition">
                    Login
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* CATEGORY LINKS ROW */}
        <div className="hidden lg:block bg-teal-900 border-b border-white/10">
          <div className="max-w-[1400px] mx-auto px-8">
            <div className="flex items-center gap-8 h-12 overflow-x-auto no-scrollbar">
              {['PROTEIN', 'CREATINE', 'PRE WORKOUT', 'MASS GAINER', 'VITAMINS', 'FAT BURNER'].map((category) => (
                <Link
                  key={category}
                  to={`/products?category=${category}`}
                  className="text-sm font-bold text-white hover:text-gray-200 transition whitespace-nowrap tracking-wider"
                >
                  {category}
                </Link>
              ))}

              <Link
                to="/#deals-section"
                className="text-sm font-black text-yellow-400 hover:text-yellow-300 transition whitespace-nowrap tracking-widest uppercase italic"
              >
                DEALS
              </Link>
            </div>
          </div>
        </div>

        {/* MOBILE NAV - TEAL BACKGROUND */}
        <div className="lg:hidden bg-teal-900 border-b shadow-sm">
          <div className="px-4">
            {/* Top Bar */}
            <div className="relative flex items-center justify-between h-16">

              {/* Left: Menu Toggle */}
              <button
                onClick={() => setIsMenuOpen(true)}
                className="w-8 h-8 flex items-center justify-center active:scale-90 transition-all"
              >
                <div className="w-5 h-4 flex flex-col justify-between">
                  <span className="h-0.5 w-full bg-white rounded-full" />
                  <span className="h-0.5 w-3/4 bg-white rounded-full" />
                  <span className="h-0.5 w-full bg-white rounded-full" />
                </div>
              </button>

              {/* Center: Logo (ABSOLUTE CENTER) */}
              <Link
                to="/"
                className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 font-bold text-white"
              >
                <img src={saturnLogo} alt="Logo" className="h-20 w-20 object-contain" />
              </Link>

              {/* Right: Icons */}
              <div className="flex items-center gap-2 ml-auto">
                <button
                  onClick={() => navigate('/account')}
                  className="w-8 h-8 flex items-center justify-center text-white hover:bg-white/10 rounded-lg transition"
                  title="Account"
                >
                  <User className="w-5 h-5" />
                </button>

                <Link
                  to="/cart"
                  className="w-8 h-8 flex items-center justify-center relative text-white hover:bg-white/10 rounded-lg transition"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {cartItemsCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-yellow-400 text-teal-700 text-[10px] font-black rounded-full w-5 h-5 flex items-center justify-center">
                      {cartItemsCount}
                    </span>
                  )}
                </Link>
              </div>
            </div>

            {/* Search Bar */}
            <div className="pb-4">
              <div className="relative w-full">
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Type a product name, e.g. Biozyme."
                  className="w-full h-10 px-4 pr-10 bg-gray-200 text-neutral-900 placeholder:text-gray-500 text-sm focus:outline-none rounded-lg"
                />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* MOBILE DRAWER */}
      <div className={`fixed inset-0 z-[100] lg:hidden transition-all duration-500 ${isMenuOpen ? "visible" : "invisible"}`}>
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-neutral-900/50 backdrop-blur-sm transition-opacity duration-500 ${isMenuOpen ? "opacity-100" : "opacity-0"}`}
          onClick={() => setIsMenuOpen(false)}
        />

        {/* Panel */}
        <div className={`absolute left-0 top-0 bottom-0 w-[85%] max-w-[340px] bg-white shadow-2xl transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${isMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-6 bg-teal-900 text-white">
              <div className="flex items-center justify-between mb-8">
                <img src={saturnLogo} alt="Logo" className="h-20 w-20 object-contain" />
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-full active:rotate-90 transition-transform"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div>
                <h3 className="text-lg font-bold">Muscle & Power</h3>
                <p className="text-xs text-neutral-400">Premium Supplements</p>
              </div>
            </div>

            {/* Links */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              <p className="px-4 py-2 text-[10px] font-black text-neutral-400 uppercase tracking-widest">Navigation</p>

              <button
                onClick={() => handleMenuItemClick("/")}
                className={`w-full flex items-center justify-between px-4 py-4 rounded-lg transition-all ${isActive("/") ? "bg-neutral-900 text-white" : "text-neutral-700 hover:bg-neutral-100"}`}
              >
                <span className="font-semibold text-sm">Home</span>
                <ChevronRight className={`w-4 h-4 ${isActive("/") ? "text-teal-600" : "opacity-20"}`} />
              </button>

              <button
                onClick={() => handleMenuItemClick("/products")}
                className={`w-full flex items-center justify-between px-4 py-4 rounded-lg transition-all ${isActive("/products") ? "bg-neutral-900 text-white" : "text-neutral-700 hover:bg-neutral-100"}`}
              >
                <span className="font-semibold text-sm">Products</span>
                <ChevronRight className={`w-4 h-4 ${isActive("/products") ? "text-teal-600" : "opacity-20"}`} />
              </button>

              {isAdmin && (
                <button
                  onClick={() => handleMenuItemClick("/admin")}
                  className={`w-full flex items-center justify-between px-4 py-4 rounded-lg transition-all ${isActive("/admin") ? "bg-neutral-900 text-white" : "text-neutral-700 hover:bg-neutral-100"}`}
                >
                  <span className="font-semibold text-sm">Admin</span>
                  <ChevronRight className={`w-4 h-4 ${isActive("/admin") ? "text-teal-600" : "opacity-20"}`} />
                </button>
              )}

              {isAuthenticated && (
                <button
                  onClick={() => handleMenuItemClick("/account/orders")}
                  className={`w-full flex items-center justify-between px-4 py-4 rounded-lg transition-all ${isActive("/account/orders") ? "bg-neutral-900 text-white" : "text-neutral-700 hover:bg-neutral-100"}`}
                >
                  <span className="font-semibold text-sm">My Orders</span>
                  <ChevronRight className={`w-4 h-4 ${isActive("/account/orders") ? "text-teal-600" : "opacity-20"}`} />
                </button>
              )}

              <div className="h-px bg-neutral-200 my-4" />
              <p className="px-4 py-2 text-[10px] font-black text-neutral-400 uppercase tracking-widest">Account</p>

              {isAuthenticated ? (
                <>
                  <button
                    onClick={() => handleMenuItemClick("/account")}
                    className="w-full flex items-center gap-4 px-4 py-4 rounded-lg text-neutral-700 hover:bg-neutral-100 transition-all"
                  >
                    <div className="w-8 h-8 bg-neutral-100 rounded-lg flex items-center justify-center">
                      <User className="w-4 h-4 text-neutral-700" />
                    </div>
                    <span className="font-semibold text-sm">My Profile</span>
                  </button>
                  <button
                    onClick={() => {
                      logout();
                      handleMenuItemClick("/");
                    }}
                    className="w-full flex items-center gap-4 px-4 py-4 rounded-lg text-red-600 hover:bg-red-50 transition-all"
                  >
                    <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
                      <LogOut className="w-4 h-4 text-red-600" />
                    </div>
                    <span className="font-semibold text-sm">Logout</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => handleMenuItemClick("/login")}
                  className="w-full flex items-center gap-4 px-4 py-4 rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 transition-all"
                >
                  <div className="w-8 h-8 bg-neutral-800 rounded-lg flex items-center justify-center">
                    <User className="w-4 h-4" />
                  </div>
                  <span className="font-semibold text-sm">Sign In</span>
                </button>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 text-center bg-neutral-50 border-t border-neutral-200">
              <p className="text-xs text-neutral-500">© 2024 ProFit. All rights reserved.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
