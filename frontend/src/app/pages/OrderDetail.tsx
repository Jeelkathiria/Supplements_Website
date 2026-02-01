import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, AlertCircle } from 'lucide-react';
import * as orderService from '../../services/orderService';
import type { Order } from '../../services/orderService';

export const OrderDetail: React.FC = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Set active tab to 'orders' when viewing order details
    localStorage.setItem('accountActiveTab', 'orders');
  }, []);

  useEffect(() => {
    const loadOrder = async () => {
      try {
        setLoading(true);
        setError(null);
        if (!orderId) {
          setError('Order ID not found');
          return;
        }
        
        // Fetch all orders and find the one matching orderId
        const orders = await orderService.getUserOrders();
        const foundOrder = orders.find(o => o.id === orderId);
        
        if (!foundOrder) {
          setError('Order not found');
          return;
        }
        
        setOrder(foundOrder);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load order details');
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [orderId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center py-12 px-4">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-teal-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-700">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-neutral-50 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => navigate('/account')}
            className="flex items-center gap-2 text-teal-900 hover:text-teal-800 mb-8 font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Account
          </button>
          
          <div className="bg-white rounded-lg shadow-sm p-8 border border-neutral-200">
            <div className="flex items-start gap-3 text-red-600">
              <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold mb-1">Error Loading Order</p>
                <p className="text-sm">{error || 'Order not found'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const baseUrl = apiBaseUrl.replace('/api', '');

  const getImageUrl = (imageUrls: any): string | null => {
    if (Array.isArray(imageUrls) && imageUrls.length > 0) {
      const imgPath = imageUrls[0];
      return imgPath.startsWith('http') ? imgPath : `${baseUrl}${imgPath}`;
    }
    return null;
  };

  const orderDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const orderTime = new Date(order.createdAt).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const statusColor: { [key: string]: string } = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    CONFIRMED: 'bg-blue-100 text-blue-800',
    DELIVERED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
  };

  return (
    <div className="min-h-screen bg-neutral-50 py-8 md:py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/account')}
              className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-neutral-200 transition"
            >
              <ArrowLeft className="w-5 h-5 text-neutral-600" />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-neutral-900">Order Details</h1>
              <p className="text-sm text-neutral-600">Order #{order.id.slice(-8).toUpperCase()}</p>
            </div>
          </div>
          
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-teal-900 text-white rounded-lg hover:bg-teal-800 transition font-medium print:hidden"
          >
            <Download className="w-4 h-4" />
            Print
          </button>
        </div>

        {/* Ticket/Bill Container */}
        <div className="bg-white rounded-lg shadow-md border border-neutral-200 overflow-hidden">
          {/* Order Header Section */}
          <div className="bg-gradient-to-r from-teal-900 to-teal-800 text-white px-6 md:px-8 py-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              <div>
                <p className="text-xs font-semibold text-teal-100 uppercase mb-1">Order Date</p>
                <p className="font-bold text-lg">{orderDate}</p>
                <p className="text-xs text-teal-100">{orderTime}</p>
              </div>
              
              <div>
                <p className="text-xs font-semibold text-teal-100 uppercase mb-1">Order Status</p>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${statusColor[order.status] || 'bg-gray-100 text-gray-800'}`}>
                  {order.status}
                </span>
              </div>
              
              <div>
                <p className="text-xs font-semibold text-teal-100 uppercase mb-1">Payment Method</p>
                <p className="font-bold text-lg capitalize">
                  {order?.paymentMethod ? order.paymentMethod.replace('_', ' ') : 'COD'}
                </p>
              </div>
              
              <div>
                <p className="text-xs font-semibold text-teal-100 uppercase mb-1">Order ID</p>
                <p className="font-mono text-sm break-all">{order.id}</p>
              </div>
            </div>
          </div>

          {/* Delivery Address Section */}
          <div className="px-6 md:px-8 py-6 border-b border-neutral-200 bg-neutral-50">
            <h3 className="text-lg font-bold text-neutral-900 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-teal-900 rounded-full"></span>
              Delivery Address
            </h3>
            <div className="bg-white p-4 rounded-lg border border-neutral-200">
              <p className="font-bold text-neutral-900 text-lg mb-1">{order.address?.name}</p>
              <p className="text-neutral-700 text-sm mb-1">{order.address?.phone}</p>
              <p className="text-neutral-700 text-sm leading-relaxed">
                {order.address?.address}<br />
                {order.address?.city}, {order.address?.state} {order.address?.pincode}
              </p>
            </div>
          </div>

          {/* Items Section */}
          <div className="font-mono px-6 md:px-8 py-6 border-b border-neutral-200">
            <h3 className="text-lg font-bold text-neutral-900 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-teal-900 rounded-full"></span>
              Order Items
            </h3>
            
            <div className="space-y-4">
              {order.items.map((item, idx) => {
                const imageUrl = getImageUrl(item.product?.imageUrls);
                return (
                  <div key={idx} className="flex gap-4 pb-4 border-b border-neutral-200 last:border-0 last:pb-0">
                    {imageUrl && (
                      <div className="flex-shrink-0">
                        <img
                          src={imageUrl}
                          alt={item.product?.name}
                          className="w-20 h-20 md:w-24 md:h-24 object-cover rounded-lg border border-neutral-200"
                        />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-neutral-900 mb-1">
                        {item.product?.name || item.productName}
                      </p>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                        <div className="bg-neutral-50 p-2 rounded">
                          <p className="text-xs text-neutral-600 font-semibold">Price per Unit</p>
                          <p className="font-bold text-neutral-900">₹{item.price.toFixed(2)}</p>
                        </div>
                        <div className="bg-neutral-50 p-2 rounded">
                          <p className="text-xs text-neutral-600 font-semibold">Quantity</p>
                          <p className="font-bold text-neutral-900">{item.quantity}</p>
                        </div>
                      </div>

                      {(item.flavor || item.size) && (
                        <div className="text-xs text-neutral-600 mb-2 space-y-0.5">
                          {item.flavor && <p><span className="font-semibold">Flavor:</span> {item.flavor}</p>}
                          {item.size && <p><span className="font-semibold">Size:</span> {item.size}</p>}
                        </div>
                      )}
                      
                      <p className="text-sm font-bold text-teal-900 bg-teal-50 inline-block px-2 py-1 rounded">
                        Subtotal: ₹{(item.quantity * item.price).toFixed(2)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bill Summary Section */}
          <div className="font-mono px-6 md:px-8 py-8 border-t border-neutral-200">
            <h3 className="text-center text-xl font-bold text-neutral-900 mb-8 tracking-wide">ORDER BILL</h3>
            
            <div className="max-w-2xl space-y-4">
              {/* Order Items */}
              {order.items.map((item, idx) => (
                <div key={idx}>
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-bold text-neutral-900 flex-1">
                      {(item.product?.name || item.productName).toUpperCase()}
                    </p>
                    <p className="font-bold text-neutral-900 text-right">
                      ₹{(item.quantity * item.price).toFixed(2)}
                    </p>
                  </div>
                  <p className="text-sm text-neutral-600 mb-2">
                    {item.quantity} × ₹{item.price.toFixed(2)}
                  </p>
                  
                  {/* Show discount per item if applicable */}
                  {order.discountAmount > 0 && idx === 0 && (
                    <p className="text-sm text-green-600 font-semibold mb-3">
                      Saved ₹{order.discountAmount.toFixed(2)}
                    </p>
                  )}

                  {/* Dotted separator */}
                  {idx < order.items.length - 1 && (
                    <div className="my-3 border-b border-dotted border-neutral-300"></div>
                  )}
                </div>
              ))}

              {/* Final Separator */}
              <div className="my-4 border-b border-dotted border-neutral-300"></div>

              {/* Total */}
              <div className="flex justify-between items-center pt-2">
                <p className="font-bold text-neutral-900">Total</p>
                <p className="font-bold text-neutral-900 text-lg">₹{order.totalAmount.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 md:px-8 py-4 bg-neutral-100 border-t border-neutral-200 text-center text-xs text-neutral-600">
            <p>
              Thank you for your order! For any queries, please{" "}
              <a
                href="/contact"
                className="text-teal-700 font-semibold hover:underline"
              >
                contact us
              </a>
              .
            </p>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-6 print:hidden">
          <button
            onClick={() => navigate('/account')}
            className="w-full px-4 py-3 bg-neutral-200 text-neutral-800 rounded-lg hover:bg-neutral-300 transition font-medium"
          >
            Back to My Orders
          </button>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            background: white;
          }
          .bg-neutral-50 {
            background: white;
          }
          button {
            display: none;
          }
          .max-w-4xl {
            max-width: 100%;
          }
        }
      `}</style>
    </div>
  );
};
