import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import * as orderService from '../../services/orderService';
import { OrderCancellationService } from '../../services/orderCancellationService';
import type { Order } from '../../services/orderService';

export const RequestCancellation: React.FC = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load order');
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [orderId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason.trim()) {
      toast.error('Please provide a reason for cancellation');
      return;
    }

    if (reason.trim().length < 10) {
      toast.error('Reason must be at least 10 characters');
      return;
    }

    try {
      setSubmitting(true);

      await OrderCancellationService.createCancellationRequest(orderId!, reason.trim());

      setSubmitted(true);
      toast.success('Cancellation request submitted successfully');

      setTimeout(() => {
        navigate(`/cancellation-ticket/${orderId}`);
      }, 2000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit cancellation request';
      toast.error(errorMessage);
      console.error('Error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-neutral-600">
        Loading order details...
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen p-6 max-w-2xl mx-auto">
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

  return (
    <div className="min-h-screen bg-neutral-50 p-4 text-sm">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <button
          onClick={() => navigate('/account')}
          className="flex items-center gap-2 text-blue-600 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Orders
        </button>

        <h1 className="text-xl font-semibold mb-1">Request Order Cancellation</h1>
        <p className="text-neutral-600 mb-6">Please provide a reason for your cancellation request</p>

        {submitted ? (
          <div className="bg-white border rounded p-6 mb-6">
            <div className="flex gap-3 items-start">
              <CheckCircle className="w-6 h-6 text-green-600 mt-0.5" />
              <div>
                <p className="font-semibold text-green-900">Request Submitted Successfully</p>
                <p className="text-green-800 text-xs mt-1">
                  Your cancellation request has been submitted. You will be redirected to your cancellation ticket shortly.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Order Summary */}
            <div className="bg-white border rounded p-4 mb-6">
              <p className="font-semibold mb-3">Order Summary</p>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-neutral-600">Order ID</span>
                  <span className="font-medium">{order.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">Order Date</span>
                  <span>{new Date(order.createdAt).toLocaleDateString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">Items</span>
                  <span>{order.items.length} item{order.items.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex justify-between border-t pt-2 font-semibold">
                  <span>Total Amount</span>
                  <span>₹{order.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Cancellation Form */}
            <div className="bg-white border rounded p-6">
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label htmlFor="reason" className="block font-semibold mb-2">
                    Reason for Cancellation <span className="text-red-600">*</span>
                  </label>
                  <textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Please tell us why you want to cancel this order..."
                    disabled={submitting}
                    className="w-full border rounded p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none disabled:bg-neutral-50 disabled:text-neutral-500"
                    rows={5}
                  />
                  <div className="mt-2 flex justify-between items-center text-xs text-neutral-500">
                    <span>Minimum 10 characters required</span>
                    <span>{reason.length} / 500</span>
                  </div>
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4 text-xs">
                  <div className="flex gap-2">
                    <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-blue-900">
                      <p className="font-semibold mb-1">What happens next?</p>
                      <ul className="space-y-1 text-blue-800 list-disc list-inside">
                        <li>Your request will be reviewed by our team</li>
                        <li>You can track the status anytime from your account</li>
                        <li>Approval typically takes 1-2 business days</li>
                        <li>Refund will be processed after approval</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => navigate('/account')}
                    disabled={submitting}
                    className="flex-1 border rounded py-2 text-sm font-medium hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !reason.trim() || reason.trim().length < 10}
                    className="flex-1 bg-blue-600 text-white rounded py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {submitting ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
