import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle, CheckCircle, Upload, X, Play } from 'lucide-react';
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
  const [upiId, setUpiId] = useState('');
  
  // Video upload state
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [cancellationRequestId, setCancellationRequestId] = useState<string | null>(null);

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

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska'];
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload MP4, WebM, MOV, AVI, or MKV format.');
      return;
    }

    // Validate file size (50MB limit)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('File size must be less than 50MB');
      return;
    }

    setVideoFile(file);
    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setVideoPreview(previewUrl);
  };

  const handleRemoveVideo = () => {
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
    }
    setVideoFile(null);
    setVideoPreview(null);
  };

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

    // For delivered orders, video and UPI ID are required
    if (order?.status === 'DELIVERED') {
      if (!videoFile) {
        toast.error('Video evidence is required for delivered orders');
        return;
      }
      if (!upiId.trim()) {
        toast.error('UPI ID is required for refund processing');
        return;
      }
      // Simple UPI ID validation (format: username@bankname)
      const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z]{3,}$/;
      if (!upiRegex.test(upiId.trim())) {
        toast.error('Please enter a valid UPI ID (e.g., yourname@upi)');
        return;
      }
    }

    try {
      setSubmitting(true);

      const request = await OrderCancellationService.createCancellationRequest(
        orderId!,
        reason.trim(),
        order?.status === 'DELIVERED' ? upiId.trim() : undefined
      );
      setCancellationRequestId(request.id);

      // If video is provided, upload it
      if (videoFile && order?.status === 'DELIVERED') {
        setUploadingVideo(true);
        try {
          await OrderCancellationService.uploadVideo(request.id, videoFile);
          toast.success('Video uploaded successfully');
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to upload video';
          toast.error(errorMessage);
          console.error('Video upload error:', err);
        } finally {
          setUploadingVideo(false);
        }
      }

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

  // Show error if order cannot be cancelled
  if (order && order.status === 'CANCELLED') {
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
            This order is already cancelled
          </div>
        </div>
      </div>
    );
  }

  // Show error if trying to cancel during shipment
  if (order && order.status === 'SHIPPED') {
    return (
      <div className="min-h-screen p-6 max-w-2xl mx-auto">
        <button
          onClick={() => navigate('/account')}
          className="flex items-center gap-2 text-sm text-blue-600 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Orders
        </button>

        <div className="bg-yellow-50 border border-yellow-200 rounded p-6">
          <div className="flex gap-3">
            <AlertCircle className="w-6 h-6 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-semibold text-yellow-900 mb-2">Cannot Cancel During Shipment</p>
              <p className="text-yellow-800">
                Your order is currently in transit. Once your order is delivered and if you find any defects, 
                you can then request cancellation by uploading a video showing the damage during unpacking.
              </p>
              <button
                onClick={() => navigate('/account')}
                className="mt-4 text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                Back to Orders
              </button>
            </div>
          </div>
        </div>
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
                    disabled={submitting || uploadingVideo}
                    className="w-full border rounded p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none disabled:bg-neutral-50 disabled:text-neutral-500"
                    rows={5}
                  />
                  <div className="mt-2 flex justify-between items-center text-xs text-neutral-500">
                    <span>Minimum 10 characters required</span>
                    <span>{reason.length} / 500</span>
                  </div>
                </div>

                {/* UPI ID Section - Only for Delivered Orders */}
                {order.status === 'DELIVERED' && (
                  <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded">
                    <label htmlFor="upiId" className="block font-semibold mb-2 text-green-900 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      UPI ID for Refund <span className="text-red-600">*</span>
                    </label>
                    <p className="text-green-800 text-xs mb-3">
                      Please provide your UPI ID where we will refund the amount after approval. This is required to process your refund.
                    </p>
                    <input
                      id="upiId"
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="e.g., yourname@upi or yourname@paytm"
                      disabled={submitting || uploadingVideo}
                      className="w-full border rounded p-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-neutral-50 disabled:text-neutral-500"
                    />
                    <p className="text-xs text-green-700 mt-2">
                      Format: username@bankname (e.g., john@upi, jane@paytm)
                    </p>
                  </div>
                )}                {/* Video Upload Section - Only for Delivered Orders */}
                {order.status === 'DELIVERED' && (
                  <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded">
                    <p className="font-semibold text-orange-900 mb-3 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Video Evidence Required
                    </p>
                    <p className="text-orange-800 text-xs mb-4">
                      To process your cancellation request for a delivered order, please record and upload a video showing any defects found during unpacking. This video is mandatory for defect claims.
                    </p>

                    {!videoFile ? (
                      <div className="border-2 border-dashed border-orange-300 rounded-lg p-6 text-center">
                        <input
                          type="file"
                          id="video"
                          accept="video/*"
                          onChange={handleVideoSelect}
                          disabled={uploadingVideo || submitting}
                          className="hidden"
                        />
                        <label
                          htmlFor="video"
                          className="cursor-pointer flex flex-col items-center gap-2"
                        >
                          <Upload className="w-8 h-8 text-orange-600" />
                          <span className="font-medium text-orange-900">Upload Video</span>
                          <span className="text-xs text-orange-700">
                            MP4, WebM, MOV, AVI, MKV (Max 50MB)
                          </span>
                        </label>
                      </div>
                    ) : (
                      <div className="border border-orange-300 rounded-lg p-4 bg-white">
                        <div className="flex items-start gap-3">
                          <Play className="w-8 h-8 text-orange-600 mt-1 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="font-medium text-orange-900 text-sm break-words">
                              {videoFile.name}
                            </p>
                            <p className="text-xs text-orange-700 mt-1">
                              {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={handleRemoveVideo}
                            disabled={uploadingVideo || submitting}
                            className="flex-shrink-0 text-orange-600 hover:text-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4 text-xs">
                  <div className="flex gap-2">
                    <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-blue-900">
                      <p className="font-semibold mb-1">What happens next?</p>
                      <ul className="space-y-1 text-blue-800 list-disc list-inside">
                        <li>Your request will be reviewed by our team</li>
                        {order.status === 'DELIVERED' && <li>Video evidence will be verified</li>}
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
                    disabled={submitting || uploadingVideo}
                    className="flex-1 border rounded py-2 text-sm font-medium hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || uploadingVideo || !reason.trim() || reason.trim().length < 10 || (order.status === 'DELIVERED' && (!videoFile || !upiId.trim()))}
                    className="flex-1 bg-blue-600 text-white rounded py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {submitting ? 'Submitting...' : uploadingVideo ? 'Uploading video...' : 'Submit Request'}
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
