import React, { useState, useEffect } from "react";
import { ArrowLeft, ShoppingCart, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import * as couponService from "../../services/couponService";
import { useAuth } from "./context/AuthContext";

interface OrderDetail {
  orderId: string;
  orderDate: string;
  couponCode: string;
  discountPercent: number;
  discountAmount: number;
  totalAmount: number;
  finalAmount: number;
  paymentMethod: string;
  status: string;
  items: Array<{
    productName: string;
    basePrice: number;
    quantity: number;
    flavor?: string;
    size?: string;
  }>;
  address?: {
    name: string;
  };
}

interface DetailedReport {
  trainerName: string;
  totalDiscountGiven: number;
  orderDetails: OrderDetail[];
  coupons: Array<{
    code: string;
    discountPercent: number;
  }>;
}

interface CouponDetailPageProps {
  trainerName: string;
  couponCode: string;
  onBack: () => void;
}

export const CouponDetailPage: React.FC<CouponDetailPageProps> = ({
  trainerName,
  couponCode,
  onBack,
}) => {
  const { getIdToken } = useAuth();
  const [report, setReport] = useState<DetailedReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    loadDetailedReport();
  }, [trainerName, couponCode]);

  const loadDetailedReport = async () => {
    try {
      setLoading(true);
      const token = await getIdToken();

      if (!token) {
        toast.error("Authentication failed. Please log in again.");
        return;
      }

      const response = await couponService.getDetailedTrainerCommissionReport(
        trainerName,
        token
      );

      setReport(response.report);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load report";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6 font-medium"
          >
            <ArrowLeft size={20} />
            Back
          </button>
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <p className="text-neutral-600">Loading coupon details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6 font-medium"
          >
            <ArrowLeft size={20} />
            Back
          </button>
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <p className="text-neutral-600">No data available.</p>
          </div>
        </div>
      </div>
    );
  }

  // Filter orders by coupon code and status
  const filteredOrdersByCoupon = report.orderDetails.filter(
    (order) => order.couponCode === couponCode
  );

  const filteredOrders = filteredOrdersByCoupon.filter((order) => {
    if (filterStatus === "all") return true;
    return order.status === filterStatus;
  });

  const totalEarnings = filteredOrders.reduce(
    (sum, order) => sum + order.discountAmount,
    0
  );

  // Get unique statuses from orders
  const availableStatuses = ["all", ...new Set(filteredOrdersByCoupon.map(o => o.status))];

  const getItemsDisplay = (items: any[]) => {
    return items.map((item) => `${item.productName} (${item.quantity})`).join(", ");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6 font-medium"
        >
          <ArrowLeft size={20} />
          Back to Commission Report
        </button>

        {/* Coupon Details Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition border border-neutral-200 p-4">
            <p className="text-xs text-neutral-600 font-medium mb-1">Influencer</p>
            <p className="text-2xl font-bold text-neutral-900">{trainerName}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition border border-neutral-200 p-4">
            <p className="text-xs text-neutral-600 font-medium mb-1">Coupon Code</p>
            <p className="text-2xl font-bold text-blue-600">{couponCode}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition border border-neutral-200 p-4">
            <p className="text-xs text-neutral-600 font-medium mb-1">Orders Applied</p>
            <p className="text-2xl font-bold text-blue-600">{filteredOrders.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition border border-neutral-200 p-4">
            <p className="text-xs text-neutral-600 font-medium mb-1">Total Earnings</p>
            <p className="text-2xl font-bold text-blue-600">₹{totalEarnings.toFixed(0)}</p>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="mb-8">
          <div className="flex gap-4 border-b border-neutral-300 overflow-x-auto pb-4">
            {availableStatuses.map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 font-medium text-sm whitespace-nowrap transition-all ${
                  filterStatus === status
                    ? "text-orange-600 border-b-2 border-orange-600"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                {status === "all"
                  ? "All Orders"
                  : status === "PENDING"
                  ? "Pending"
                  : status === "SHIPPED"
                  ? "Shipped"
                  : status === "DELIVERED"
                  ? "Delivered"
                  : status === "CANCELLED"
                  ? "Cancelled"
                  : status}
              </button>
            ))}
          </div>
        </div>

        {/* Orders Cards - Horizontal Scroll */}
        {filteredOrders.length > 0 && (
          <>
            <h2 className="text-xl font-bold text-neutral-900 mb-4">Orders with This Coupon</h2>
            <div className="bg-gradient-to-br from-neutral-50 to-neutral-100 p-4 rounded-xl mb-8">
              <div className="overflow-x-auto pb-4">
                <div className="flex gap-4 items-start min-w-min">
                  {filteredOrders.map((order) => {
                    const isExpanded = expandedOrderId === order.orderId;
                    const statusColors: Record<string, string> = {
                      PENDING: "bg-yellow-100 text-yellow-800",
                      SHIPPED: "bg-purple-100 text-purple-800",
                      DELIVERED: "bg-green-100 text-green-800",
                      CANCELLED: "bg-red-100 text-red-800",
                    };
                    const statusHeaderBg: Record<string, string> = {
                      PENDING: "bg-amber-50",
                      SHIPPED: "bg-purple-100",
                      DELIVERED: "bg-green-50",
                      CANCELLED: "bg-red-50",
                    };

                    return (
                      <div
                        key={order.orderId}
                        className="bg-white rounded-lg shadow-sm hover:shadow-md transition overflow-hidden border border-neutral-200 flex-shrink-0 w-80"
                      >
                        {/* ORDER HEADER */}
                        <div className={`px-4 py-3 border-b border-neutral-200 ${statusHeaderBg[order.status] || 'bg-neutral-50'}`}>
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-base text-neutral-900">
                                  Order #{order.orderId.toUpperCase()}
                                </h3>
                              </div>
                              <p className="text-xs text-neutral-600">
                                {new Date(order.orderDate).toLocaleDateString('en-IN')}
                              </p>
                            </div>
                            <button
                              onClick={() =>
                                setExpandedOrderId(isExpanded ? null : order.orderId)
                              }
                              className="text-neutral-600 hover:text-neutral-900 transition p-1"
                            >
                              <ChevronDown
                                size={20}
                                className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                              />
                            </button>
                          </div>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${
                              statusColors[order.status] ||
                              "bg-neutral-100 text-neutral-800"
                            }`}
                          >
                            {order.status}
                          </span>
                        </div>

                        {/* PRODUCTS */}
                        <div className="px-4 py-3 border-b border-neutral-200">
                          <h4 className="font-bold text-sm text-neutral-900 mb-2">
                            Products ({order.items.length})
                          </h4>
                          <div
                            className={`space-y-2 ${
                              isExpanded ? "max-h-40 overflow-y-auto" : ""
                            }`}
                          >
                            {(isExpanded
                              ? order.items
                              : order.items.slice(0, 1)
                            ).map((item, itemIdx) => (
                              <div
                                key={itemIdx}
                                className="flex items-start gap-2 pb-2 border-b border-neutral-100 last:border-0"
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-neutral-900 text-xs line-clamp-1">
                                    {item.productName}
                                  </p>
                                  <p className="text-xs text-neutral-600 line-clamp-1">
                                    {item.flavor}
                                    {item.flavor && item.size && " • "}
                                    {item.size}
                                  </p>
                                  <p className="text-xs text-neutral-700 mt-0.5">
                                    {item.quantity}× ₹{item.basePrice}
                                  </p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <p className="font-bold text-neutral-900 text-xs">
                                    ₹{(item.quantity * item.basePrice).toFixed(0)}
                                  </p>
                                </div>
                              </div>
                            ))}
                            {!isExpanded && order.items.length > 1 && (
                              <p className="text-xs text-neutral-500">
                                +{order.items.length - 1} more item
                                {order.items.length - 1 > 1 ? "s" : ""}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* PRICE SECTION - Collapsed */}
                        {!isExpanded && (
                          <div className="px-4 py-3 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between">
                            <span className="text-lg font-bold text-neutral-900">
                              ₹{order.finalAmount.toFixed(0)}
                            </span>
                            <button
                              onClick={() =>
                                setExpandedOrderId(order.orderId)
                              }
                              className="text-xs font-medium text-neutral-700 hover:text-neutral-900"
                            >
                              View details
                            </button>
                          </div>
                        )}

                        {/* EXPANDED VIEW */}
                        {isExpanded && (
                          <div className="px-4 py-3 border-b border-neutral-200 bg-neutral-50 space-y-3">
                            <div className="pb-3 border-b border-neutral-200">
                              <div className="flex justify-between items-baseline mb-2">
                                <span className="text-neutral-600 text-xs">
                                  Subtotal
                                </span>
                                <span className="font-semibold text-neutral-900">
                                  ₹{order.totalAmount.toFixed(0)}
                                </span>
                              </div>
                              <div className="flex justify-between items-baseline mb-2 text-blue-600">
                                <span className="text-xs font-semibold">
                                  Coupon Discount
                                </span>
                                <span className="font-bold">
                                  -₹{order.discountAmount.toFixed(0)}
                                </span>
                              </div>
                              <div className="flex justify-between items-baseline border-t border-neutral-200 pt-2">
                                <span className="text-neutral-600 text-xs font-semibold">
                                  Total Amount
                                </span>
                                <span className="text-lg font-bold text-neutral-900">
                                  ₹{order.finalAmount.toFixed(0)}
                                </span>
                              </div>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-neutral-600 mb-1">
                                Payment Method
                              </p>
                              <p className="text-sm text-neutral-900">
                                {order.paymentMethod === 'upi'
                                  ? 'UPI'
                                  : 'Cash on Delivery'}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Orders Table */}
        {filteredOrders.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 mb-8">
            <h2 className="text-lg font-bold text-neutral-900 mb-4">Order Summary Table</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-blue-100 border-b-2 border-blue-300">
                    <th className="px-6 py-3 text-left text-xs font-bold text-neutral-900">
                      Order Sr.No
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-neutral-900">
                      Order Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-neutral-900">
                      Order Items
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-neutral-900">
                      SubTotal
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-neutral-900">
                      Discount
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-neutral-900">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order, idx) => (
                    <tr
                      key={order.orderId}
                      className="border-b border-neutral-200 hover:bg-neutral-50"
                    >
                      <td className="px-6 py-3 font-semibold text-neutral-900 text-sm">
                        {idx + 1}
                      </td>
                      <td className="px-6 py-3 text-neutral-700 text-sm">
                        {new Date(order.orderDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-3 text-neutral-700 text-sm">
                        <span>{getItemsDisplay(order.items)}</span>
                      </td>
                      <td className="px-6 py-3 text-right text-neutral-900 font-semibold text-sm">
                        ₹{order.totalAmount.toFixed(0)}
                      </td>
                      <td className="px-6 py-3 text-right text-blue-600 font-semibold text-sm">
                        -₹{order.discountAmount.toFixed(0)}
                      </td>
                      <td className="px-6 py-3 text-right text-neutral-900 font-bold text-sm">
                        ₹{order.finalAmount.toFixed(0)}
                      </td>
                    </tr>
                  ))}
                  {/* Total Row */}
                  <tr className="bg-blue-50 border-t-2 border-blue-200 font-bold">
                    <td colSpan={3} className="px-6 py-3 text-right text-neutral-900">
                      TOTAL
                    </td>
                    <td className="px-6 py-3 text-right text-neutral-900">
                      ₹
                      {filteredOrders
                        .reduce((sum, order) => sum + order.totalAmount, 0)
                        .toFixed(0)}
                    </td>
                    <td className="px-6 py-3 text-right text-blue-600">
                      -₹{totalEarnings.toFixed(0)}
                    </td>
                    <td className="px-6 py-3 text-right text-blue-600 font-bold">
                      ₹
                      {filteredOrders
                        .reduce((sum, order) => sum + order.finalAmount, 0)
                        .toFixed(0)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Total Earnings Summary */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-neutral-600 text-sm font-medium mb-2">
                Total Price from {couponCode}
              </p>
              <p className="text-4xl font-bold text-green-600">
                ₹{filteredOrders.reduce((sum, order) => sum + order.finalAmount, 0).toFixed(0)}
              </p>
              <p className="text-neutral-600 text-xs mt-2">
                From {filteredOrders.length} order{filteredOrders.length !== 1 ? "s" : ""}
              </p>
            </div>
            <ShoppingCart size={64} className="text-green-100" />
          </div>
        </div>

        {filteredOrders.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-12 text-center">
            <p className="text-neutral-600 text-base">
              {filterStatus === "all"
                ? "No orders found with this coupon."
                : `No ${filterStatus.toLowerCase()} orders found.`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CouponDetailPage;
