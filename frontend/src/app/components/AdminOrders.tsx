import React, { useState, useEffect } from "react";
import { ChevronDown, AlertCircle, Package, Truck, DollarSign } from "lucide-react";
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
    <div className="space-y-3 bg-gradient-to-br from-neutral-50 to-neutral-100 p-6 rounded-xl">
      {orders.map((order) => (
        <div
          key={order.id}
          className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-neutral-200"
        >
          {/* ORDER HEADER - TICKET STYLE */}
          <button
            onClick={() =>
              setExpandedOrderId(
                expandedOrderId === order.id ? null : order.id
              )
            }
            className="w-full px-5 py-4 hover:bg-gradient-to-r hover:from-blue-50 hover:to-transparent transition-colors"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-4 flex-wrap">
                  {/* Order ID and Date */}
                  <div className="flex items-center gap-2">
                    <div className="bg-blue-100 rounded-lg px-3 py-2">
                      <p className="font-bold text-blue-900">#{order.id.slice(0, 8)}</p>
                      <p className="text-xs text-blue-700">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Customer Name */}
                  <div>
                    <p className="text-xs text-neutral-500 font-semibold">CUSTOMER</p>
                    <p className="font-bold text-neutral-900">{order.address?.name || "N/A"}</p>
                  </div>

                  {/* Total Amount - Highlighted */}
                  <div className="ml-auto">
                    <p className="text-xs text-neutral-500 font-semibold">TOTAL</p>
                    <p className="font-bold text-lg text-green-600">₹{order.totalAmount.toFixed(2)}</p>
                  </div>

                  {/* Status Badge */}
                  <div>
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold transition-all ${
                        STATUS_COLORS[order.status] || "bg-neutral-100"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>
              </div>
              <ChevronDown
                className={`h-5 w-5 text-neutral-400 transition-transform flex-shrink-0 ${
                  expandedOrderId === order.id ? "rotate-180" : ""
                }`}
              />
            </div>
          </button>

          {/* EXPANDED DETAILS - NEW LAYOUT */}
          {expandedOrderId === order.id && (
            <div className="border-t border-dashed border-neutral-300 bg-white">
              
              {/* DELIVERY ADDRESS */}
              <div className="px-5 py-4 bg-neutral-50 border-b border-neutral-200">
                <div className="flex items-start gap-3 mb-3">
                  <Truck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <h3 className="font-bold text-neutral-900 text-base">DELIVERY ADDRESS</h3>
                </div>
                <div className="bg-white rounded-lg p-3 border border-neutral-200 text-sm space-y-2">
                  <p className="font-bold text-neutral-900">{order.address?.name || "N/A"}</p>
                  <p className="text-neutral-600">{order.address?.address || "N/A"}</p>
                  <p className="text-neutral-600">{order.address?.city || "N/A"} - {order.address?.pincode || "N/A"}</p>
                  <p className="text-neutral-900 font-semibold">📱 {order.address?.phone || "N/A"}</p>
                </div>
              </div>

              {/* BILL SECTION */}
              <div className="px-5 py-4">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="font-bold text-neutral-900 text-base">ORDER ITEMS</h3>
                </div>

                {/* ITEMS TABLE STYLE */}
                <div className="bg-gradient-to-b from-blue-50 to-white rounded-lg border-2 border-blue-200 overflow-hidden">
                  {/* Header */}
                  <div className="grid grid-cols-12 gap-2 bg-blue-200 px-3 py-2 text-xs font-bold text-neutral-900">
                    <div className="col-span-1">IMG</div>
                    <div className="col-span-4">ITEM</div>
                    <div className="col-span-2">FLAVOR</div>
                    <div className="col-span-2">SIZE</div>
                    <div className="col-span-1">QTY</div>
                    <div className="col-span-2 text-right">AMOUNT</div>
                  </div>

                  {/* Items */}
                  <div className="divide-y divide-blue-100">
                    {order.items.map((item: OrderItem) => (
                      <div
                        key={item.id}
                        className="grid grid-cols-12 gap-2 px-3 py-3 items-center bg-white hover:bg-blue-50 transition-colors text-xs"
                      >
                        {/* Image */}
                        <div className="col-span-1">
                          {item.product.imageUrls[0] && (
                            <img
                              src={item.product.imageUrls[0]}
                              alt={item.product.name}
                              className="h-10 w-10 rounded object-cover border border-neutral-200"
                            />
                          )}
                        </div>

                        {/* Product Name */}
                        <div className="col-span-4">
                          <p className="font-bold text-neutral-900 line-clamp-1">{item.product.name}</p>
                          <p className="text-neutral-600 text-xs">₹{item.price.toFixed(2)}/unit</p>
                        </div>

                        {/* Flavor */}
                        <div className="col-span-2">
                          {item.flavor ? (
                            <span className="inline-block bg-yellow-100 text-yellow-900 px-2 py-1 rounded font-semibold text-xs">
                              {item.flavor}
                            </span>
                          ) : (
                            <span className="text-neutral-400">-</span>
                          )}
                        </div>

                        {/* Size */}
                        <div className="col-span-2">
                          {item.size ? (
                            <span className="inline-block bg-purple-100 text-purple-900 px-2 py-1 rounded font-semibold text-xs">
                              {item.size}
                            </span>
                          ) : (
                            <span className="text-neutral-400">-</span>
                          )}
                        </div>

                        {/* Quantity */}
                        <div className="col-span-1">
                          <span className="font-bold text-blue-600">{item.quantity}</span>
                        </div>

                        {/* Amount */}
                        <div className="col-span-2 text-right">
                          <p className="font-bold text-neutral-900">
                            ₹{(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* BILL TOTAL - Receipt Style */}
                  <div className="bg-gradient-to-b from-blue-100 to-blue-50 px-3 py-3 border-t-2 border-blue-300 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-700">Subtotal:</span>
                      <span className="font-bold text-neutral-900">₹{(order.totalAmount - order.gstAmount).toFixed(2)}</span>
                    </div>
                    {order.discount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-neutral-700">Discount:</span>
                        <span className="font-bold text-red-600">-₹{order.discount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-700">GST (18%):</span>
                      <span className="font-bold text-neutral-900">₹{order.gstAmount.toFixed(2)}</span>
                    </div>
                    <div className="border-t-2 border-dashed border-blue-300 pt-2 mt-2 flex justify-between items-center">
                      <span className="font-bold text-neutral-900 text-base">TOTAL:</span>
                      <span className="font-bold text-2xl text-green-600">₹{order.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* SEPARATOR */}
              <div className="border-t-2 border-dashed border-neutral-300"></div>

              {/* STATUS UPDATE */}
              <div className="px-5 py-4">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="font-bold text-neutral-900">UPDATE ORDER STATUS</h3>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {ORDER_STATUSES.map((status) => (
                    <button
                      key={status}
                      onClick={() => handleStatusUpdate(order.id, status)}
                      disabled={
                        updatingOrderId === order.id || order.status === status
                      }
                      className={`rounded-lg px-3 py-2 text-xs font-bold transition-all transform hover:scale-105 ${
                        order.status === status
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
          )}
        </div>
      ))}
    </div>
  );
};
