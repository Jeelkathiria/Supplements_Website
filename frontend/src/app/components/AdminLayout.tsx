import React, { useState } from "react";
import {
  Package,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  Video,
  RotateCcw,
  Gift,
} from "lucide-react";

type OrderStatus = "pending" | "shipped" | "delivered" | "all" ;
type AdminSection = "products" | "orders" | "cancellations" | "cancelled-orders" | "refunds" | "coupons";
type CancellationType = "all" | "after-delivery" | "pre-delivery";

interface AdminLayoutProps {
  children: React.ReactNode;
  activeSection: AdminSection;
  activeCancellationType?: CancellationType;
  onCancellationTypeChange?: (type: CancellationType) => void;
  activeOrderStatus?: OrderStatus;
  onSectionChange: (section: AdminSection) => void;
  onOrderStatusChange?: (status: OrderStatus) => void;
  pendingPreDeliveryCount?: number;
  pendingPostDeliveryCount?: number;
  pendingAllCancellationsCount?: number;
  pendingOrdersCount?: number;
}

/* =====================================================
   ADMIN LAYOUT (NAMED EXPORT)
===================================================== */

export function AdminLayout({
  children,
  activeSection,
  activeCancellationType = "all",
  onCancellationTypeChange,
  activeOrderStatus = "all",
  onSectionChange,
  onOrderStatusChange,
  pendingPreDeliveryCount = 0,
  pendingPostDeliveryCount = 0,
  pendingAllCancellationsCount = 0,
  pendingOrdersCount = 0,
}: AdminLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-neutral-50">
      {/* SIDEBAR - MODERN DESIGN FOR LAPTOP */}
      <aside
        className={`relative hidden lg:flex flex-col transition-all duration-300 ease-in-out
        ${collapsed ? "w-[80px]" : "w-[280px]"}
        bg-gradient-to-b from-neutral-900 to-neutral-950
        border-r border-emerald-600/20
        shadow-2xl`}
      >
        {/* Collapse Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-4 top-8 z-20
                     h-8 w-8 rounded-full
                     bg-emerald-600 hover:bg-emerald-700
                     border-2 border-neutral-900
                     flex items-center justify-center
                     text-white
                     shadow-lg transition-all"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        {/* Logo */}
        <div className="flex items-center justify-center gap-3 px-4 py-8 border-b border-emerald-600/20">
          <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center font-bold text-white text-lg shadow-lg">
            S
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white">Saturn</span>
              <span className="text-xs text-emerald-400">Admin Panel</span>
            </div>
          )}
        </div>

        {/* NAV */}
        <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">

          {/* Orders */}
          <NavItem
            icon={<ShoppingCart size={20} />}
            label="Orders"
            collapsed={collapsed}
            active={activeSection === "orders"}
            onClick={() => {
              onSectionChange("orders");
              onOrderStatusChange?.("pending");
            }}
          />

          {/* Order Status - Always Visible */}
          {!collapsed && (
            <div className={`mt-3 space-y-1 border-l-2 border-emerald-600/30 pl-4`}>
              {["pending", "shipped", "delivered", "all"].map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    onSectionChange("orders");
                    onOrderStatusChange?.(status as OrderStatus);
                  }}
                  className={`flex items-center justify-between w-full rounded-lg px-3 py-2 text-xs font-medium transition
                    ${
                      activeSection === "orders" && activeOrderStatus === status
                        ? "bg-emerald-600/30 text-emerald-300 border-l-2 border-emerald-500"
                        : "text-neutral-400 hover:text-emerald-300 hover:bg-neutral-800/50"
                    }`}
                >
                  <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
                  {status === "pending" && pendingOrdersCount > 0 && (
                    <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-red-500 text-white text-xs font-bold">
                      {pendingOrdersCount}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Cancellations */}
          <NavItem
            icon={<Video size={20} />}
            label="Cancell Requests"
            collapsed={collapsed}
            active={activeSection === "cancellations"}
            onClick={() => {
              onSectionChange("cancellations");
              onCancellationTypeChange?.("all");
            }}
          />

          {/* Cancellation Type Submenu - Always Visible */}
          {!collapsed && (
            <div className={`mt-3 space-y-1 border-l-2 border-blue-600/30 pl-4`}>
              {[
                { key: "all" as CancellationType, label: "All", count: pendingAllCancellationsCount },
                { key: "pre-delivery" as CancellationType, label: "Pre-Delivery", count: pendingPreDeliveryCount },
                { key: "after-delivery" as CancellationType, label: "Post-Delivery", count: pendingPostDeliveryCount },
              ].map((type) => (
                <button
                  key={type.key}
                  onClick={() => {
                    onSectionChange("cancellations");
                    onCancellationTypeChange?.(type.key);
                  }}
                  className={`flex items-center justify-between w-full rounded-lg px-3 py-2 text-xs font-medium transition
                    ${
                      activeSection === "cancellations" && activeCancellationType === type.key
                        ? "bg-blue-600/30 text-blue-300 border-l-2 border-blue-500"
                        : "text-neutral-400 hover:text-blue-300 hover:bg-neutral-800/50"
                    }`}
                >
                  <span>{type.label}</span>
                  {type.count > 0 && (
                    <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-red-500 text-white text-xs font-bold">
                      {type.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Cancelled Orders */}
          <NavItem
            icon={<ShoppingCart size={20} />}
            label="Cancelled Orders"
            collapsed={collapsed}
            active={activeSection === "cancelled-orders"}
            onClick={() => onSectionChange("cancelled-orders")}
          />

          {/* Refund Status */}
          <NavItem
            icon={<RotateCcw size={20} />}
            label="Refund Status"
            collapsed={collapsed}
            active={activeSection === "refunds"}
            onClick={() => onSectionChange("refunds")}
          />

          {/* Coupons */}
          <NavItem
            icon={<Gift size={20} />}
            label="Coupons"
            collapsed={collapsed}
            active={activeSection === "coupons"}
            onClick={() => onSectionChange("coupons")}
          />

          {/* Products */}
          <NavItem
            icon={<Package size={20} />}
            label="Products"
            collapsed={collapsed}
            active={activeSection === "products"}
            onClick={() => onSectionChange("products")}
          />
        </nav>

        {/* Footer */}
        {!collapsed && (
          <div className="px-4 py-4 border-t border-emerald-600/20">
            <p className="text-xs text-neutral-500 text-center">Saturn Imports © 2024</p>
          </div>
        )}
      </aside>

      {/* MOBILE NAVBAR - HORIZONTAL */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-gradient-to-r from-neutral-900 to-neutral-950 border-b border-emerald-600/20 shadow-lg">
        <div className="flex items-center overflow-x-auto px-4 py-3 space-x-2">
          <MobileTab label="Products" icon={<Package size={18} />} active={activeSection === "products"} onClick={() => onSectionChange("products")} />
          <MobileTab label="Orders" icon={<ShoppingCart size={18} />} active={activeSection === "orders"} onClick={() => onSectionChange("orders")} />
          <MobileTab label="Cancellations" icon={<Video size={18} />} active={activeSection === "cancellations"} onClick={() => onSectionChange("cancellations")} />
          <MobileTab label="Refunds" icon={<RotateCcw size={18} />} active={activeSection === "refunds"} onClick={() => onSectionChange("refunds")} />
          <MobileTab label="Coupons" icon={<Gift size={18} />} active={activeSection === "coupons"} onClick={() => onSectionChange("coupons")} />
        </div>
      </div>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto p-6 lg:p-8 pt-20 lg:pt-6">
        {children}
      </main>
    </div>
  );
}

/* =====================================================
   NAV ITEM (Desktop Sidebar)
===================================================== */

function NavItem({
  icon,
  label,
  collapsed,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  collapsed: boolean;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`group relative flex w-full items-center gap-3 rounded-lg px-3 py-2 transition
        ${
          active
            ? "bg-emerald-600/30 text-emerald-300 shadow-md"
            : "text-neutral-400 hover:bg-neutral-800/50 hover:text-emerald-300"
        }`}
    >
      {icon}
      {!collapsed && (
        <span className="text-sm font-medium">{label}</span>
      )}

      {/* Tooltip when collapsed */}
      {collapsed && (
        <span
          className="pointer-events-none absolute left-[72px] whitespace-nowrap
                     rounded-md bg-emerald-600 px-2 py-1 text-xs text-white font-medium
                     opacity-0 group-hover:opacity-100 transition-opacity z-50"
        >
          {label}
        </span>
      )}
    </button>
  );
}

/* =====================================================
   MOBILE TAB (Mobile Navbar)
===================================================== */

function MobileTab({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition whitespace-nowrap
        ${
          active
            ? "bg-emerald-600/30 text-emerald-300"
            : "text-neutral-400 hover:text-emerald-300 hover:bg-neutral-800/50"
        }`}
    >
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}
