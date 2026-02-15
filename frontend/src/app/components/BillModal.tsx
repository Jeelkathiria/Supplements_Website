import React from "react";
import { X, Download, Printer } from "lucide-react";
import type { Order } from "../../services/orderService";

interface BillModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export const BillModal: React.FC<BillModalProps> = ({ order, isOpen, onClose }) => {
  if (!isOpen || !order) return null;

  // Safe value extraction with defaults
  const totalAmount = order.totalAmount || 0;
  const gstAmount = order.gstAmount || 0;
  const discountAmount = order.discountAmount || 0;
  const subtotal = totalAmount - gstAmount + discountAmount;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const element = document.getElementById("bill-content");
    if (element) {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(element.innerHTML);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-neutral-900">Order Bill</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 rounded-lg hover:bg-neutral-100 transition text-neutral-600"
              title="Print Bill"
            >
              <Printer className="w-5 h-5" />
            </button>
            <button
              onClick={handleDownload}
              className="p-2 rounded-lg hover:bg-neutral-100 transition text-neutral-600"
              title="Download Bill"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="text-neutral-500 hover:text-neutral-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Bill Content */}
        <div id="bill-content" className="p-6 space-y-6">
          {/* Header Section */}
          <div className="text-center border-b border-neutral-200 pb-4">
            <h1 className="text-3xl font-bold text-neutral-900">SaturnImports</h1>
            <p className="text-sm text-neutral-600 mt-1">Premium Supplements & Nutrition</p>
          </div>

          {/* Bill Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-neutral-500 font-semibold">Bill Number</p>
              <p className="text-neutral-900">ORD-{order.id}</p>
            </div>
            <div className="text-right">
              <p className="text-neutral-500 font-semibold">Date</p>
              <p className="text-neutral-900">{new Date(order.createdAt).toLocaleDateString("en-IN")}</p>
            </div>
            <div>
              <p className="text-neutral-500 font-semibold">Order ID</p>
              <p className="text-neutral-900 font-mono">{order.id}</p>
            </div>
            <div className="text-right">
              <p className="text-neutral-500 font-semibold">Delivery Status</p>
              <p className={`font-semibold ${
                order.status === "DELIVERED" 
                  ? "text-green-600" 
                  : order.status === "CANCELLED"
                  ? "text-red-600"
                  : "text-blue-600"
              }`}>
                {order.status}
              </p>
            </div>
          </div>

          {/* Customer Details */}
          <div className="border-t border-neutral-200 pt-4">
            <h3 className="font-bold text-neutral-900 mb-2">Bill To</h3>
            <div className="text-sm text-neutral-700 space-y-1">
              <p><span className="font-semibold">Name:</span> {order.address?.name || "N/A"}</p>
              <p><span className="font-semibold">Phone:</span> {order.address?.phone || "N/A"}</p>
              <p><span className="font-semibold">Address:</span> {order.address?.address || "N/A"}</p>
              <p><span className="font-semibold">City:</span> {order.address?.city || "N/A"}, {order.address?.state || "N/A"} - {order.address?.pincode || "N/A"}</p>
            </div>
          </div>

          {/* Products Table */}
          <div className="border-t border-neutral-200 pt-4">
            <h3 className="font-bold text-neutral-900 mb-3">Items Ordered</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-neutral-300">
                    <th className="text-left py-2 px-2 font-bold text-neutral-900">Product</th>
                    <th className="text-center py-2 px-2 font-bold text-neutral-900">Qty</th>
                    <th className="text-left py-2 px-2 font-bold text-neutral-900">Variant</th>
                    <th className="text-right py-2 px-2 font-bold text-neutral-900">Price</th>
                    <th className="text-right py-2 px-2 font-bold text-neutral-900">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items && order.items.length > 0 ? (
                    order.items.map((item, index) => {
                      const variant = [item.flavor, item.size].filter(Boolean).join(" - ");
                      const itemPrice = item.price || 0;
                      const itemQty = item.quantity || 0;
                      const itemTotal = itemPrice * itemQty;
                      return (
                        <tr key={index} className="border-b border-neutral-100 hover:bg-neutral-50">
                          <td className="py-3 px-2 text-neutral-900 font-medium">
                            {item.productName || item.product?.name || "Product"}
                          </td>
                          <td className="py-3 px-2 text-center text-neutral-700">
                            {itemQty}
                          </td>
                          <td className="py-3 px-2 text-neutral-600 text-xs">
                            {variant || "N/A"}
                          </td>
                          <td className="py-3 px-2 text-right text-neutral-900 font-semibold">
                            ₹{itemPrice.toFixed(2)}
                          </td>
                          <td className="py-3 px-2 text-right text-neutral-900 font-bold">
                            ₹{itemTotal.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-3 px-2 text-center text-neutral-500">
                        No items found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bill Summary */}
          <div className="border-t border-neutral-200 pt-4 space-y-2">
            <div className="flex justify-end gap-8">
              <div className="w-64">
                <div className="flex justify-between py-2 border-b border-neutral-100">
                  <span className="text-neutral-600">Subtotal:</span>
                  <span className="font-semibold text-neutral-900">
                    ₹{subtotal.toFixed(2)}
                  </span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between py-2 border-b border-neutral-100 text-green-600">
                    <span>Discount:</span>
                    <span className="font-semibold">-₹{discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between py-3 text-lg font-bold text-neutral-900 bg-neutral-50 px-2 rounded mt-2">
                  <span>Total:</span>
                  <span>₹{totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="border-t border-neutral-200 pt-4 text-sm">
            <p className="text-neutral-600">
              <span className="font-semibold">Payment Method:</span>{" "}
              <span className="capitalize font-semibold text-neutral-900">
                {order.paymentMethod || "Not Specified"}
              </span>
            </p>
          </div>

          {/* Footer */}
          <div className="border-t border-neutral-200 pt-4 text-center text-xs text-neutral-500">
            <p>Thank you for your purchase!</p>
            <p>For queries, contact support@saturnimports.com</p>
          </div>
        </div>
      </div>
    </div>
  );
};
