import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Check, Loader, AlertCircle, MapPin, Package, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import * as orderService from '../../services/orderService';
import type { Order } from '../../services/orderService';

export const OrderSuccess: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadOrder = async () => {
      if (!orderId) {
        setError('Order ID not found');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const orderData = await orderService.getOrder(orderId);
        setOrder(orderData);
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load order';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your order...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">Order Not Found</h1>
          <p className="text-center text-gray-600 mb-6">
            {error || 'We could not retrieve your order details.'}
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const estimatedDeliveryDate = new Date(order.createdAt);
  estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + 5);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Success Message */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-green-200 rounded-full animate-pulse"></div>
              <div className="relative bg-green-100 rounded-full p-4">
                <Check className="h-12 w-12 text-green-600" />
              </div>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
          <p className="text-lg text-gray-600 mb-4">Thank you for your purchase</p>
          <p className="text-sm text-gray-500">
            Order ID: <span className="font-semibold">{order.id}</span>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Details */}
          <div className="lg:col-span-2">
            {/* Order Items */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Package className="h-6 w-6 text-blue-600" />
                Order Items
              </h2>

              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex gap-4 pb-4 border-b border-gray-200">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{item.product.name}</p>
                      <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                      {item.flavor && <p className="text-sm text-gray-600">Flavor: {item.flavor}</p>}
                      {item.size && <p className="text-sm text-gray-600">Size: {item.size}</p>}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">₹{(item.price * item.quantity).toFixed(2)}</p>
                      <p className="text-sm text-gray-500">{item.quantity} x ₹{item.price.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Address */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="h-6 w-6 text-blue-600" />
                Delivery Address
              </h2>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-semibold text-gray-900">{order.address.name}</p>
                <p className="text-gray-600 mt-1">{order.address.address}</p>
                <p className="text-gray-600">
                  {order.address.city}, {order.address.state} {order.address.pincode}
                </p>
                <p className="text-gray-600 mt-2">Phone: {order.address.phone || 'N/A'}</p>
              </div>

              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-blue-900">Estimated Delivery</p>
                    <p className="text-sm text-blue-700">
                      {estimatedDeliveryDate.toLocaleDateString('en-IN', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>

              <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>₹{(order.totalAmount - order.gstAmount).toFixed(2)}</span>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-₹{order.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>GST</span>
                  <span>₹{order.gstAmount.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-between text-lg font-bold text-gray-900 mb-6">
                <span>Total Amount</span>
                <span className="text-green-600">₹{order.totalAmount.toFixed(2)}</span>
              </div>

              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                  <span className="font-semibold">Status:</span> {order.status.toUpperCase()}
                </p>
              </div>

              <button
                onClick={() => navigate('/')}
                className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition mb-2"
              >
                Continue Shopping
              </button>

              <button
                onClick={() => navigate('/account')}
                className="w-full py-2 px-4 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition"
              >
                View My Orders
              </button>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">What's Next?</h3>
          <div className="space-y-3 text-gray-600">
            <p>
              ✓ <span className="font-semibold">Order Confirmed</span> - Your order has been successfully placed
            </p>
            <p>
              ⚙️ <span className="font-semibold">Processing</span> - We're preparing your order for shipment
            </p>
            <p>
              🚚 <span className="font-semibold">Shipping</span> - Your package will be dispatched within 1-2 business days
            </p>
            <p>
              📦 <span className="font-semibold">Delivery</span> - Estimated delivery by{' '}
              {estimatedDeliveryDate.toLocaleDateString('en-IN', {
                month: 'short',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
