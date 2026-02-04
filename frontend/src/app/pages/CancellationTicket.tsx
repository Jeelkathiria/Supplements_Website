import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Package,
} from 'lucide-react';
import { OrderCancellationService } from '../../services/orderCancellationService';
import * as orderService from '../../services/orderService';
import type { Order } from '../../services/orderService';

export const CancellationTicket: React.FC = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [cancellationRequest, setCancellationRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
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
          setError('No cancellation request found for this order');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-neutral-600">
        Loading cancellation ticket…
      </div>
    );
  }

  if (error || !order || !cancellationRequest) {
    return (
      <div className="min-h-screen p-6 max-w-2xl mx-auto">
        <button
          onClick={() => navigate('/account')}
          className="flex items-center gap-2 text-blue-600 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Orders
        </button>

        <div className="bg-white border rounded p-5 text-sm text-red-600 flex gap-2">
          <AlertCircle className="w-5 h-5 mt-0.5" />
          {error}
        </div>
      </div>
    );
  }

  const getStatusIcon = () => {
    switch (cancellationRequest.status) {
      case 'PENDING':
        return <Clock className="w-5 h-5 text-amber-500" />;
      case 'APPROVED':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'REJECTED':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Package className="w-5 h-5 text-neutral-400" />;
    }
  };

  const statusText =
    cancellationRequest.status === 'PENDING'
      ? 'Ticket Open'
      : cancellationRequest.status === 'APPROVED'
      ? 'Ticket Resolved'
      : 'Ticket Closed';


    const requestDate = new Date(cancellationRequest.createdAt).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    const requestTime = new Date(cancellationRequest.createdAt).toLocaleTimeString(
    'en-IN',
    {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }
  );


  return (
    <div className="min-h-screen bg-neutral-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Back */}
        <button
          onClick={() => navigate(`/order/${orderId}`)}
          className="flex items-center gap-2 text-blue-600 mb-4 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Order
        </button>

        {/* Ticket Card */}
        <div className="bg-white border rounded shadow-sm overflow-hidden">
          {/* Ticket Header */}
          <div className="p-4 border-b flex justify-between items-start">
            <div>
              <p className="text-xs text-neutral-500 uppercase">
                Cancellation Ticket
              </p>
              <h1 className="text-lg font-semibold mt-1">
                Ticket #{cancellationRequest.id.slice(0, 8).toUpperCase()}
              </h1>
              <p className="text-xs text-neutral-500 mt-0.5">
                Raised on {requestDate}
              </p>
            </div>

            <div className="flex items-center gap-2 text-sm font-medium">
              {getStatusIcon()}
              {statusText}
            </div>
          </div>

          {/* STATUS DETAILS */}
          <div className="px-6 md:px-8 py-6 border-b border-neutral-200">
            <p className="text-xs font-semibold text-neutral-500 uppercase mb-5">
              Status Details
            </p>

            <div className="space-y-6">
              {/* Step 1 */}
              <div className="flex items-start gap-4">
                {/* Dot + line */}
                <div className="flex flex-col items-center">
                  <span className="w-3 h-3 rounded-full bg-emerald-700 mt-1" />
                  <span className="w-px h-10 bg-neutral-300 mt-1" />
                </div>

                {/* Content */}
                <div>
                  <p className="font-semibold text-neutral-900">
                    Request Submitted
                  </p>
                  <p className="text-sm text-neutral-600">
                    {requestDate} at {requestTime}
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-4">
                {/* Dot */}
                <div className="flex flex-col items-center">
                  <span
                    className={`w-3 h-3 rounded-full ${
                      cancellationRequest.status === 'REJECTED'
                        ? 'bg-emerald-700'
                        : 'bg-neutral-300'
                    }`}
                  />
                </div>

                {/* Content */}
                <div>
                  <p className="font-semibold text-neutral-900">
                    {cancellationRequest.status === 'PENDING' && 'Request Under Review'}
                    {cancellationRequest.status === 'APPROVED' && 'Request Approved'}
                    {cancellationRequest.status === 'REJECTED' && 'Request Rejected'}
                  </p>
                  <p className="text-sm text-neutral-600">
                    {cancellationRequest.status === 'PENDING' &&
                      'Your cancellation request is being reviewed'}
                    {cancellationRequest.status === 'APPROVED' &&
                      'Your cancellation request has been approved'}
                    {cancellationRequest.status === 'REJECTED' &&
                      'Your cancellation request was not approved'}
                  </p>
                </div>
              </div>
            </div>
          </div>

                  

          {/* Reason */}
          <div className="p-4 border-b text-sm">
            <p className="font-medium mb-2">Reason provided</p>
            <div className="bg-neutral-50 border rounded p-3">
              {cancellationRequest.reason}
            </div>
          </div>

          {/* Order Snapshot */}
          <div className="p-4 border-b text-sm">
            <p className="font-medium mb-3">Order Snapshot</p>

            <div className="grid grid-cols-5 gap-6">
              {/* Order ID (wider) */}
              <div className="col-span-2">
                <p className="text-xs text-neutral-500 mb-0.5">Order ID</p>
                <p className="font-medium break-all">
                  {order.id}
                </p>
              </div>

              {/* Amount */}
              <div>
                <p className="text-xs text-neutral-500 mb-0.5">Amount</p>
                <p className="font-medium">
                  ₹{order.totalAmount.toFixed(2)}
                </p>
              </div>

              {/* Items */}
              <div>
                <p className="text-xs text-neutral-500 mb-0.5">Items</p>
                <p className="font-medium">
                  {order.items.length}
                </p>
              </div>
            </div>
          </div>


          {/* Info */}
          <div className="p-4 bg-blue-50 text-sm flex gap-2">
            <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
            <p className="text-blue-800">
              {cancellationRequest.status === 'PENDING' &&
                'Your ticket is open and under review.'}
              {cancellationRequest.status === 'APPROVED' &&
                'Your cancellation was approved. Refund will be processed.'}
              {cancellationRequest.status === 'REJECTED' &&
                'Your request was rejected. Contact support for help.'}
            </p>
          </div>

          {/* Actions */}
          <div className="p-4 border-t flex gap-3">
            <button
              onClick={() => window.print()}
              className="flex-1 flex items-center justify-center gap-2 bg-neutral-900 text-white py-2 rounded text-sm print:hidden"
            >
              <Download className="w-4 h-4" />
              Print Ticket
            </button>
            <button
              onClick={() => navigate('/account')}
              className="flex-1 border py-2 rounded text-sm"
            >
              View Orders
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          button {
            display: none !important;
          }
          body {
            background: white;
          }
        }
      `}</style>
    </div>
  );
};
