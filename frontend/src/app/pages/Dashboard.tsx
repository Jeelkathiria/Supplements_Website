import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Package,
  MapPin,
  LogOut,
  Plus,
  Trash2,
  RefreshCcw,
  Phone,
  Mail,
} from "lucide-react";
import { Address } from "../types";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { PRODUCTS } from "../data/products";

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { addToCart } = useCart();

  const [activeTab, setActiveTab] = useState<
    "profile" | "orders" | "addresses"
  >("profile");

  const [addresses, setAddresses] = useState<Address[]>([
    {
      id: "1",
      fullName: "John Doe",
      street: "123 Fitness Street",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400001",
      phone: "+91 9876543210",
      isDefault: true,
    },
  ]);

  const orders = [
    {
      id: "ORD001",
      date: "2025-01-15",
      status: "delivered",
      items: [
        {
          productId: "1",
          name: "Premium Whey Protein Isolate",
          qty: 1,
          price: 2499,
        },
      ],
    },
  ];

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/");
  };

  const deleteAddress = (id: string) => {
    setAddresses((prev) => prev.filter((a) => a.id !== id));
    toast.success("Address deleted");
  };

  const handleReorder = (items: any[]) => {
    items.forEach((item) => {
      const product = PRODUCTS.find(
        (p) => p.id === item.productId,
      );
      if (product) addToCart(product, item.qty);
    });

    toast.success("Items added to cart");
    navigate("/cart");
  };

  return (
    <div className="min-h-screen bg-neutral-50 py-6 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6">
          My Account
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* SIDEBAR / MOBILE TABS */}
          <aside className="bg-white border border-neutral-200 rounded-xl p-2 lg:p-4">
            <nav className="flex lg:flex-col gap-2 overflow-x-auto no-scrollbar">
              {[
                {
                  key: "profile",
                  label: "Profile",
                  icon: User,
                },
                {
                  key: "orders",
                  label: "Orders",
                  icon: Package,
                },
                {
                  key: "addresses",
                  label: "Addresses",
                  icon: MapPin,
                },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as any)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                    activeTab === key
                      ? "bg-neutral-900 text-white"
                      : "text-neutral-700 hover:bg-neutral-100"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </nav>
          </aside>

          {/* CONTENT */}
          <section className="lg:col-span-3 space-y-6">
            {/* PROFILE */}
            {activeTab === "profile" && (
              <div className="bg-white border border-neutral-200 rounded-xl p-6 space-y-4">
                <h2 className="text-xl font-bold">
                  Profile Information
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InfoCard
                    icon={User}
                    label="Name"
                    value={user?.name || "Not set"}
                  />
                  <InfoCard
                    icon={Mail}
                    label="Email"
                    value={user?.email || "Not set"}
                  />
                  <InfoCard
                    icon={Phone}
                    label="Mobile Number"
                    value={user?.phone || "+91 XXXXXXXX"}
                  />
                </div>
              </div>
            )}

            {/* ORDERS */}
            {activeTab === "orders" && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold">
                  Order History
                </h2>

                {orders.map((order) => {
                  const total = order.items.reduce(
                    (sum, i) => sum + i.price * i.qty,
                    0,
                  );

                  return (
                    <div
                      key={order.id}
                      className="bg-white border border-neutral-200 rounded-xl p-5 space-y-4"
                    >
                      <div className="flex justify-between">
                        <div>
                          <p className="font-medium">
                            Order #{order.id}
                          </p>
                          <p className="text-sm text-neutral-600">
                            {order.date}
                          </p>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold capitalize
                            ${order.status === "delivered" && "bg-emerald-100 text-emerald-700"}
                            ${order.status === "shipped" && "bg-blue-100 text-blue-700"}
                            ${order.status === "processing" && "bg-amber-100 text-amber-700"}
                            ${order.status === "cancelled" && "bg-red-100 text-red-700"}
                          `}
                        >
                          {order.status}
                        </span>
                      </div>

                      <div className="text-sm text-neutral-700">
                        {order.items.map((item, idx) => (
                          <p key={idx}>
                            {item.name} × {item.qty}
                          </p>
                        ))}
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t">
                        <p className="font-bold">
                          Total: ₹{total}
                        </p>
                        <button
                          onClick={() =>
                            handleReorder(order.items)
                          }
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-lg text-sm"
                        >
                          <RefreshCcw className="w-4 h-4" />
                          Reorder
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ADDRESSES */}
            {activeTab === "addresses" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold">
                    Saved Addresses
                  </h2>
                  <button className="flex items-center gap-2 bg-neutral-900 text-white px-4 py-2 rounded-lg text-sm">
                    <Plus className="w-4 h-4" />
                    Add New
                  </button>
                </div>

                {addresses.map((address) => (
                  <div
                    key={address.id}
                    className="bg-white border border-neutral-200 rounded-xl p-5 flex justify-between gap-4"
                  >
                    <div className="text-sm">
                      <p className="font-medium">
                        {address.fullName}
                      </p>
                      <p className="text-neutral-600">
                        {address.street}, {address.city}
                      </p>
                      <p className="text-neutral-600">
                        {address.state} – {address.pincode}
                      </p>
                      <p className="text-neutral-600">
                        {address.phone}
                      </p>
                    </div>

                    <button
                      onClick={() => deleteAddress(address.id)}
                      className="text-red-600 hover:bg-red-50 p-2 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

/* SMALL HELPER COMPONENT */
const InfoCard = ({ icon: Icon, label, value }: any) => (
  <div className="border rounded-lg p-4 flex gap-3 items-start">
    <Icon className="w-5 h-5 text-neutral-600" />
    <div>
      <p className="text-sm text-neutral-500">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  </div>
);