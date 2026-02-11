import React, { useState } from "react";
import {
  Package,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  Video,
  RotateCcw,
} from "lucide-react";

type OrderStatus = "all" | "pending" | "shipped" | "delivered" | "cancelled";
type AdminSection = "products" | "orders" | "cancellations" | "refunds";

interface AdminLayoutProps {
  children: React.ReactNode;
  activeSection: AdminSection;
  activeOrderStatus?: OrderStatus;
  onSectionChange: (section: AdminSection) => void;
  onOrderStatusChange?: (status: OrderStatus) => void;
}

/* =====================================================
   ADMIN LAYOUT (NAMED EXPORT)
===================================================== */

export function AdminLayout({
  children,
  activeSection,
  activeOrderStatus = "all",
  onSectionChange,
  onOrderStatusChange,
}: AdminLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-neutral-100">
      {/* SIDEBAR */}
      <aside
        className={`relative flex flex-col transition-all duration-300 ease-in-out
        ${collapsed ? "w-[72px]" : "w-[260px]"}
        backdrop-blur-md
        bg-white/70
        border-r border-neutral-200
        shadow-lg`}
      >
        {/* Collapse Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-6 z-20
                     h-7 w-7 rounded-full
                     bg-white
                     border border-neutral-300
                     flex items-center justify-center
                     text-neutral-700 hover:bg-neutral-100
                     shadow-md"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-6">
          <div className="h-10 w-10 rounded-xl bg-emerald-600 flex items-center justify-center font-bold text-white">
            A
          </div>
          {!collapsed && (
           <span className="text-[15px] font-semibold">
            <span className="text-neutral-900">Saturn</span>
            <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
              Imports
            </span>
          </span>
          )}
        </div>

        {/* NAV */}
        <nav className="flex-1 px-3 space-y-1">

          {/* Orders */}
          <NavItem
            icon={<ShoppingCart size={18} />}
            label="Orders"
            collapsed={collapsed}
            active={activeSection === "orders"}
            onClick={() => onSectionChange("orders")}
          />

          {/* Order Status */}
          {activeSection === "orders" && !collapsed && (
            <div className="ml-9 mt-2 space-y-1 border-l border-neutral-200 pl-3">
              {["all", "pending", "shipped", "delivered", "cancelled"].map((status) => (
                <button
                  key={status}
                  onClick={() =>
                    onOrderStatusChange?.(status as OrderStatus)
                  }
                  className={`block w-full rounded-md px-3 py-2 text-sm transition
                    ${
                      activeOrderStatus === status
                        ? "bg-emerald-100 text-emerald-700 font-medium"
                        : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                    }`}
                >
                  {status.toUpperCase()}
                </button>
              ))}
            </div>
          )}

          {/* Cancellations */}
          <NavItem
            icon={<Video size={18} />}
            label="Cancellations"
            collapsed={collapsed}
            active={activeSection === "cancellations"}
            onClick={() => onSectionChange("cancellations")}
          />

          {/* Refunds */}
          <NavItem
            icon={<RotateCcw size={18} />}
            label="Refund Status"
            collapsed={collapsed}
            active={activeSection === "refunds"}
            onClick={() => onSectionChange("refunds")}
          />

          {/* Products */}
          <NavItem
            icon={<Package size={18} />}
            label="Products"
            collapsed={collapsed}
            active={activeSection === "products"}
            onClick={() => onSectionChange("products")}
          />
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto p-6">
        {children}
      </main>
    </div>
  );
}

/* =====================================================
   NAV ITEM
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
      className={`group flex w-full items-center gap-3 rounded-xl px-3 py-3 transition
        ${
          active
            ? "bg-emerald-100 text-emerald-700"
            : "text-neutral-700 hover:bg-neutral-100"
        }`}
    >
      {icon}
      {!collapsed && (
        <span className="text-sm font-medium">{label}</span>
      )}

      {/* Tooltip when collapsed */}
      {collapsed && (
        <span
          className="pointer-events-none absolute left-[84px] whitespace-nowrap
                     rounded-md bg-neutral-900 px-2 py-1 text-xs text-white
                     opacity-0 group-hover:opacity-100 transition"
        >
          {label}
        </span>
      )}
    </button>
  );
}
