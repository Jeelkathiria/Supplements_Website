import React, { useState, useEffect } from "react";
import { ChevronDown, AlertCircle, Search, X, Phone, MapPin, CreditCard, User, CheckCircle, XCircle, Video } from "lucide-react";
import { toast } from "sonner";
import {
  getAllOrders,
  updateOrderStatus,
  Order,
  OrderItem,
} from "../../services/adminOrderService";
import { OrderCancellationService } from "../../services/orderCancellationService";
import { useAuth } from "./context/AuthContext";
import { AdminCancellationRequests } from "./AdminCancellationRequests";

// Helper function to get full image URL
const getFullImageUrl = (imageUrl: string) => {
  if (!imageUrl) return '/placeholder.png';
  if (imageUrl.startsWith('http')) return imageUrl;
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const backendBase = apiBase.replace('/api', '');
  return `${backendBase}${imageUrl}`;
};

const ORDER_STATUSES = ["PENDING", "SHIPPED", "DELIVERED", "CANCELLED"];

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  SHIPPED: "bg-purple-100 text-purple-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

const STATUS_HEADER_BG: Record<string, string> = {
  PENDING: "bg-amber-50",
  SHIPPED: "bg-purple-100",
  DELIVERED: "bg-green-50",
  CANCELLED: "bg-red-50",
};

// Function to get available statuses for current order status
const getAvailableStatuses = (currentStatus: string): string[] => {
  switch (currentStatus) {
    case "PENDING":
      return ["PENDING", "SHIPPED", "DELIVERED", "CANCELLED"];
    case "SHIPPED":
      return ["SHIPPED", "DELIVERED", "CANCELLED"];
    case "DELIVERED":
      return ["DELIVERED", "CANCELLED"];
    case "CANCELLED":
      return ["CANCELLED"];
    default:
      return ORDER_STATUSES;
  }
};

interface AdminOrdersProps {
  filterStatus?: "all" | "pending" | "delivered" | "shipped" | "cancelled";
}

