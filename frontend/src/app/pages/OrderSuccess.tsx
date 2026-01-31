import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Check,
  Loader,
  AlertCircle,
  MapPin,
  Package,
  Dumbbell,
  Calendar,
  HandHeart,
} from 'lucide-react';
import { toast } from 'sonner';
import * as orderService from '../../services/orderService';
import type { Order } from '../../services/orderService';

export const OrderSuccess: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    const loadOrder = async () => {
      if (!orderId) {
        setError('Order ID not found');
        setLoading(false);
        return;
      }

      try {
        const orderData = await orderService.getOrder(orderId);
        setOrder(orderData);
        
        // Delay showing animation for better visual effect
        setTimeout(() => {
          setShowAnimation(true);
        }, 100);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to load order';
        setError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="animate-bounce">
              <Check className="h-16 w-16 text-green-500" />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-lg font-semibold text-gray-900">Processing your order...</p>
            <p className="text-sm text-gray-600">Please wait while we confirm your order</p>
          </div>
          <div className="flex justify-center gap-2">
            <Loader className="h-5 w-5 text-green-600 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-md shadow-sm text-center">
          <AlertCircle className="h-10 w-10 text-red-600 mx-auto mb-4" />
          <p className="text-gray-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="max-w-5xl mx-auto px-4 py-10">

        {/* SUCCESS HEADER */}
        <div className={`relative bg-gradient-to-br from-white via-gray-50 to-gray-100 border border-gray-200 rounded-xl p-8 mb-8 text-center shadow-md overflow-hidden transition-all duration-700 ${
          showAnimation ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}>

          {/* Background decorative icons */}
          <Dumbbell className="absolute -top-6 -left-6 h-32 w-32 text-gray-200 rotate-12" />
          <Package className="absolute -bottom-6 -right-6 h-32 w-32 text-gray-200 -rotate-12" />

          {/* Subtle accent ring */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-2 border border-dashed border-gray-200 rounded-xl"></div>
          </div>

          {/* Success icon */}
          <div className="relative flex justify-center mb-5">
            <div className={`bg-green-100 rounded-full p-4 ring-4 ring-green-50 transition-all duration-500 ${
              showAnimation ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
            }`}>
              <Check className={`h-10 w-10 text-green-600 transition-all duration-700 ${
                showAnimation ? 'animate-pulse' : ''
              }`} />
            </div>
          </div>

          {/* Title */}
          <h1 className="relative text-2xl font-semibold text-gray-900 mb-2">
            Order placed successfully
          </h1>

          {/* Thin divider */}
          <div className="mx-auto mb-3 h-px w-24 bg-gray-300"></div>

          {/* Order date */}
          <p className="relative text-sm text-gray-600 flex justify-center items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span>
              {new Date(order.createdAt).toLocaleDateString('en-IN', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>
          </p>

          {/* Tagline */}
          <p className="relative mt-3 text-sm font-medium text-gray-700 flex justify-center items-center gap-2">
            <Dumbbell className="h-4 w-4 text-gray-600" />
            Powering your fitness goals
          </p>
        </div>


        {/* NOTE */}
        <div className={`bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6 text-sm text-gray-800 shadow-sm transition-all duration-700 delay-200 ${
          showAnimation ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          <p className="font-medium mb-1">Note:</p>
          <p>
            Orders placed before <span className="font-semibold">4:00 PM</span>{' '}
            will be shipped on the{' '}
            <span className="font-semibold">same day</span>.
          </p>
          <p className="mt-2 font-medium">
            Thank you, <span>{order.address.name}</span>!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT */}
          <div className={`lg:col-span-2 space-y-8 transition-all duration-700 delay-300 ${
            showAnimation ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
          }`}>

          {/* ORDER ITEMS – BILL / TICKET STYLE */}
          <div className="bg-white border border-gray-200 rounded-md p-6 shadow-sm font-mono">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              Order Items
            </h2>

            <div className="mt-2 mb-4 h-px bg-gray-200"></div>

            <div className="space-y-4">
              {order.items.map((item) => {
                const apiBaseUrl =
                  import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
                const baseUrl = apiBaseUrl.replace('/api', '');
                const imageUrl = item.product?.imageUrls?.[0]
                  ? item.product.imageUrls[0].startsWith('http')
                    ? item.product.imageUrls[0]
                    : `${baseUrl}${item.product.imageUrls[0]}`
                  : null;

                const itemTotal = item.price * item.quantity;
                const savings =
                  item.product.discountPercent > 0
                    ? (item.product.basePrice - item.price) * item.quantity
                    : 0;

                return (
                  <div
                    key={item.id}
                    className="flex gap-4 pb-4 border-b last:border-b-0"
                  >
                    {/* Product Image */}
                    {imageUrl && (
                      <img
                        src={imageUrl}
                        alt={item.product.name}
                        className="w-20 h-20 object-cover border rounded-md"
                      />
                    )}

                    {/* Product Details */}
                    <div className="flex-1 space-y-1">
                      <p className="font-semibold text-gray-900">{item.product.name}</p>

                      <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                        <span>Qty: {item.quantity}</span>
                        {item.flavor && <span>Flavor: {item.flavor}</span>}
                        {item.size && <span>Size: {item.size}</span>}
                      </div>

                      {/* Savings */}
                      {savings > 0 && (
                        <p className="text-xs text-green-600">
                          You saved ₹{savings.toFixed(0)}
                        </p>
                      )}
                    </div>

                    {/* Price */}
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        ₹{itemTotal.toFixed(0)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {item.quantity} × ₹{item.price.toFixed(0)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total Section */}
            <div className="mt-4 pt-4 border-t border-dashed border-gray-300 flex justify-between font-bold text-gray-900 text-sm">
              <span>Total</span>
              <span>
                ₹
                {order.items
                  .reduce((sum, item) => sum + item.price * item.quantity, 0)
                  .toFixed(0)}
              </span>
            </div>

            {/* Footer Note */}
            <div className="mt-4 text-center text-xs text-gray-500 flex items-center justify-center gap-1">
              <HandHeart className="w-4 h-4 text-gray-400" />
              <span>Thank you for your order!</span>
            </div>
          </div>



            {/* DELIVERY ADDRESS */}
            <div className="bg-white border border-gray-200 rounded-md p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-gray-600" />
                Delivery Address
              </h2>

              <div className="border border-gray-200 rounded-md p-4">
                <p className="font-medium">{order.address.name}</p>
                <p className="text-gray-600">{order.address.address}</p>
                <p className="text-gray-600">
                  {order.address.city}, {order.address.state}{' '}
                  {order.address.pincode}
                </p>
                <p className="text-gray-600 mt-1">
                  Phone: {order.address.phone || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR */}
          <div className={`lg:col-span-1 transition-all duration-700 delay-400 ${
            showAnimation ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
          }`}>
            <div className="bg-white border border-gray-200 rounded-md p-6 sticky top-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-6">Order Summary</h2>

              <div className="space-y-3 pb-4 border-b mb-4">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>₹{order.totalAmount.toFixed(0)}</span>
                </div>

                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-₹{order.discountAmount.toFixed(0)}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between font-semibold text-lg mb-4">
                <span>Total</span>
                <span className="text-green-600">
                  ₹{order.totalAmount.toFixed(0)}
                </span>
              </div>

              <div className="mb-6 text-sm">
                <span className="font-medium">Status:</span>{' '}
                {order.status.toUpperCase()}
              </div>

              <button
                onClick={() => navigate('/')}
                className="w-full py-2 bg-yellow-400 hover:bg-yellow-500 text-black rounded font-semibold mb-2"
              >
                Continue Shopping
              </button>

              <button
                onClick={() => navigate('/account')}
                className="w-full py-2 border border-gray-300 rounded font-semibold hover:bg-gray-100"
              >
                View Your Orders
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};
