import React, { useState, useEffect } from "react";
import { ChevronDown, Eye, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import {
  getAllOrders,
  updateOrderStatus,
  Order,
  OrderItem,
} from "../../services/adminOrderService";

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
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

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

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <div
          key={order.id}
          className="overflow-hidden rounded-lg border border-neutral-200 bg-white"
        >
          {/* ORDER HEADER */}
          <button
            onClick={() =>
              setExpandedOrderId(
                expandedOrderId === order.id ? null : order.id
              )
            }
            className="w-full px-6 py-4 hover:bg-neutral-50 transition-colors"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 text-left">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="font-semibold">Order #{order.id.slice(0, 8)}</p>
                    <p className="text-sm text-neutral-600">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-600">Customer:</p>
                    <p className="font-medium">{order.address?.name || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-600">Total:</p>
                    <p className="font-semibold">₹{order.totalAmount.toFixed(2)}</p>
                  </div>
                  <div>
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                        STATUS_COLORS[order.status] || "bg-neutral-100"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>
              </div>
              <ChevronDown
                className={`h-5 w-5 transition-transform ${
                  expandedOrderId === order.id ? "rotate-180" : ""
                }`}
              />
            </div>
          </button>

          {/* EXPANDED DETAILS */}
          {expandedOrderId === order.id && (
            <div className="border-t border-neutral-200 bg-neutral-50 px-6 py-4">
              <div className="space-y-6">
                {/* CUSTOMER INFO */}
                <div>
                  <h3 className="mb-3 font-semibold">Customer Information</h3>
                  <div className="grid grid-cols-2 gap-4 rounded-lg bg-white p-4">
                    <div>
                      <p className="text-sm text-neutral-600">Name</p>
                      <p className="font-medium">{order.address?.name || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-neutral-600">Phone</p>
                      <p className="font-medium">{order.address?.phone || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-neutral-600">Address</p>
                      <p className="font-medium">{order.address?.address || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-neutral-600">City</p>
                      <p className="font-medium">{order.address?.city || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-neutral-600">Pincode</p>
                      <p className="font-medium">{order.address?.pincode || "N/A"}</p>
                    </div>
                  </div>
                </div>

                {/* PRODUCTS */}
                <div>
                  <h3 className="mb-4 font-semibold text-base">Products in Order</h3>
                  <div className="space-y-4">
                    {order.items.map((item: OrderItem) => (
                      <div
                        key={item.id}
                        className="flex gap-4 rounded-lg bg-white p-5 border border-neutral-200"
                      >
                        {item.product.imageUrls[0] && (
                          <img
                            src={item.product.imageUrls[0]}
                            alt={item.product.name}
                            className="h-20 w-20 rounded object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <p className="font-semibold text-base">{item.product.name}</p>
                          
                          {/* Flavor */}
                          {item.flavor && (
                            <p className="text-sm text-neutral-600 mt-1">
                              <span className="font-semibold">Flavor:</span> {item.flavor}
                            </p>
                          )}
                          
                          {/* Size */}
                          {item.size && (
                            <p className="text-sm text-neutral-600">
                              <span className="font-semibold">Size:</span> {item.size}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-bold text-neutral-900">
                            ₹{item.price.toFixed(2)}
                          </p>
                          <p className="text-xl font-bold text-blue-600 mt-2">
                            Qty: {item.quantity}
                          </p>
                          <p className="text-base font-semibold text-neutral-700 mt-2 border-t pt-2">
                            Total: ₹{(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ORDER SUMMARY */}
                <div>
                  <h3 className="mb-4 font-semibold text-base">Order Summary</h3>
                  <div className="space-y-3 rounded-lg bg-white p-6 border border-blue-200">
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-600">Subtotal:</span>
                      <span className="font-medium">₹{(order.totalAmount - order.gstAmount).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-600">Discount:</span>
                      <span className="font-medium text-red-600">-₹{order.discount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-600">GST (18%):</span>
                      <span className="font-medium">₹{order.gstAmount.toFixed(2)}</span>
                    </div>
                    <div className="border-t border-blue-300 pt-3 mt-3">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">Total Amount:</span>
                        <span className="text-2xl font-bold text-green-600">₹{order.totalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* STATUS UPDATE */}
                <div>
                  <h3 className="mb-3 font-semibold">Update Status</h3>
                  <div className="flex gap-2 flex-wrap">
                    {ORDER_STATUSES.map((status) => (
                      <button
                        key={status}
                        onClick={() => handleStatusUpdate(order.id, status)}
                        disabled={
                          updatingOrderId === order.id || order.status === status
                        }
                        className={`rounded px-3 py-2 text-sm font-medium transition-colors ${
                          order.status === status
                            ? "bg-neutral-300 text-neutral-700 cursor-not-allowed"
                            : "bg-neutral-200 hover:bg-neutral-300 text-neutral-700"
                        } disabled:opacity-50`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