export const AdminOrders: React.FC<AdminOrdersProps> = ({ filterStatus = "all" }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrderForModal, setSelectedOrderForModal] = useState<Order | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [cancellationRequests, setCancellationRequests] = useState<Record<string, any>>({});
  const [loadingCancellationRequests, setLoadingCancellationRequests] = useState(false);
  const [activeTab, setActiveTab] = useState<"orders" | "cancellations">("orders");
  const CARDS_PER_PAGE = 12;
  const { firebaseUser } = useAuth();

  useEffect(() => {
    if (firebaseUser) {
      loadOrders();
      loadCancellationRequests();
    } else if (!isLoading) {
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

  const loadCancellationRequests = async () => {
    try {
      setLoadingCancellationRequests(true);
      const requests = await OrderCancellationService.getAllRequests();
      const requestsByOrderId: Record<string, any> = {};
      requests.forEach(req => {
        requestsByOrderId[req.orderId] = req;
      });
      setCancellationRequests(requestsByOrderId);
    } catch (error) {
      console.error("Error loading cancellation requests:", error);
    } finally {
      setLoadingCancellationRequests(false);
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
      
      // Reload orders to ensure UI stays in sync with server
      loadOrders();
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error("Failed to update order status");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleApproveCancellation = async (requestId: string, orderId: string) => {
    try {
      await OrderCancellationService.approveCancellation(requestId);
      
      setCancellationRequests(prev => {
        const updated = { ...prev };
        if (updated[orderId]) {
          updated[orderId].status = 'APPROVED';
        }
        return updated;
      });

      await loadOrders();
      toast.success("Cancellation approved! Order has been cancelled.");
    } catch (error) {
      console.error("Error approving cancellation:", error);
      toast.error("Failed to approve cancellation");
    }
  };

  const handleRejectCancellation = async (requestId: string, orderId: string) => {
    try {
      await OrderCancellationService.rejectCancellation(requestId);
      
      setCancellationRequests(prev => {
        const updated = { ...prev };
        if (updated[orderId]) {
          updated[orderId].status = 'REJECTED';
        }
        return updated;
      });
      
      await loadOrders();
      toast.success("Cancellation request rejected.");
    } catch (error) {
      console.error("Error rejecting cancellation:", error);
      toast.error("Failed to reject cancellation");
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

  const filteredOrders = orders.filter((order) => {
    const searchLower = searchQuery.toLowerCase();
    
    const matchesSearch =
      order.id.toLowerCase().includes(searchLower) ||
      order.address?.name.toLowerCase().includes(searchLower) ||
      order.address?.phone.includes(searchQuery) ||
      order.totalAmount.toString().includes(searchQuery);
    
    let matchesStatus = true;
    if (filterStatus !== "all") {
      const statusMap: Record<string, string[]> = {
        pending: ["PENDING"],
        shipped: ["SHIPPED"],
        delivered: ["DELIVERED"],
        cancelled: ["CANCELLED"],
      };
      const allowedStatuses = statusMap[filterStatus] || [];
      matchesStatus = allowedStatuses.includes(order.status);
    }
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Tab Switcher */}
      <div className="flex gap-2 border-b border-neutral-200">
        <button
          onClick={() => {
            setActiveTab("orders");
            setCurrentPage(1);
          }}
          className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 transition ${
            activeTab === "orders"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-neutral-600 hover:text-neutral-900"
          }`}
        >
          Orders
        </button>
        <button
          onClick={() => {
            setActiveTab("cancellations");
            setCurrentPage(1);
          }}
          className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 transition ${
            activeTab === "cancellations"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-neutral-600 hover:text-neutral-900"
          }`}
        >
          <Video className="w-4 h-4" />
          Order Cancellations (After Delivery)
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "orders" ? (
        // ORDERS TAB
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
                {/* Orders Scroll */}
                <div className="overflow-x-auto pb-4">
                  <div className="flex gap-4 items-start min-w-min">
                    {filteredOrders
                      .slice((currentPage - 1) * CARDS_PER_PAGE, currentPage * CARDS_PER_PAGE)
                      .map((order) => {
                        const isExpanded = expandedOrderId === order.id;
                        return (
                          <div
                            key={order.id}
                            className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-neutral-200 flex-shrink-0 w-80"
                          >
                            {/* ORDER HEADER */}
                            <div className={`px-4 py-3 border-b border-neutral-200 ${STATUS_HEADER_BG[order.status] || 'bg-neutral-50'}`}>
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-bold text-base text-neutral-900">Order #{order.id.toUpperCase()}</h3>
                                    {cancellationRequests[order.id] && (
                                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                                        cancellationRequests[order.id].status === 'PENDING' ? 'bg-orange-200 text-orange-900' :
                                        cancellationRequests[order.id].status === 'APPROVED' ? 'bg-red-200 text-red-900' :
                                        'bg-gray-200 text-gray-900'
                                      }`}>
                                        Cancel Req: {cancellationRequests[order.id].status}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-neutral-600">
                                    {new Date(order.createdAt).toLocaleDateString('en-IN')} • {new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                                  </p>
                                </div>
                                <button
                                  onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                                  className="text-neutral-600 hover:text-neutral-900 transition p-1"
                                >
                                  <ChevronDown size={20} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                </button>
                              </div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${STATUS_COLORS[order.status] || "bg-neutral-100"}`}>
                                  {order.status}
                                </span>
                                {cancellationRequests[order.id] && cancellationRequests[order.id].status === 'PENDING' && (
                                  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold bg-orange-100 text-orange-800">
                                    Cancel: Req pending
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* PRODUCTS */}
                            <div className="px-4 py-3 border-b border-neutral-200">
                              <h4 className="font-bold text-sm text-neutral-900 mb-2">Products ({order.items.length})</h4>
                              <div className={`space-y-2 ${isExpanded ? "max-h-40 overflow-y-auto" : ""}`}>
                                {(isExpanded ? order.items : order.items.slice(0, 1)).map((item) => (
                                  <div key={item.id} className="flex items-start gap-2 pb-2 border-b border-neutral-100 last:border-0">
                                    {item.product.imageUrls[0] && (
                                      <img src={getFullImageUrl(item.product.imageUrls[0])} alt={item.product.name} className="w-10 h-10 rounded object-cover border border-neutral-200 flex-shrink-0" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <p className="font-semibold text-neutral-900 text-xs line-clamp-1">{item.product.name}</p>
                                      <p className="text-xs text-neutral-600 line-clamp-1">{item.flavor}{item.flavor && item.size && " • "}{item.size}</p>
                                      <p className="text-xs text-neutral-700 mt-0.5">{item.quantity}× ₹{item.price}</p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                      <p className="font-bold text-neutral-900 text-xs">₹{(item.quantity * item.price).toFixed(2)}</p>
                                    </div>
                                  </div>
                                ))}
                                {!isExpanded && order.items.length > 1 && (
                                  <p className="text-xs text-neutral-500 pl-12">+{order.items.length - 1} more item{order.items.length - 1 > 1 ? "s" : ""}</p>
                                )}
                              </div>
                            </div>

                            {/* TOTAL - Collapsed */}
                            {!isExpanded && (
                              <div className="px-4 py-3 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between">
                                <span className="text-lg font-bold text-neutral-900">₹{order.totalAmount.toFixed(2)}</span>
                                <button onClick={() => setExpandedOrderId(order.id)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:text-neutral-900">
                                  View details <ChevronDown size={16} />
                                </button>
                              </div>
                            )}

                            {/* EXPANDED */}
                            {isExpanded && (
                              <div className="px-4 py-3 border-b border-neutral-200 bg-neutral-50 space-y-3">
                                <div className="pb-3 border-b border-neutral-200">
                                  <div className="flex justify-between items-baseline">
                                    <span className="text-neutral-600 text-xs">Total Amount</span>
                                    <span className="text-lg font-bold text-neutral-900">₹{order.totalAmount.toFixed(2)}</span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${STATUS_COLORS[order.status] || "bg-neutral-100"}`}>
                                    {order.status}
                                  </span>
                                  {cancellationRequests[order.id] && cancellationRequests[order.id].status === 'PENDING' && (
                                    <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold bg-orange-100 text-orange-800">
                                      Cancel: Req pending
                                    </span>
                                  )}
                                </div>

                                <div>
                                  <h5 className="font-bold text-sm text-neutral-900 mb-2 flex items-center gap-2">
                                    <User size={16} /> Customer
                                  </h5>
                                  <div className="space-y-1 text-xs text-neutral-700 ml-6">
                                    <p><span className="font-semibold">Name:</span> {order.address?.name || 'N/A'}</p>
                                    <p><span className="font-semibold">Phone:</span> {order.address?.phone || 'N/A'}</p>
                                    <p><span className="font-semibold">Address:</span> {order.address?.address || 'N/A'}, {order.address?.city || 'N/A'}</p>
                                  </div>
                                </div>

                                <div>
                                  <h5 className="font-bold text-sm text-neutral-900 mb-2 flex items-center gap-2">
                                    <CreditCard size={16} /> Payment
                                  </h5>
                                  <div className="space-y-1 text-xs text-neutral-700 ml-6">
                                    <p><span className="font-semibold">Method:</span> {order.paymentMethod === 'upi' ? 'UPI' : 'Cash on Delivery'}</p>
                                  </div>
                                </div>

                                {cancellationRequests[order.id] && (
                                  <div>
                                    <h5 className="font-bold text-sm text-neutral-900 mb-2 flex items-center gap-2">
                                      <AlertCircle size={16} className="text-orange-600" /> Cancellation
                                    </h5>
                                    <div className="space-y-2 text-xs text-neutral-700 ml-6">
                                      <div>
                                        <p className="font-semibold mb-1">Status:</p>
                                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                                          cancellationRequests[order.id].status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                          cancellationRequests[order.id].status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                          'bg-red-100 text-red-800'
                                        }`}>
                                          {cancellationRequests[order.id].status}
                                        </span>
                                      </div>
                                      <div>
                                        <p className="font-semibold">Reason:</p>
                                        <p className="text-neutral-600 mt-1 p-2 bg-neutral-50 rounded text-xs leading-relaxed">
                                          {cancellationRequests[order.id].reason}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Cancel Approval Buttons */}
                            {isExpanded && cancellationRequests[order.id] && cancellationRequests[order.id].status === 'PENDING' && (
                              <div className="px-4 py-2.5 flex items-center justify-between gap-2 border-t border-neutral-200 bg-orange-50">
                                <p className="text-xs text-orange-700 font-semibold">Pending approval</p>
                                <div className="flex gap-2">
                                  <button onClick={() => handleRejectCancellation(cancellationRequests[order.id].id, order.id)} className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded hover:bg-red-700 transition">
                                    <XCircle size={14} /> Reject
                                  </button>
                                  <button onClick={() => handleApproveCancellation(cancellationRequests[order.id].id, order.id)} className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 transition">
                                    <CheckCircle size={14} /> Approve
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Action Buttons */}
                            {isExpanded && (
                              <div className="px-4 py-2.5 border-t border-neutral-200">
                                {cancellationRequests[order.id] && cancellationRequests[order.id].status === 'PENDING' ? (
                                  <div className="flex items-center justify-between gap-2">
                                    <p className="text-xs text-orange-700 font-semibold">⚠️ Cannot update status: Cancellation request pending</p>
                                    <button onClick={() => setSelectedOrderForModal(order)} className="px-4 py-1.5 bg-teal-900 border border-neutral-300 rounded font-medium text-xs text-white hover:bg-teal-700 transition whitespace-nowrap">
                                      View Details
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex-1">
                                      <select value={order.status} onChange={(e) => handleStatusUpdate(order.id, e.target.value)} disabled={updatingOrderId === order.id} className="w-full px-2 py-1.5 border border-neutral-300 rounded text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500">
                                        {getAvailableStatuses(order.status).map((status) => (
                                          <option key={status} value={status}>{status}</option>
                                        ))}
                                      </select>
                                    </div>
                                    <button onClick={() => setSelectedOrderForModal(order)} className="px-4 py-1.5 bg-teal-900 border border-neutral-300 rounded font-medium text-xs text-white hover:bg-teal-700 transition whitespace-nowrap">
                                      View Details
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Pagination */}
                {filteredOrders.length > CARDS_PER_PAGE && (
                  <div className="flex items-center justify-between pt-4">
                    <div className="text-xs text-neutral-600">
                      Showing {(currentPage - 1) * CARDS_PER_PAGE + 1} to {Math.min(currentPage * CARDS_PER_PAGE, filteredOrders.length)} of {filteredOrders.length}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="px-3 py-1.5 border border-neutral-300 rounded text-xs font-medium hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition">
                        Previous
                      </button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.ceil(filteredOrders.length / CARDS_PER_PAGE) }, (_, i) => i + 1).map((page) => (
                          <button key={page} onClick={() => setCurrentPage(page)} className={`w-8 h-8 rounded text-xs font-medium transition ${currentPage === page ? 'bg-teal-900 text-white shadow-md' : 'border border-neutral-300 hover:bg-neutral-50'}`}>
                            {page}
                          </button>
                        ))}
                      </div>
                      <button onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredOrders.length / CARDS_PER_PAGE), prev + 1))} disabled={currentPage === Math.ceil(filteredOrders.length / CARDS_PER_PAGE)} className="px-3 py-1.5 border border-neutral-300 rounded text-xs font-medium hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition">
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      ) : (
        // CANCELLATIONS TAB
        <AdminCancellationRequests />
      )}

      {/* MODAL */}
      {selectedOrderForModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-neutral-900">
                Order #{selectedOrderForModal.id.toUpperCase()}
              </h2>
              <button onClick={() => setSelectedOrderForModal(null)} className="p-1 hover:bg-neutral-100 rounded-lg transition">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="px-6 py-4 space-y-6">
              <div>
                <p className="text-sm text-neutral-600 mb-1">
                  {new Date(selectedOrderForModal.createdAt).toLocaleDateString('en-US')} • {new Date(selectedOrderForModal.createdAt).toLocaleTimeString('en-US')}
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${STATUS_COLORS[selectedOrderForModal.status] || "bg-neutral-100"}`}>
                    {selectedOrderForModal.status}
                  </span>
                  {cancellationRequests[selectedOrderForModal.id] && cancellationRequests[selectedOrderForModal.id].status === 'PENDING' && (
                    <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold bg-orange-100 text-orange-800">
                      Cancel: Req pending
                    </span>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-bold text-neutral-900 mb-3">{selectedOrderForModal.address?.name || "N/A"}</h3>
                <div className="space-y-2 font-semibold text-neutral-600">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 flex-shrink-0" />
                    <span>{selectedOrderForModal.address?.phone || "N/A"}</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gray-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-neutral-900">{selectedOrderForModal.address?.address || "N/A"}</p>
                    <p>{selectedOrderForModal.address?.city || "N/A"}</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-neutral-900 mb-3">Products ({selectedOrderForModal.items.length})</h4>
                <div className="space-y-4">
                  {selectedOrderForModal.items.map((item: OrderItem) => (
                    <div key={item.id} className="flex gap-4 pb-4 border-b border-neutral-100 last:border-0">
                      {item.product.imageUrls[0] && (
                        <img src={getFullImageUrl(item.product.imageUrls[0])} alt={item.product.name} className="w-16 h-16 rounded object-cover border border-neutral-200 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className="font-semibold text-neutral-900">{item.product.name}</p>
                        <div className="text-xs text-neutral-600 mt-1 space-x-2">
                          {item.flavor && <span><span className="font-bold">Flavor:</span> {item.flavor}</span>}
                          {item.size && <span><span className="font-bold">Size:</span> {item.size}</span>}
                        </div>
                        <p className="text-sm text-neutral-700 mt-1">₹{item.price.toFixed(2)}</p>
                      </div>
                      <div className="text-right min-w-[110px]">
                        <p className="text-sm text-neutral-700"><span className="font-bold">Qty:</span> {item.quantity}</p>
                        <p className="font-bold text-neutral-900 mt-1">₹{(item.quantity * item.price).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 text-sm">
                  <CreditCard className="w-4 h-4" />
                  <span className="text-neutral-600">
                    {selectedOrderForModal.paymentMethod === 'upi' ? 'UPI Payment' : 'Cash on Delivery'}
                  </span>
                </div>
              </div>

              <div className="bg-neutral-50 p-4 rounded-lg">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Subtotal:</span>
                    <span className="font-semibold text-neutral-900">₹{selectedOrderForModal.totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-neutral-200 pt-2 flex justify-between">
                    <span className="font-bold text-neutral-900">Total:</span>
                    <span className="text-lg font-bold text-neutral-900">₹{selectedOrderForModal.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

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
