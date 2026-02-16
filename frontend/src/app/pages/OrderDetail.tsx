import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, AlertCircle, FileText } from 'lucide-react';
import * as orderService from '../../services/orderService';
import { OrderCancellationService } from '../../services/orderCancellationService';
import { OrderTrackingTimeline } from '../components/OrderTrackingTimeline';
import type { Order } from '../../services/orderService';

export const OrderDetail: React.FC = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellationRequest, setCancellationRequest] = useState<any>(null);

  useEffect(() => {
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

        const orders = await orderService.getUserOrders();
        const foundOrder = orders.find(o => o.id === orderId);

        if (!foundOrder) {
          setError('Order not found');
          return;
        }

        setOrder(foundOrder);

        try {
          const request =
            await OrderCancellationService.getCancellationRequestByOrderId(orderId);
          setCancellationRequest(request);
        } catch {
          setCancellationRequest(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load order details');
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [orderId]);

  const handlePrint = () => window.print();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-neutral-600">
        Loading order details...
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen p-6 max-w-3xl mx-auto">
        <button
          onClick={() => navigate('/account')}
          className="flex items-center gap-2 text-sm text-blue-600 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Orders
        </button>

        <div className="bg-white p-6 border rounded">
          <div className="flex gap-2 text-red-600 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5" />
            {error}
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

  const statusColor: { [key: string]: string } = {
    PENDING: 'text-orange-600',
    CONFIRMED: 'text-blue-600',
    DELIVERED: 'text-green-600',
    CANCELLED: 'text-red-600',
  };

  return (
    <div className="min-h-screen bg-neutral-50 p-4 text-sm">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <button
              onClick={() => navigate('/account')}
              className="flex items-center gap-1 text-blue-600 mb-1"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Orders
            </button>
            <h1 className="text-lg font-semibold">Order #{order.id}</h1>
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1 text-xs text-blue-600 print:hidden"
          >
            <Download className="w-4 h-4" />
            Print
          </button>
        </div>

        {/* Order Summary */}
        <div className="bg-white border rounded p-4 mb-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <p className="text-neutral-500">Order Date</p>
              <p>{new Date(order.createdAt).toLocaleString('en-IN')}</p>
            </div>
            <div>
              <p className="text-neutral-500">Status</p>
              <p className={`font-medium ${statusColor[order.status]}`}>
                {order.status}
              </p>
            </div>
            <div>
              <p className="text-neutral-500">Payment</p>
              <p className="capitalize">
                {order.paymentMethod?.replace('_', ' ') || 'COD'}
              </p>
            </div>
            <div>
              <p className="text-neutral-500">Total</p>
              <p className="font-semibold">₹{order.totalAmount.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="bg-white border rounded p-4 mb-4 font-mono">
          <p className="font-semibold mb-3">Items</p>

          {order.items.map((item, idx) => {
            const imageUrl = getImageUrl(item.product?.imageUrls);
            return (
              <div
                key={idx}
                className="flex gap-3 py-3 border-b last:border-0"
              >
                {imageUrl && (
                  <img
                    src={imageUrl}
                    className="w-16 h-16 object-cover border rounded"
                  />
                )}

                <div className="flex-1">
                  <p className="font-medium">
                    {item.product?.name || item.productName}
                  </p>
                  <p className="text-neutral-500 text-xs">
                    {item.quantity} × ₹{item.price.toFixed(2)}
                  </p>

                  {(item.flavor || item.size) && (
                    <p className="text-xs text-neutral-400 mt-0.5">
                      {item.flavor && `Flavor: ${item.flavor}`}{" "}
                      {item.size && `| Size: ${item.size}`}
                    </p>
                  )}
                </div>

                <p className="font-medium">
                  ₹{(item.quantity * item.price).toFixed(2)}
                </p>
              </div>
            );
          })}
        </div>

          {/* Order Summary */}
          <div className="bg-white border rounded p-4 text-sm mb-6">
            <p className="font-semibold mb-3">Order Summary</p>

            {/* Totals */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>
                  ₹{order.items
                    .reduce((sum, i) => sum + i.price * i.quantity, 0)
                    .toFixed(2)}
                </span>
              </div>

              {order.discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>- ₹{order.discountAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>Total</span>
                <span>₹{order.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Cancellation Action */}
            {!cancellationRequest && order.status !== 'CANCELLED' && (
              <>
                <div className="mt-3 border-t" />
                <button
                  onClick={() => navigate(`/request-cancellation/${orderId}`)}
                  className="mt-2 text-xs text-neutral-500 hover:text-neutral-700 hover:underline flex items-center gap-1 print:hidden"
                >
                  Request order cancellation →
                </button>
              </>
            )}

            {/* Cancellation Status */}
            {cancellationRequest && (
              <>
                <div className="mt-3 border-t" />
                <div className="mt-3 bg-yellow-50 border rounded p-3 text-xs">
                  <p className="font-medium text-yellow-900">
                    Cancellation request submitted
                  </p>
                  <p className="text-yellow-700 mt-0.5">
                    Status: <span className="font-semibold">{cancellationRequest.status}</span>
                  </p>

                  <button
                    onClick={() => navigate(`/cancellation-ticket/${orderId}`)}
                    className="flex items-center gap-1 text-blue-600 mt-2 hover:underline"
                  >
                    <FileText className="w-3 h-3" />
                    View ticket
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Order Tracking Timeline */}
          <OrderTrackingTimeline 
            status={(order.status as 'PENDING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED') || 'PENDING'} 
            createdAt={order.createdAt}
            shippedAt={order.shippedAt}
            deliveredAt={order.deliveredAt}
          />

          {/* Footer */}
          <div className="px-6 md:px-8 py-4 bg-neutral-100 border-t border-neutral-200 text-center text-xs text-neutral-600 max-w-4xl mx-auto">
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
    </div>
    
  );
};
