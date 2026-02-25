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
  X
} from "lucide-react";

import { useCart } from "./context/CartContext";
import { useAuth } from "./context/AuthContext";
import { CategoryDropdown } from "./CategoryDropdown";
import saturnLogo from "../../images/Gemini_Generated_Image_p3uqyop3uqyop3uq.png";

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
    `text-sm transition relative pb-1 text-white ${isActive(path)
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
      <nav className="sticky top-0 z-50 transition-all duration-300">
        {/* DESKTOP NAV - UNTOUCHED */}
        <div className="hidden lg:block bg-teal-900 border-b shadow-sm">
          <div className="max-w-[1400px] mx-auto px-8">
            <div className="flex items-center justify-between h-16 gap-2">
              <Link to="/" className="flex items-center flex-shrink-0 hover:opacity-90 transition">
                <img
                  src={saturnLogo}
                  alt="Saturn Imports"
                  className="h-12 w-12 object-contain"
                />
              </Link>

              {/* DESKTOP SEARCH */}
              <div className="flex flex-1 mx-8 max-w-[760px]">
                <div className="flex w-full border border-white/20 rounded-2xl overflow-hidden">
                  <div className="basis-[120px] shrink-0">
                    <CategoryDropdown
                      isOpen={desktopOpen}
                      setIsOpen={setDesktopOpen}
                      selectedCategory={selectedCategory}
                      onSelect={handleCategorySelect}
                      dropdownRef={desktopDropdownRef}
                    />
                  </div>

                  <div className="relative flex-1 bg-white">
                    <input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search supplements..."
                      className="w-full h-11 px-4 pr-10 focus:outline-none text-neutral-900 placeholder:text-neutral-400"
                    />
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  </div>
                </div>
              </div>

              {/* DESKTOP LINKS */}
              <div className="flex items-center gap-6">
                <Link to="/" className={navLinkClass("/")}>Home</Link>
                <Link to="/products" className={navLinkClass("/products")}>Products</Link>
                {isAuthenticated && <Link to="/account" className={navLinkClass("/account")}>Orders</Link>}
                {isAdmin && <Link to="/admin" className={navLinkClass("/admin")}>Admin</Link>}

                <Link to="/cart" className="relative text-white hover:text-neutral-200 transition">
                  <ShoppingCart className="w-5 h-5" />
                  {cartItemsCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-black text-white text-[10px] rounded-full px-1.5 py-0.5">
                      {cartItemsCount}
                    </span>
                  )}
                </Link>

                {isAuthenticated ? (
                  <div className="flex items-center gap-4">
                    <Link to="/account" title="My Account" className="text-white hover:text-neutral-200 transition">
                      <User className="w-5 h-5" />
                    </Link>
                    <button
                      onClick={() => { logout(); navigate('/'); }}
                      className="text-white hover:text-neutral-200 transition"
                    >
                      <LogOut className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <Link to="/login" className="text-white hover:text-neutral-200 transition">
                    <User className="w-5 h-5" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* MOBILE NAV - PREMIUM REDESIGN */}
        <div className="lg:hidden bg-[#003D45] border-b border-white/5 shadow-lg">
          <div className="px-4">
            {/* Top Bar */}
            <div className="flex items-center justify-between h-16">
              {/* Left: Menu Toggle */}
              <button
                onClick={() => setIsMenuOpen(true)}
                className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-xl active:scale-90 transition-all border border-white/10"
              >
                <div className="w-5 h-4 flex flex-col justify-between">
                  <span className="h-0.5 w-full bg-white rounded-full" />
                  <span className="h-0.5 w-3/4 bg-white rounded-full" />
                  <span className="h-0.5 w-full bg-white rounded-full" />
                </div>
              </button>

              {/* Center: Logo */}
              <Link to="/" className="flex items-center gap-2">
                <img src={saturnLogo} alt="Logo" className="h-9 w-9 object-contain" />
                <span className="text-white font-black text-sm tracking-tighter uppercase italic">
                  SATURN<span className="text-teal-400 not-italic">IMPORTS</span>
                </span>
              </Link>

              {/* Right: Cart */}
              <Link
                to="/cart"
                className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-xl active:scale-90 transition-all border border-white/10 relative"
              >
                <ShoppingCart className="w-5 h-5 text-white" />
                {cartItemsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-teal-400 text-[#003D45] text-[10px] font-black rounded-full w-5 h-5 flex items-center justify-center border-2 border-[#003D45] animate-in zoom-in">
                    {cartItemsCount}
                  </span>
                )}
              </Link>
            </div>

            {/* Bottom: Search Bar */}
            <div className="pb-4">
              <div className="flex gap-2 bg-white/10 p-1 rounded-[1.25rem] border border-white/10 group focus-within:bg-white/15 transition-all">
                <div className="basis-[75px] shrink-0">
                  <CategoryDropdown
                    isOpen={mobileOpen}
                    setIsOpen={setMobileOpen}
                    selectedCategory={selectedCategory}
                    onSelect={handleCategorySelect}
                    dropdownRef={mobileDropdownRef}
                    rounded="rounded-xl"
                    transparent
                  />
                </div>
                <div className="relative flex-1">
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search elite nutrition..."
                    className="w-full h-10 px-3 pr-10 bg-transparent text-white placeholder:text-white/40 text-xs font-bold focus:outline-none"
                  />
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* MOBILE DRAWER */}
      <div className={`fixed inset-0 z-[100] lg:hidden transition-all duration-500 ${isMenuOpen ? "visible" : "invisible"}`}>
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-[#001A1D]/80 backdrop-blur-md transition-opacity duration-500 ${isMenuOpen ? "opacity-100" : "opacity-0"}`}
          onClick={() => setIsMenuOpen(false)}
        />

        {/* Panel */}
        <div className={`absolute left-0 top-0 bottom-0 w-[85%] max-w-[340px] bg-white shadow-2xl transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${isMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-6 bg-[#003D45] text-white">
              <div className="flex items-center justify-between mb-8">
                <img src={saturnLogo} alt="Logo" className="h-10 w-10 ring-4 ring-white/10 rounded-full" />
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-full active:rotate-90 transition-transform"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">Welcome to</p>
                <h3 className="text-xl font-black tracking-tighter uppercase italic">
                  SATURN<span className="text-teal-400 not-italic">IMPORTS</span>
                </h3>
              </div>
            </div>

            {/* Links */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              <p className="px-4 py-2 text-[10px] font-black text-[#003D45]/40 uppercase tracking-widest">Navigation</p>

              <button
                onClick={() => handleMenuItemClick("/")}
                className={`w-full flex items-center justify-between px-4 py-4 rounded-2xl transition-all ${isActive("/") ? "bg-[#003D45] text-white shadow-lg" : "text-[#003D45] hover:bg-[#003D45]/5"}`}
              >
                <span className="font-black text-sm">Dashboard</span>
                <ChevronRight className={`w-4 h-4 ${isActive("/") ? "text-teal-400" : "opacity-20"}`} />
              </button>

              <button
                onClick={() => handleMenuItemClick("/products")}
                className={`w-full flex items-center justify-between px-4 py-4 rounded-2xl transition-all ${isActive("/products") ? "bg-[#003D45] text-white shadow-lg" : "text-[#003D45] hover:bg-[#003D45]/5"}`}
              >
                <span className="font-black text-sm">Products</span>
                <ChevronRight className={`w-4 h-4 ${isActive("/products") ? "text-teal-400" : "opacity-20"}`} />
              </button>

              {isAuthenticated && (
                <button
                  onClick={() => handleMenuItemClick("/account")}
                  className={`w-full flex items-center justify-between px-4 py-4 rounded-2xl transition-all ${isActive("/account") ? "bg-[#003D45] text-white shadow-lg" : "text-[#003D45] hover:bg-[#003D45]/5"}`}
                >
                  <span className="font-black text-sm">Tracking & Orders</span>
                  <ChevronRight className={`w-4 h-4 ${isActive("/account") ? "text-teal-400" : "opacity-20"}`} />
                </button>
              )}

              <div className="h-px bg-neutral-100 my-4" />
              <p className="px-4 py-2 text-[10px] font-black text-[#003D45]/40 uppercase tracking-widest">Account Profile</p>

              {isAuthenticated ? (
                <>
                  <button
                    onClick={() => handleMenuItemClick("/account")}
                    className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-[#003D45] hover:bg-[#003D45]/5 transition-all"
                  >
                    <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center">
                      <User className="w-4 h-4 text-[#003D45]" />
                    </div>
                    <span className="font-black text-sm">Profile Details</span>
                  </button>
                  <button
                    onClick={() => { logout(); setIsMenuOpen(false); navigate('/'); }}
                    className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-rose-500 hover:bg-rose-50 transition-all mt-4"
                  >
                    <div className="w-8 h-8 bg-rose-50 rounded-lg flex items-center justify-center">
                      <LogOut className="w-4 h-4" />
                    </div>
                    <span className="font-black text-sm uppercase tracking-tighter">Secure Logout</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => handleMenuItemClick("/login")}
                  className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-[#003D45] border-2 border-[#003D45]/10 hover:bg-[#003D45]/5 transition-all"
                >
                  <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center">
                    <User className="w-4 h-4 text-[#003D45]" />
                  </div>
                  <span className="font-black text-sm">Sign In / Join Now</span>
                </button>
              )}
            </div>

            {/* Footer */}
            <div className="p-8 text-center bg-neutral-50 border-t border-neutral-100">
              <p className="text-[9px] font-black text-[#003D45]/30 uppercase tracking-[0.3em]">Elite Supplement Gear</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
