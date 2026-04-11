import React, { useState, useEffect } from "react";
import { ArrowLeft, Truck, Calendar, FileDown as Download } from "lucide-react";
import { toast } from "sonner";
import * as couponService from "../../services/couponService";
import { useAuth } from "./context/AuthContext";

interface CommissionReportDetailProps {
  trainerName: string;
  couponCode?: string;
  onBack: () => void;
}

interface OrderDetail {
  orderId: string;
  orderDate: string;
  appliedDate: string;
  couponCode: string;
  discountPercent: number;
  minAmount: number | null;
  discountAmount: number;
  totalAmount: number;
  finalAmount: number;
  paymentMethod: string;
  status: string;
  itemCount: number;
  items: Array<{
    productName: string;
    basePrice: number;
    quantity: number;
    flavor?: string;
    size?: string;
    discountPercent: number;
  }>;
  address?: {
    name: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
}

interface DetailedReport {
  trainerName: string;
  reportDate: string;
  totalCouponsIssued: number;
  totalOrdersWithCoupon: number;
  totalDiscountGiven: number;
  averageDiscountPerOrder: number;
  coupons: Array<{
    code: string;
    discountPercent: number;
    minAmount: number | null;
    usageCount: number;
    maxUses: number | null;
    isActive: boolean;
  }>;
  orderDetails: OrderDetail[];
}

export const CommissionReportDetail: React.FC<CommissionReportDetailProps> = ({
  trainerName,
  onBack,
}) => {
  const { getIdToken } = useAuth();
  const [report, setReport] = useState<DetailedReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadDetailedReport();
  }, [trainerName]);

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

  const toggleOrderExpand = (orderId: string) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  const downloadReport = () => {
    if (!report) return;

    const csv = generateCSV(report);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `commission-report-${trainerName}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Report downloaded successfully");
  };

  const generateCSV = (report: DetailedReport): string => {
    let csv = "Commission Report\n";
    csv += `Trainer: ${report.trainerName}\n`;
    csv += `Report Date: ${new Date(report.reportDate).toLocaleDateString()}\n\n`;
    csv += "SUMMARY\n";
    csv += `Total Coupons Issued,${report.totalCouponsIssued}\n`;
    csv += `Total Orders with Coupon,${report.totalOrdersWithCoupon}\n`;
    csv += `Total Discount Given,₹${report.totalDiscountGiven.toFixed(2)}\n`;
    csv += `Average Discount per Order,₹${report.averageDiscountPerOrder.toFixed(2)}\n\n`;
    csv += "COUPON DETAILS\n";
    csv += "Code,Discount %,Min Amount,Usage Count,Max Uses,Active\n";
    report.coupons.forEach((c) => {
      csv += `${c.code},${c.discountPercent}%,₹${c.minAmount || 0},${c.usageCount},${c.maxUses || "Unlimited"},${c.isActive ? "Yes" : "No"}\n`;
    });
    csv += "\nORDER DETAILS\n";
    csv += "Order ID,Order Date,Coupon Code,Discount %,Discount Amount,Total,Final Amount,Payment,Status,Items\n";
    report.orderDetails.forEach((o) => {
      csv += `${o.orderId},${new Date(o.orderDate).toLocaleDateString()},${o.couponCode},${o.discountPercent}%,₹${o.discountAmount.toFixed(2)},₹${o.totalAmount.toFixed(2)},₹${o.finalAmount.toFixed(2)},${o.paymentMethod},${o.status},${o.itemCount}\n`;
    });

    return csv;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <p className="text-gray-600">Loading commission report...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft size={20} />
            Back to Coupons
          </button>
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <p className="text-gray-600">No data available for this trainer.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4 font-medium"
          >
            <ArrowLeft size={20} />
            Back to Coupons
          </button>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                💼 Commission Report
              </h1>
              <p className="text-gray-600">
                Detailed analysis of {report.trainerName}'s coupon performance
              </p>
            </div>
            <button
              onClick={downloadReport}
              className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:from-green-700 hover:to-green-800 transition shadow-md hover:shadow-lg"
            >
              <Download size={20} />
              Download Report
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <p className="text-gray-600 text-sm font-medium mb-1">
              Total Coupons Issued
            </p>
            <p className="text-3xl font-bold text-gray-900">
              {report.totalCouponsIssued}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <p className="text-gray-600 text-sm font-medium mb-1">
              Orders with Coupon
            </p>
            <p className="text-3xl font-bold text-green-600">
              {report.totalOrdersWithCoupon}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
            <p className="text-gray-600 text-sm font-medium mb-1">
              Total Discount Given
            </p>
            <p className="text-3xl font-bold text-purple-600">
              ₹{report.totalDiscountGiven.toFixed(0)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
            <p className="text-gray-600 text-sm font-medium mb-1">
              Average per Order
            </p>
            <p className="text-3xl font-bold text-orange-600">
              ₹{report.averageDiscountPerOrder.toFixed(0)}
            </p>
          </div>
        </div>

        {/* Coupon Details */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">🎟️ Coupon Details</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b-2 border-gray-200">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Discount
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Min Amount
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Used
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Max Uses
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {report.coupons.map((coupon) => (
                  <tr key={coupon.code} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{coupon.code}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                        {coupon.discountPercent}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      ₹{coupon.minAmount || 0}
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      {coupon.usageCount}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {coupon.maxUses || "Unlimited"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                          coupon.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {coupon.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Order Details */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">📦 Order Details</h2>
          {report.orderDetails.length === 0 ? (
            <p className="text-gray-600 text-center py-8">No orders found with applied coupons.</p>
          ) : (
            <div className="space-y-4">
              {report.orderDetails.map((order) => (
                <div key={order.orderId} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Order Header */}
                  <button
                    onClick={() => toggleOrderExpand(order.orderId)}
                    className="w-full bg-gray-50 hover:bg-gray-100 px-6 py-4 flex items-center justify-between transition"
                  >
                    <div className="flex items-center gap-4 flex-1 text-left">
                      <div>
                        <p className="font-semibold text-gray-900">Order {order.orderId.slice(0, 8)}</p>
                        <p className="text-sm text-gray-600">
                          <Calendar size={14} className="inline mr-1" />
                          {new Date(order.orderDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="hidden md:block">
                        <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                          {order.couponCode}
                        </span>
                      </div>
                      <div className="hidden md:block">
                        <p className="font-semibold text-green-600">
                          -₹{order.discountAmount.toFixed(0)}
                        </p>
                        <p className="text-sm text-gray-600">{order.discountPercent}% off</p>
                      </div>
                      <div className="hidden md:block">
                        <p className="font-semibold text-gray-900">₹{order.finalAmount.toFixed(0)}</p>
                        <p className="text-sm text-gray-600">
                          <span
                            className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                              order.status === "DELIVERED"
                                ? "bg-green-100 text-green-800"
                                : order.status === "PENDING"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {order.status}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div
                      className={`transform transition ${
                        expandedOrders.has(order.orderId) ? "rotate-180" : ""
                      }`}
                    >
                      ▼
                    </div>
                  </button>

                  {/* Order Details Expanded */}
                  {expandedOrders.has(order.orderId) && (
                    <div className="bg-white border-t border-gray-200 px-6 py-6 space-y-6">
                      {/* Order Summary */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Subtotal</p>
                          <p className="text-lg font-semibold text-gray-900">
                            ₹{order.totalAmount.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">
                            Discount ({order.couponCode})
                          </p>
                          <p className="text-lg font-semibold text-green-600">
                            -₹{order.discountAmount.toFixed(2)}
                          </p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-600 mb-1">Final Amount</p>
                          <p className="text-2xl font-bold text-green-600">
                            ₹{order.finalAmount.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {/* Order Items */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">📦 Items</h4>
                        <div className="space-y-2">
                          {order.items.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex justify-between items-start bg-gray-50 p-3 rounded"
                            >
                              <div>
                                <p className="font-medium text-gray-900">{item.productName}</p>
                                <p className="text-sm text-gray-600">
                                  {item.quantity}x @ ₹{item.basePrice.toFixed(2)}{" "}
                                  {item.flavor && `(${item.flavor})`}
                                  {item.size && ` [${item.size}]`}
                                </p>
                              </div>
                              <p className="font-semibold text-gray-900">
                                ₹{(item.basePrice * item.quantity).toFixed(2)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Delivery Address */}
                      {order.address && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3">
                            <Truck className="inline mr-2" size={18} />
                            Delivery Address
                          </h4>
                          <div className="bg-gray-50 p-4 rounded">
                            <p className="font-medium text-gray-900">{order.address.name}</p>
                            <p className="text-sm text-gray-600">{order.address.address}</p>
                            <p className="text-sm text-gray-600">
                              {order.address.city}, {order.address.state} {order.address.pincode}
                            </p>
                            <p className="text-sm text-gray-600">📞 {order.address.phone}</p>
                          </div>
                        </div>
                      )}

                      {/* Additional Info */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded">
                        <div>
                          <p className="text-xs text-gray-600 uppercase">Payment Method</p>
                          <p className="font-semibold text-gray-900">
                            {order.paymentMethod.toUpperCase()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 uppercase">Status</p>
                          <p className="font-semibold text-gray-900">{order.status}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 uppercase">Applied Date</p>
                          <p className="font-semibold text-gray-900">
                            {new Date(order.appliedDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 uppercase">Coupon Code</p>
                          <p className="font-semibold text-blue-600">{order.couponCode}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommissionReportDetail;
