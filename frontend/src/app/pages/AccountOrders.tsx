import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../components/context/AuthContext';
import { useCart } from '../components/context/CartContext';
import { BillModal } from '../components/BillModal';
import { toast } from 'sonner';
import * as orderService from '../../services/orderService';
import * as productService from '../../services/productService';
import type { Order } from '../../services/orderService';

export const AccountOrders: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | 'buyAgain' | 'notYetShipped' | 'cancelled'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [selectedOrderForBill, setSelectedOrderForBill] = useState<Order | null>(null);
  const [reorderingOrderId, setReorderingOrderId] = useState<string | null>(null);

  const ORDERS_PER_PAGE = 5;

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadOrders();
  }, [isAuthenticated, navigate]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await orderService.getUserOrders();
      setOrders(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleReorder = async (order: Order) => {
    try {
      setReorderingOrderId(order.id);

      const allProducts = await productService.fetchProducts();
      const productMap = new Map(allProducts.map(p => [p.id, p]));

      const outOfStockItems = order.items.filter(item => {
        const product = productMap.get(item.productId);
        return product?.isOutOfStock;
      });

      if (outOfStockItems.length > 0) {
        const outOfStockNames = outOfStockItems.map(item => item.product?.name || item.productName).join(', ');
        toast.error(`Sorry! ${outOfStockNames} ${outOfStockItems.length === 1 ? 'is' : 'are'} out of stock`);
        return;
      }

      for (const item of order.items) {
        await addToCart(item.product, item.quantity, item.flavor, item.size);
      }

      toast.success('Order added to cart! Redirecting...');
      setTimeout(() => {
        navigate('/cart');
      }, 1500);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to reorder');
    } finally {
      setReorderingOrderId(null);
    }
  };

  const handleShowInvoice = (order: Order) => {
    setSelectedOrderForBill(order);
    setIsBillModalOpen(true);
  };

  const getFilteredOrders = () => {
    switch (orderStatusFilter) {
      case 'buyAgain':
        return orders.filter(o => o.status === 'DELIVERED');
      case 'notYetShipped':
        return orders.filter(o => o.status === 'PENDING' || o.status === 'CONFIRMED');
      case 'cancelled':
        return orders.filter(o => o.status === 'CANCELLED');
      case 'all':
      default:
        return orders;
    }
  };

  const filteredOrders = getFilteredOrders();
  const totalPages = Math.ceil(filteredOrders.length / ORDERS_PER_PAGE);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * ORDERS_PER_PAGE,
    currentPage * ORDERS_PER_PAGE
  );

  if (loading) {
    return <div className="bg-white rounded-lg shadow-sm p-6 text-center">Loading orders...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-neutral-900">Your Orders</h2>

        {/* Filter Tabs */}
        <div className="flex items-center gap-8 border-b border-neutral-200 mt-4 overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: 'Orders' },
            { id: 'buyAgain', label: 'Buy Again' },
            { id: 'notYetShipped', label: 'Not Yet Shipped' },
            { id: 'cancelled', label: 'Cancelled' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setOrderStatusFilter(tab.id as any);
                setCurrentPage(1);
              }}
              className={`pb-3 text-sm font-medium whitespace-nowrap transition-colors relative ${
                orderStatusFilter === tab.id
                  ? 'text-teal-900 font-bold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-teal-900'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      {paginatedOrders.length > 0 ? (
        <div className="space-y-4">
          {paginatedOrders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden hover:shadow-md transition-shadow">
              {/* Order Header */}
              <div className="bg-gradient-to-r from-neutral-50 to-neutral-100 px-4 md:px-6 py-4 md:py-5 border-b border-neutral-200">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs md:text-sm text-neutral-600 font-medium">Order Date</span>
                      <span className="text-sm md:text-base font-semibold text-neutral-900">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>

                    {/* Delivery Address */}
                    <div className="group relative">
                      <button className="flex items-center gap-1 text-teal-700 hover:text-orange-700 group-hover:underline text-[12px] md:text-[13px] font-medium">
                        <span className="truncate max-w-[80px] md:max-w-none">{order.address?.name}</span>
                        <ChevronDown className="w-3.5 h-3.5 transition-transform group-hover:rotate-180" />
                      </button>

                      {/* Hover Address Card */}
                      {order.address && (
                        <div className="absolute left-0 top-full mt-2 z-50 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-200">
                          <div className="bg-white border border-neutral-200 rounded-lg shadow-xl p-4 w-64 text-neutral-800 text-xs">
                            <div className="absolute -top-1.5 left-6 w-3 h-3 bg-white border-l border-t border-neutral-200 rotate-45"></div>
                            <p className="font-bold mb-1 text-sm">{order.address.name}</p>
                            <p className="leading-relaxed">
                              {order.address.address}
                              <br />
                              {order.address.city}, {order.address.state} {order.address.pincode}
                              <br />
                              India
                            </p>
                            {order.address.phone && <p className="mt-2 font-semibold">Phone: {order.address.phone}</p>}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="uppercase font-bold tracking-wider mb-0.5 text-[9px] md:text-[10px]">
                      Order # {order.id.slice(-12).toUpperCase()}
                    </p>
                    <div className="flex items-center justify-end gap-2 md:gap-3 text-teal-700 font-medium text-[12px] md:text-[13px]">
                      <button
                        onClick={() => navigate(`/account/order/${order.id}`)}
                        className="hover:text-orange-700 hover:underline"
                      >
                        Details
                      </button>
                      <span className="text-neutral-300 font-light">|</span>
                      <button
                        onClick={() => handleShowInvoice(order)}
                        className="hover:text-orange-700 hover:underline"
                      >
                        Invoice
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Body */}
              <div className="p-4 md:p-6">
                <h3 className={`text-[17px] font-bold mb-4 ${order.status === 'DELIVERED' ? 'text-neutral-900' : 'text-emerald-700'}`}>
                  {order.status === 'DELIVERED'
                    ? 'Delivered'
                    : order.status === 'CONFIRMED'
                    ? 'Confirmed'
                    : 'Status: ' + order.status}
                </h3>

                <div className="flex flex-col lg:flex-row gap-8">
                  <div className="flex-1 space-y-6">
                    {order.items.map((item, idx) => {
                      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
                      const baseUrl = apiBaseUrl.replace('/api', '');
                      let imageUrl = null;
                      if (Array.isArray(item.product?.imageUrls) && item.product.imageUrls.length > 0) {
                        const imgPath = item.product.imageUrls[0];
                        imageUrl = imgPath.startsWith('http') ? imgPath : `${baseUrl}${imgPath}`;
                      }

                      return (
                        <div key={idx} className="flex gap-4">
                          <div className="w-20 h-20 md:w-24 md:h-24 bg-neutral-50 rounded-lg border border-neutral-100 flex-shrink-0 flex items-center justify-center overflow-hidden">
                            {imageUrl ? (
                              <img
                                src={imageUrl}
                                alt={item.product?.name}
                                className="w-full h-full object-contain mix-blend-multiply"
                              />
                            ) : (
                              <Package className="w-8 h-8 text-neutral-300" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <button
                              onClick={() => navigate(`/product/${item.product?.id}`)}
                              className="text-sm md:text-base font-medium text-teal-800 hover:text-orange-700 leading-snug line-clamp-2 transition-colors text-left"
                            >
                              {item.product?.name || item.productName}
                            </button>
                            <p className="text-xs text-neutral-500 mt-1">Sold by: {item.product?.brand || 'Supplements Store'}</p>
                            <div className="mt-2 flex items-center gap-3">
                              <button
                                onClick={() => handleReorder(order)}
                                disabled={reorderingOrderId === order.id}
                                className="px-4 py-1.5 bg-yellow-400 hover:bg-yellow-500 disabled:bg-yellow-200 rounded-full text-xs font-bold shadow-sm transition-colors"
                              >
                                {reorderingOrderId === order.id ? 'Adding...' : 'Buy it again'}
                              </button>
                              <button
                                onClick={() => navigate(`/account/order/${order.id}`)}
                                className="text-xs text-neutral-600 hover:text-orange-700 underline font-medium"
                              >
                                View your item
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Right Actions Column */}
                  <div className="lg:w-64 space-y-2">
                    <button
                      onClick={() => navigate(`/account/order/${order.id}`)}
                      className="w-full py-2 bg-neutral-100 border border-neutral-300 rounded-lg text-sm font-medium hover:bg-neutral-200 transition-colors shadow-sm"
                    >
                      Track package
                    </button>
                    <button
                      onClick={() => navigate(`/request-cancellation/${order.id}`)}
                      className="w-full py-2 bg-neutral-100 border border-neutral-300 rounded-lg text-sm font-medium hover:bg-neutral-200 transition-colors shadow-sm"
                    >
                      Return or replace items
                    </button>
                    <button
                      onClick={() => navigate('/contact')}
                      className="w-full py-2 bg-neutral-100 border border-neutral-300 rounded-lg text-sm font-medium hover:bg-neutral-200 transition-colors shadow-sm"
                    >
                      Others
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-8 pb-8">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-neutral-300 text-neutral-600 hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                    currentPage === page
                      ? 'bg-teal-900 text-white'
                      : 'border border-neutral-300 text-neutral-700 hover:bg-neutral-100'
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-neutral-300 text-neutral-600 hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md p-12 text-center border border-neutral-200">
          <Package className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
          <p className="text-neutral-700 font-medium mb-2">
            {orderStatusFilter === 'all' && 'No orders yet'}
            {orderStatusFilter === 'buyAgain' && 'No delivered orders'}
            {orderStatusFilter === 'notYetShipped' && 'No pending orders'}
            {orderStatusFilter === 'cancelled' && 'No cancelled orders'}
          </p>
          <p className="text-neutral-500 text-sm mb-6">
            {orderStatusFilter === 'all' && 'Start shopping to see your orders here'}
            {orderStatusFilter === 'buyAgain' && 'Orders that are delivered will appear here'}
            {orderStatusFilter === 'notYetShipped' && 'You have no pending orders'}
            {orderStatusFilter === 'cancelled' && 'You have no cancelled orders'}
          </p>
          {orderStatusFilter === 'all' && (
            <button
              onClick={() => navigate('/products')}
              className="bg-teal-900 text-white px-6 py-2 rounded-lg hover:bg-teal-800 transition font-medium"
            >
              Continue Shopping
            </button>
          )}
        </div>
      )}

      {/* Invoice Modal */}
      <BillModal
        isOpen={isBillModalOpen}
        onClose={() => setIsBillModalOpen(false)}
        order={selectedOrderForBill}
      />
    </div>
  );
};

export default AccountOrders;
