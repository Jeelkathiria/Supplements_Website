import React, { useState, useEffect } from "react";
import { ChevronDown, AlertCircle, Package, Truck, DollarSign, Search, X, Mail, Phone, MapPin, CreditCard } from "lucide-react";
import { toast } from "sonner";
import {
  getAllOrders,
  updateOrderStatus,
  Order,
  OrderItem,
} from "../../services/adminOrderService";
import { useAuth } from "./context/AuthContext";

// Helper function to get full image URL
const getFullImageUrl = (imageUrl: string) => {
  if (!imageUrl) return '/placeholder.png';
  if (imageUrl.startsWith('http')) return imageUrl;
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const backendBase = apiBase.replace('/api', '');
  return `${backendBase}${imageUrl}`;
};

const ORDER_STATUSES = ["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"];

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  PAID: "bg-blue-100 text-blue-800",
  SHIPPED: "bg-purple-100 text-purple-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrderForModal, setSelectedOrderForModal] = useState<Order | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const CARDS_PER_PAGE = 12; // 3 cards × 4 rows
  const { firebaseUser } = useAuth();

  useEffect(() => {
    // Only load orders once the user is authenticated
    if (firebaseUser) {
      loadOrders();
    } else if (!isLoading) {
      // If we've finished loading but no user, set isLoading to false
      setIsLoading(false);
    }
  }, [firebaseUser]);

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      const data = await getAllOrders();
      setOrders(data);
    } catch (error) {
      console.error("Error loading orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      setUpdatingOrderId(orderId);
      const updated = await updateOrderStatus(orderId, newStatus);

      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status: updated.status } : order
        )
      );

      toast.success("Order status updated successfully");
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error("Failed to update order status");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-neutral-600">Loading orders...</div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="mb-4 h-12 w-12 text-neutral-400" />
        <p className="text-neutral-600">No orders found</p>
      </div>
    );
  }

  // Filter orders based on search query
  const filteredOrders = orders.filter((order) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      order.id.toLowerCase().includes(searchLower) ||
      order.address?.name.toLowerCase().includes(searchLower) ||
      order.address?.phone.includes(searchQuery) ||
      order.totalAmount.toString().includes(searchQuery)
    );
  });

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
        <input
          type="text"
          placeholder="Search by Order ID, Customer Name, Phone or Amount..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-10 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Results counter */}
      <div className="text-sm text-neutral-600">
        Showing {filteredOrders.length} of {orders.length} orders
      </div>

      {/* Orders Grid */}
      <div className="bg-gradient-to-br from-neutral-50 to-neutral-100 p-4 rounded-xl space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-8 text-neutral-600">
            No orders match your search
          </div>
        ) : (
          <>
            {/* Orders Grid - 3 columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredOrders
                .slice((currentPage - 1) * CARDS_PER_PAGE, currentPage * CARDS_PER_PAGE)
                .map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-neutral-200"
            >
              {/* ORDER HEADER */}
              <div className="px-4 py-3 border-b border-neutral-200">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-bold text-base text-neutral-900">Order #{order.id.slice(0, 8).toUpperCase()}</h3>
                    <p className="text-xs text-neutral-600">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', { 
                        month: 'short', 
                        day: '2-digit', 
                        year: 'numeric' 

                      })} • {new Date(order.createdAt).toLocaleTimeString('en-IN', { 
                        hour: '2-digit', 
                        minute: '2-digit',
                        hour12: true
                      })}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${
                      STATUS_COLORS[order.status] || "bg-neutral-100"
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
              </div>

              {/* CUSTOMER INFO */}
              <div className="px-4 py-3 border-b border-neutral-200">
                <h4 className="font-bold text-sm text-neutral-900 mb-2">{order.address?.name || "N/A"}</h4>
                <div className="space-y-1 text-xs text-neutral-600">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3 h-3" />
                    <span className="truncate">{order.user?.email || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3 h-3" />
                    <span>{order.address?.phone || "N/A"}</span>
                  </div>
                </div>
              </div>

              {/* DELIVERY ADDRESS */}
              <div className="px-4 py-3 border-b border-neutral-200">
                <div className="flex items-start gap-2">
                  <MapPin className="w-3 h-3 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-neutral-600">
                    <p className="line-clamp-1">{order.address?.address || "N/A"}</p>
                    <p className="line-clamp-1">{order.address?.city || "N/A"}, {order.address?.state || ""} {order.address?.pincode || "N/A"}</p>
                  </div>
                </div>
              </div>

              {/* PRODUCTS */}
              <div className="px-4 py-3 border-b border-neutral-200">
                <h4 className="font-bold text-sm text-neutral-900 mb-2">Products ({order.items.length})</h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {order.items.map((item: OrderItem) => (
                    <div key={item.id} className="flex items-start gap-2 pb-2 border-b border-neutral-100 last:border-0">
                      {/* Product Image */}
                      {item.product.imageUrls[0] && (
                        <img
                          src={getFullImageUrl(item.product.imageUrls[0])}
                          alt={item.product.name}
                          className="w-10 h-10 rounded object-cover border border-neutral-200 flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-neutral-900 text-xs line-clamp-1">{item.product.name}</p>
                        <p className="text-xs text-neutral-600 line-clamp-1">
                          {item.flavor && `${item.flavor}`}
                          {item.flavor && item.size && ' • '}
                          {item.size && `${item.size}`}
                        </p>
                        <p className="text-xs text-neutral-700 mt-0.5">
                          {item.quantity}× ₹{item.price}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-neutral-900 text-xs">₹{(item.quantity * item.price).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* PAYMENT METHOD */}
              <div className="px-4 py-2 border-b border-neutral-200">
                <div className="flex items-center gap-2 text-xs">
                  <CreditCard className="w-3 h-3" />
                  <span className="text-neutral-600">Credit Card</span>
                </div>
              </div>

              {/* TOTAL AMOUNT */}
              <div className="px-4 py-3 bg-neutral-50 border-b border-neutral-200">
                <div className="flex justify-between items-baseline">
                  <span className="text-neutral-600 text-xs">Total Amount</span>
                  <span className="text-xl font-bold text-neutral-900">₹{order.totalAmount.toFixed(2)}</span>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="px-4 py-2.5 flex items-center justify-between gap-2">
                <div className="flex-1">
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                    disabled={updatingOrderId === order.id}
                    className="w-full px-2 py-1.5 border border-neutral-300 rounded text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {ORDER_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => setSelectedOrderForModal(order)}
                  className="px-4 py-1.5 bg-teal-900 border border-neutral-300 rounded font-medium text-xs text-white hover:bg-teal-700 transition whitespace-nowrap"
                >
                  View Details
                </button>
              </div>
            </div>
              ))}
            </div>

            {/* Pagination */}
            {filteredOrders.length > CARDS_PER_PAGE && (
              <div className="flex items-center justify-between pt-4">
                <div className="text-xs text-neutral-600">
                  Showing {(currentPage - 1) * CARDS_PER_PAGE + 1} to {Math.min(currentPage * CARDS_PER_PAGE, filteredOrders.length)} of {filteredOrders.length} orders
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 border border-neutral-300 rounded text-xs font-medium hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Previous
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.ceil(filteredOrders.length / CARDS_PER_PAGE) }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 rounded text-xs font-medium transition ${
                          currentPage === page
                            ? 'bg-teal-900 text-white shadow-md'
                            : 'border border-neutral-300 hover:bg-neutral-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredOrders.length / CARDS_PER_PAGE), prev + 1))}
                    disabled={currentPage === Math.ceil(filteredOrders.length / CARDS_PER_PAGE)}
                    className="px-3 py-1.5 border border-neutral-300 rounded text-xs font-medium hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* MODAL - Order Details */}
      {selectedOrderForModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-neutral-900">
                ORD-{selectedOrderForModal.id.slice(0, 8).toUpperCase()}
              </h2>
              <button
                onClick={() => setSelectedOrderForModal(null)}
                className="p-1 hover:bg-neutral-100 rounded-lg transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="px-6 py-4 space-y-6">
              {/* Order Header */}
              <div>
                <p className="text-sm text-neutral-600 mb-1">
                  {new Date(selectedOrderForModal.createdAt).toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: '2-digit', 
                    year: 'numeric' 
                  })} • {new Date(selectedOrderForModal.createdAt).toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: true
                  })}
                </p>
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${
                    STATUS_COLORS[selectedOrderForModal.status] || "bg-neutral-100"
                  }`}
                >
                  {selectedOrderForModal.status}
                </span>
              </div>

              {/* Customer Info */}
              <div>
                <h3 className="font-bold text-neutral-900 mb-3">{selectedOrderForModal.address?.name || "N/A"}</h3>
                <div className="space-y-2 text-sm text-neutral-600">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 flex-shrink-0" />
                    <span>{selectedOrderForModal.user?.email || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 flex-shrink-0" />
                    <span>{selectedOrderForModal.address?.phone || "N/A"}</span>
                  </div>
                </div>
              </div>

              {/* Delivery Address */}
              <div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0 mt-1" />
                  <div className="text-sm">
                    <p className="font-semibold text-neutral-900">{selectedOrderForModal.address?.address || "N/A"}</p>
                    <p className="text-neutral-600">{selectedOrderForModal.address?.city || "N/A"}, {selectedOrderForModal.address?.state || ""} {selectedOrderForModal.address?.pincode || "N/A"}</p>
                  </div>
                </div>
              </div>

              {/* Products */}
              <div>
                <h4 className="font-bold text-neutral-900 mb-3">Products ({selectedOrderForModal.items.length})</h4>
                <div className="space-y-3">
                  {selectedOrderForModal.items.map((item: OrderItem) => (
                    <div key={item.id} className="flex gap-3 pb-3 border-b border-neutral-100 last:border-0">
                      {item.product.imageUrls[0] && (
                        <img
                          src={getFullImageUrl(item.product.imageUrls[0])}
                          alt={item.product.name}
                          className="w-16 h-16 rounded object-cover border border-neutral-200 flex-shrink-0"
                        />
                      )}
                      <div className="flex-1">
                        <p className="font-semibold text-neutral-900">{item.product.name}</p>
                        <p className="text-xs text-neutral-600 mt-1">
                          {item.flavor && <span>Flavor: {item.flavor}</span>}
                          {item.flavor && item.size && <span> • </span>}
                          {item.size && <span>Size: {item.size}</span>}
                        </p>
                        <p className="text-sm text-neutral-700 mt-2">
                          {item.quantity} × ₹{item.price.toFixed(2)} = <span className="font-bold">₹{(item.quantity * item.price).toFixed(2)}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <div className="flex items-center gap-2 text-sm">
                  <CreditCard className="w-4 h-4" />
                  <span className="text-neutral-600">Credit Card</span>
                </div>
              </div>

              {/* Bill Summary */}
              <div className="bg-neutral-50 p-4 rounded-lg">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Subtotal:</span>
                    <span className="font-semibold text-neutral-900">₹{selectedOrderForModal.totalAmount.toFixed(2)}</span>
                  </div>
                  {selectedOrderForModal.discount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Discount:</span>
                      <span className="font-semibold text-red-600">-₹{selectedOrderForModal.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t border-neutral-200 pt-2 flex justify-between">
                    <span className="font-bold text-neutral-900">Total Amount:</span>
                    <span className="text-lg font-bold text-neutral-900">₹{selectedOrderForModal.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Status Update */}
              <div className="border-t border-neutral-200 pt-4">
                <h4 className="font-bold text-neutral-900 mb-3">Update Status</h4>
                <div className="flex gap-2 flex-wrap">
                  {ORDER_STATUSES.map((status) => (
                    <button
                      key={status}
                      onClick={() => {
                        handleStatusUpdate(selectedOrderForModal.id, status);
                        setSelectedOrderForModal(null);
                      }}
                      disabled={updatingOrderId === selectedOrderForModal.id || selectedOrderForModal.status === status}
                      className={`rounded-lg px-3 py-2 text-xs font-bold transition-all ${
                        selectedOrderForModal.status === status
                          ? "bg-green-500 text-white shadow-md ring-2 ring-green-300"
                          : "bg-neutral-200 hover:bg-neutral-300 text-neutral-700 shadow-sm"
                      } disabled:opacity-50`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
