import React, { useState, useEffect, useRef } from "react";
import {
  AlertCircle,
  Search,
  X,
  Play,
  Check,
  Clock,
  XCircle,
  ChevronLeft,
  ChevronRight,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { OrderCancellationService } from "../../services/orderCancellationService";
import { BillModal } from "./BillModal";
import type { Order } from "../../services/orderService";

interface CancellationRequest {
  id: string;
  orderId: string;
  userId: string;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  videoUrl?: string;
  videoUploadedAt?: string;
  upiId?: string;
  createdAt: string;
  updatedAt: string;
  order?: Order;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
};

const STATUS_ICONS: Record<string, any> = {
  PENDING: Clock,
  APPROVED: Check,
  REJECTED: XCircle,
};

// Helper function to get full video URL
const getFullVideoUrl = (videoUrl: string) => {
  if (!videoUrl) return "";
  if (videoUrl.startsWith("http")) return videoUrl;
  const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  const backendBase = apiBase.replace("/api", "");
  return `${backendBase}${videoUrl}`;
};

interface AdminCancellationRequestsProps {
  cancellationType?: "all" | "after-delivery" | "pre-delivery";
  onCancellationApproved?: () => void;
  onPendingCountsChange?: (counts: { all: number; preDelivery: number; postDelivery: number; }) => void;
}

export const AdminCancellationRequests: React.FC<AdminCancellationRequestsProps> = ({ cancellationType = "all", onCancellationApproved, onPendingCountsChange }) => {
  const [requests, setRequests] = useState<CancellationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "PENDING" | "APPROVED" | "REJECTED">("all");
  const [selectedRequest, setSelectedRequest] = useState<CancellationRequest | null>(null);
  const [updatingRequestId, setUpdatingRequestId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [selectedBillOrder, setSelectedBillOrder] = useState<Order | null>(null);
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const CARDS_PER_PAGE = 9;
  
  // Track previous counts to avoid infinite loops
  const prevCountsRef = useRef({ all: 0, preDelivery: 0, postDelivery: 0 });

  // Helper function to calculate pending counts
  const calculatePendingCounts = (requestList: CancellationRequest[]) => {
    const pendingAll = requestList.filter(r => r.status === "PENDING").length;
    
    const pendingPreDelivery = requestList.filter(req => {
      if (req.status !== "PENDING") return false;
      const orderStatus = req.order?.status;
      return ["PENDING", "PAID", "SHIPPED"].includes(orderStatus || "");
    }).length;

    const pendingPostDelivery = requestList.filter(req => {
      if (req.status !== "PENDING") return false;
      const orderStatus = req.order?.status;
      const deliveredAt = req.order?.deliveredAt;
      const requestCreatedAt = new Date(req.createdAt);
      
      if (orderStatus === "DELIVERED") return true;
      if (orderStatus === "CANCELLED" && deliveredAt) {
        const deliveredDate = new Date(deliveredAt);
        return requestCreatedAt > deliveredDate;
      }
      return false;
    }).length;

    return { all: pendingAll, preDelivery: pendingPreDelivery, postDelivery: pendingPostDelivery };
  };

  // Helper function to report counts only if they changed
  const reportCountsIfChanged = (newCounts: { all: number; preDelivery: number; postDelivery: number }) => {
    if (
      prevCountsRef.current.all !== newCounts.all ||
      prevCountsRef.current.preDelivery !== newCounts.preDelivery ||
      prevCountsRef.current.postDelivery !== newCounts.postDelivery
    ) {
      prevCountsRef.current = newCounts;
      onPendingCountsChange?.(newCounts);
    }
  };

  useEffect(() => {
    loadCancellationRequests();
  }, []);

  // Calculate and report pending counts - only call callback when counts change
  useEffect(() => {
    const newCounts = calculatePendingCounts(requests);
    reportCountsIfChanged(newCounts);
  }, [requests, onPendingCountsChange]);

  // Reset filters when cancellation type changes
  useEffect(() => {
    setFilterStatus("all");
    setCurrentPage(1);
  }, [cancellationType]);

  const loadCancellationRequests = async () => {
    try {
      setIsLoading(true);
      const data = await OrderCancellationService.getAllRequests();
      setRequests(data);
      
      // Report counts immediately after loading
      const counts = calculatePendingCounts(data);
      reportCountsIfChanged(counts);
    } catch (error) {
      console.error("Error loading cancellation requests:", error);
      toast.error("Failed to load cancellation requests");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (
    requestId: string,
    newStatus: "APPROVED" | "REJECTED"
  ) => {
    try {
      setUpdatingRequestId(requestId);
      let updated;

      if (newStatus === "APPROVED") {
        updated = await OrderCancellationService.approveCancellation(requestId);
        
        // Get the request and order to show appropriate message
        const request = requests.find(r => r.id === requestId);
        const paymentMethod = request?.order?.paymentMethod;
        const orderStatus = request?.order?.status;
        const deliveredAt = request?.order?.deliveredAt;
        const requestCreatedAt = new Date(request?.createdAt || "");
        
        // Determine if it's post-delivery
        const isPostDelivery = deliveredAt && new Date(deliveredAt) < requestCreatedAt;
        
        // Show appropriate toast based on delivery status and payment method
        if (isPostDelivery) {
          toast.success('✓ Post-delivery cancellation approved! Refund initiated.');
        } else {
          if (paymentMethod === "upi") {
            toast.success('✓ Pre-delivery cancellation approved! Refund initiated.');
          } else {
            toast.success('✓ Pre-delivery cancellation approved! (No refund - Payment not collected)');
          }
        }
        
        // Trigger parent to refresh refunds (for post-delivery or pre-delivery UPI)
        if (isPostDelivery || paymentMethod === "upi") {
          onCancellationApproved?.();
        }
      } else {
        updated = await OrderCancellationService.rejectCancellation(requestId);
        toast.success('Request rejected');
      }

      setRequests((prev) =>
        prev.map((req) => (req.id === requestId ? updated : req))
      );
      setSelectedRequest(null);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update request";
      toast.error(errorMessage);
    } finally {
      setUpdatingRequestId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-neutral-600">Loading cancellation requests...</div>
      </div>
    );
  }

  // Filter requests based on cancellation type from prop, search and status
  const filteredRequests = requests.filter((req) => {
    const orderStatus = req.order?.status;
    const deliveredAt = req.order?.deliveredAt;
    const requestCreatedAt = new Date(req.createdAt);

    let isValidRequest = false;

    if (cancellationType === "pre-delivery") {
      // Pre-delivery: Orders that haven't been delivered yet (PENDING, PAID, SHIPPED)
      isValidRequest = ["PENDING", "PAID", "SHIPPED"].includes(orderStatus || "");
    } else if (cancellationType === "after-delivery") {
      // Post-delivery: Orders that have been delivered OR cancelled after delivery
      if (orderStatus === "DELIVERED") {
        isValidRequest = true;
      } else if (orderStatus === "CANCELLED" && deliveredAt) {
        const deliveredDate = new Date(deliveredAt);
        isValidRequest = requestCreatedAt > deliveredDate;
      }
    } else {
      // All: Show both pre-delivery and post-delivery
      isValidRequest = true;
    }

    if (!isValidRequest) {
      return false;
    }

    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      req.orderId.toLowerCase().includes(searchLower) ||
      req.userId.toLowerCase().includes(searchLower) ||
      req.reason.toLowerCase().includes(searchLower);

    // Only apply status filter when viewing "all" requests
    const matchesStatus =
      cancellationType === "all" 
        ? (filterStatus === "all" || req.status === filterStatus)
        : true;

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredRequests.length / CARDS_PER_PAGE);
  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * CARDS_PER_PAGE,
    currentPage * CARDS_PER_PAGE
  );

  return (
    <div className="space-y-4">
      {/* Cancellation Type Title */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-neutral-900">
          {cancellationType === "pre-delivery" && "Pre-Delivery Cancellation Requests"}
          {cancellationType === "after-delivery" && "Post-Delivery Cancellation Requests"}
          {cancellationType === "all" && "All Cancellation Requests"}
        </h2>
      </div>

      {/* Header with Filters */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input
            type="text"
            placeholder="Search by Order ID, User ID, or Reason..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-10 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                setCurrentPage(1);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Status Filter - Only show for "All" view */}
        {cancellationType === "all" && (
          <div className="flex gap-2 flex-wrap">
            {(["all", "PENDING", "APPROVED", "REJECTED"] as const).map(
              (status) => (
                <button
                  key={status}
                  onClick={() => {
                    setFilterStatus(status);
                    setCurrentPage(1);
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filterStatus === status
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-neutral-200 text-neutral-700 hover:bg-neutral-300"
                    }`}
                >
                  {status === "all" ? "All Requests" : status}
                </button>
              )
            )}
          </div>
        )}
      </div>

      {/* Requests Grid - PRE-DELIVERY TAB */}
      {cancellationType === "pre-delivery" ? (
        <>
          {paginatedRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="mb-4 h-12 w-12 text-neutral-400" />
              <p className="text-neutral-600">No pre-delivery cancellation requests found</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {paginatedRequests.map((request) => {
                  const StatusIcon = STATUS_ICONS[request.status];
                  const refundAmount = request.order?.totalAmount || 0;
                  
                  return (
                    <div
                      key={request.id}
                      onClick={() => setSelectedRequest(request)}
                      className="bg-white border border-neutral-200 rounded-lg shadow hover:shadow-lg transition overflow-hidden cursor-pointer"
                    >
                      {/* Header - Order ID */}
                      <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-neutral-200 px-3 py-2">
                        <p className="text-xs text-neutral-500 font-semibold">Order ID</p>
                        <p className="text-sm font-bold text-neutral-900 truncate">{request.orderId}</p>
                      </div>

                      {/* Compact Content */}
                      <div className="p-3 space-y-2 text-sm">
                        {/* Customer */}
                        <div>
                          <p className="text-xs text-neutral-500 font-semibold">Customer</p>
                          <p className="text-sm font-medium text-neutral-800">{request.order?.address?.name || "N/A"}</p>
                        </div>

                        {/* Reason */}
                        <div>
                          <p className="text-xs text-neutral-500 font-semibold">Reason</p>
                          <p className="text-xs text-neutral-700 line-clamp-2">{request.reason}</p>
                        </div>

                        {/* Refund Amount */}
                        <div>
                          <p className="text-xs text-neutral-500 font-semibold">Refund Amount</p>
                          <p className="text-base font-bold text-emerald-600">₹{refundAmount.toFixed(2)}</p>
                        </div>

                        {/* Status Badge */}
                        <div className="pt-1 pb-2 flex items-center justify-between">
                          <div
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                              request.status === "PENDING"
                                ? "bg-yellow-100 text-yellow-800"
                                : request.status === "APPROVED"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            <Clock size={11} />
                            {request.status}
                          </div>
                          {/* Bill Icon */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedBillOrder(request.order || null);
                              setIsBillModalOpen(true);
                            }}
                            className="p-1.5 hover:bg-blue-50 rounded transition text-blue-600 hover:text-blue-700"
                            title="View Bill"
                          >
                            <FileText size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <p className="text-sm text-neutral-600">
                    Page {currentPage} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(1, prev - 1))
                      }
                      disabled={currentPage === 1}
                      className="px-3 py-2 rounded-lg border border-neutral-300 text-sm font-medium hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 rounded-lg border border-neutral-300 text-sm font-medium hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      ) : cancellationType === "after-delivery" ? (
        /* Requests Horizontal Scroll - POST-DELIVERY TAB */
        <>
          {paginatedRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="mb-4 h-12 w-12 text-neutral-400" />
              <p className="text-neutral-600">No post-delivery cancellation requests found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Horizontal Scroll Container */}
              <div className="relative">
                <div
                  className="flex gap-4 overflow-x-auto pb-4 scroll-smooth"
                  ref={(el) => {
                    if (el) {
                      el.style.scrollBehavior = 'smooth';
                    }
                  }}
                  id="postDeliveryScroll"
                >
                  {paginatedRequests.map((request) => {
                    const StatusIcon = STATUS_ICONS[request.status];
                    return (
                      <div
                        key={request.id}
                        className="bg-white border border-neutral-200 rounded-lg p-3 flex-shrink-0 w-72 hover:shadow-lg transition cursor-pointer"
                      >
                        {/* Video Proof Section */}
                        <div className="mb-3 pb-3 border-b border-neutral-200">
                          {request.videoUrl ? (
                            <button
                              onClick={() => setSelectedRequest(request)}
                              className="flex items-center justify-center gap-2 w-full bg-blue-50 hover:bg-blue-100 text-blue-600 py-2 px-3 rounded-lg text-sm font-medium transition border border-blue-200"
                            >
                              <Play className="w-4 h-4" />
                              View Video
                            </button>
                          ) : (
                            <div className="bg-gray-100 text-gray-600 py-2 px-3 rounded-lg text-sm font-medium text-center">
                              ⚠️ No Video
                            </div>
                          )}
                        </div>

                        {/* Request Details */}
                        <div className="space-y-2 mb-3 text-xs">
                          {/* Request ID */}
                          <div>
                            <p className="text-neutral-500 font-mono">Request ID</p>
                            <p className="font-semibold text-neutral-900 truncate">{request.id.substring(0, 12)}...</p>
                          </div>

                          {/* Order ID */}
                          <div>
                            <p className="text-neutral-500 font-mono">Order ID</p>
                            <p className="font-semibold text-neutral-900 truncate">{request.orderId}</p>
                          </div>

                          {/* Customer Name */}
                          <div>
                            <p className="text-neutral-500 font-mono">Customer</p>
                            <p className="font-semibold text-neutral-900 truncate">{request.order?.address?.name || "N/A"}</p>
                          </div>

                          {/* Request Date */}
                          <div>
                            <p className="text-neutral-500 font-mono">Request Date</p>
                            <p className="font-semibold text-neutral-900">{new Date(request.createdAt).toLocaleDateString("en-IN")}</p>
                          </div>

                          {/* Reason (truncated) */}
                          <div>
                            <p className="text-neutral-500 font-mono">Reason</p>
                            <p className="text-neutral-700 line-clamp-2">{request.reason}</p>
                          </div>

                          {/* Refund Amount */}
                          <div>
                            <p className="text-neutral-500 font-mono">Refund Amount</p>
                            <p className="font-bold text-green-600">₹{request.order?.totalAmount.toFixed(2) || "0.00"}</p>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="mb-3 pb-3 border-b border-neutral-200">
                          <div className={`flex items-center gap-2 px-2 py-1.5 rounded-full text-xs font-semibold w-fit ${STATUS_COLORS[request.status]}`}>
                            <StatusIcon className="w-3.5 h-3.5" />
                            {request.status}
                          </div>
                        </div>

                        {/* Action Buttons and Bill Icon */}
                        <div className="flex gap-2 items-center">
                          <div className="flex-1 flex gap-2">
                            {request.status === "PENDING" ? (
                              <>
                                <button
                                  onClick={() =>
                                    handleStatusUpdate(request.id, "APPROVED")
                                  }
                                  disabled={updatingRequestId === request.id}
                                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-2 py-1.5 rounded text-xs font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  Accept & Refund
                                </button>
                                <button
                                  onClick={() =>
                                    handleStatusUpdate(request.id, "REJECTED")
                                  }
                                  disabled={updatingRequestId === request.id}
                                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-2 py-1.5 rounded text-xs font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  Reject
                                </button>
                              </>
                            ) : (
                              <div className={`flex-1 text-xs font-semibold text-center py-1.5 rounded ${
                                request.status === "APPROVED"
                                  ? "bg-green-50 text-green-800"
                                  : "bg-red-50 text-red-800"
                              }`}>
                                {request.status === "APPROVED" ? "✓ Approved" : "✕ Rejected"}
                              </div>
                            )}
                          </div>
                          {/* Bill Icon */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedBillOrder(request.order || null);
                              setIsBillModalOpen(true);
                            }}
                            className="p-2 hover:bg-blue-50 rounded transition text-blue-600 hover:text-blue-700"
                            title="View Bill"
                          >
                            <FileText size={18} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Scroll Navigation Buttons */}
                <button
                  onClick={() => {
                    const scroll = document.getElementById("postDeliveryScroll");
                    if (scroll) scroll.scrollLeft -= 300;
                  }}
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 bg-white border border-neutral-300 rounded-full p-1.5 hover:bg-neutral-50 transition z-10"
                >
                  <ChevronLeft className="w-5 h-5 text-neutral-600" />
                </button>
                <button
                  onClick={() => {
                    const scroll = document.getElementById("postDeliveryScroll");
                    if (scroll) scroll.scrollLeft += 300;
                  }}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 bg-white border border-neutral-300 rounded-full p-1.5 hover:bg-neutral-50 transition z-10"
                >
                  <ChevronRight className="w-5 h-5 text-neutral-600" />
                </button>
              </div>

              {/* Results Info */}
              <div className="text-sm text-neutral-600 px-1">
                Showing {paginatedRequests.length} of {filteredRequests.length} requests
              </div>
            </div>
          )}
        </>
      ) : (
        /* ALL CANCELLATIONS - GRID VIEW */
        <>
          {paginatedRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="mb-4 h-12 w-12 text-neutral-400" />
              <p className="text-neutral-600">No cancellation requests found</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedRequests.map((request) => {
                  const StatusIcon = STATUS_ICONS[request.status];
                  const orderStatus = request.order?.status;
                  const deliveredAt = request.order?.deliveredAt;
                  const requestCreatedAt = new Date(request.createdAt);
                  const isPostDelivery =
                    orderStatus === "DELIVERED" ||
                    (orderStatus === "CANCELLED" && deliveredAt && requestCreatedAt > new Date(deliveredAt));
                  
                  return (
                    <div
                      key={request.id}
                      className="bg-white border border-neutral-200 rounded-lg p-4 hover:shadow-lg transition cursor-pointer"
                      onClick={() => setSelectedRequest(request)}
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-sm font-mono text-neutral-500">
                            Order ID
                          </p>
                          <p className="font-bold text-neutral-900">
                            {request.orderId.substring(0, 8)}...
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedBillOrder(request.order || null);
                              setIsBillModalOpen(true);
                            }}
                            className="p-1.5 hover:bg-blue-50 rounded transition text-blue-600 hover:text-blue-700"
                            title="View Bill"
                          >
                            <FileText size={18} />
                          </button>
                          <div
                            className={`rounded-full p-2 ${STATUS_COLORS[request.status]}`}
                          >
                            <StatusIcon className="w-5 h-5" />
                          </div>
                        </div>
                      </div>

                      {/* Order and Request Status */}
                      <div className="flex gap-2 mb-3 flex-wrap">
                        <div
                          className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                            request.order?.status === "PENDING"
                              ? "bg-blue-100 text-blue-800"
                              : request.order?.status === "SHIPPED"
                              ? "bg-purple-100 text-purple-800"
                              : request.order?.status === "DELIVERED"
                              ? "bg-green-100 text-green-800"
                              : "bg-neutral-100 text-neutral-800"
                          }`}
                        >
                          Order: {request.order?.status || "UNKNOWN"}
                        </div>
                        <div
                          className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                            isPostDelivery
                              ? "bg-orange-100 text-orange-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {isPostDelivery ? "Post-Delivery" : "Pre-Delivery"}
                        </div>
                        <div
                          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[request.status]
                            }`}
                        >
                          {request.status}
                        </div>
                      </div>

                      {/* Reason Preview */}
                      <p className="text-sm text-neutral-600 line-clamp-2 mb-3">
                        {request.reason}
                      </p>

                      {/* Date */}
                      <p className="text-xs text-neutral-500">
                        {new Date(request.createdAt).toLocaleDateString("en-IN")}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <p className="text-sm text-neutral-600">
                    Page {currentPage} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(1, prev - 1))
                      }
                      disabled={currentPage === 1}
                      className="px-3 py-2 rounded-lg border border-neutral-300 text-sm font-medium hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 rounded-lg border border-neutral-300 text-sm font-medium hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">

            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-neutral-200 px-4 py-3 flex items-center justify-between">
              <h2 className="text-lg font-bold text-neutral-900">
                Cancellation Request
              </h2>
              <button
                onClick={() => setSelectedRequest(null)}
                className="text-neutral-500 hover:text-neutral-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">

              {/* ======= Compact Info Grid ======= */}
              <div className="grid grid-cols-2 gap-3 text-sm">

                <div>
                  <span className="text-neutral-500">Request ID</span>
                  <p className="font-mono font-semibold">
                    {selectedRequest.id}
                  </p>
                </div>

                <div>
                  <span className="text-neutral-500">Order ID</span>
                  <p className="font-mono font-semibold">
                    {selectedRequest.orderId}
                  </p>
                </div>

                {/* Customer Name */}
                <div>
                  <span className="text-neutral-500">Customer</span>
                  <p className="font-semibold text-neutral-900">
                    {selectedRequest.order?.address?.name || "N/A"}
                  </p>
                </div>

                {/* Refund Amount */}
                <div>
                  <span className="text-neutral-500">Refund Amount</span>
                  <p className="font-bold text-green-600">
                    ₹{selectedRequest.order?.totalAmount || 0}
                  </p>
                </div>

                {/* Order Status */}
                <div>
                  <span className="text-neutral-500">Order Status</span>
                  <p
                    className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                      selectedRequest.order?.status === "DELIVERED"
                        ? "bg-green-100 text-green-800"
                        : selectedRequest.order?.status === "CANCELLED"
                        ? "bg-red-100 text-red-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {selectedRequest.order?.status || "UNKNOWN"}
                  </p>
                </div>

                {/* Request Status */}
                <div>
                  <span className="text-neutral-500">Request Status</span>
                  <p
                    className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                      STATUS_COLORS[selectedRequest.status]
                    }`}
                  >
                    {selectedRequest.status}
                  </p>
                </div>

                {/* UPI ID Full Width */}
                {selectedRequest.upiId && (
                  <div className="col-span-2">
                    <span className="text-neutral-500">UPI ID (Refund)</span>
                    <p className="font-mono font-semibold text-green-700 bg-green-50 px-2 py-1 rounded mt-1">
                      {selectedRequest.upiId}
                    </p>
                  </div>
                )}
              </div>

              {/* ======= Cancellation Reason ======= */}
              <div>
                <h3 className="font-semibold text-neutral-900 text-sm mb-1">
                  Cancellation Reason
                </h3>
                <div className="bg-neutral-50 p-2 rounded text-sm text-neutral-700">
                  {selectedRequest.reason}
                </div>
              </div>

              {/* ======= Video Evidence - Only show for post-delivery ======= */}
              {(() => {
                const orderStatus = selectedRequest.order?.status;
                const deliveredAt = selectedRequest.order?.deliveredAt;
                const requestCreatedAt = new Date(selectedRequest.createdAt);
                const isPostDelivery =
                  orderStatus === "DELIVERED" ||
                  (orderStatus === "CANCELLED" && deliveredAt && requestCreatedAt > new Date(deliveredAt));
                
                return isPostDelivery ? (
                  <div className="border-t border-neutral-200 pt-3">
                    <h3 className="font-semibold text-neutral-900 text-sm mb-2 flex items-center gap-2">
                      <Play className="w-4 h-4 text-green-600" />
                      Video Evidence
                    </h3>
                    {selectedRequest.videoUrl ? (
                      <>
                        <div className="bg-black rounded-lg overflow-hidden">
                          <video
                            src={getFullVideoUrl(selectedRequest.videoUrl)}
                            controls
                            className="w-full max-h-56"
                          />
                        </div>
                        <div className="flex justify-between text-xs text-neutral-500 mt-1">
                          <span>✓ Uploaded</span>
                          <span>
                            {selectedRequest.videoUploadedAt
                              ? new Date(
                                  selectedRequest.videoUploadedAt
                                ).toLocaleString("en-IN")
                              : "Unknown"}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="bg-yellow-50 border border-yellow-200 rounded p-2 text-sm text-yellow-800">
                        No video evidence uploaded.
                      </div>
                    )}
                  </div>
                ) : null;
              })()}

              {/* ======= Action Buttons ======= */}
              {selectedRequest.status === "PENDING" && (
                <div className="border-t border-neutral-200 pt-4 flex gap-3">
                  <button
                    onClick={() =>
                      handleStatusUpdate(selectedRequest.id, "APPROVED")
                    }
                    disabled={updatingRequestId === selectedRequest.id}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded font-semibold hover:bg-green-700 disabled:opacity-50 transition"
                  >
                    {updatingRequestId === selectedRequest.id
                      ? "Approving..."
                      : "Approve"}
                  </button>

                  <button
                    onClick={() =>
                      handleStatusUpdate(selectedRequest.id, "REJECTED")
                    }
                    disabled={updatingRequestId === selectedRequest.id}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded font-semibold hover:bg-red-700 disabled:opacity-50 transition"
                  >
                    {updatingRequestId === selectedRequest.id
                      ? "Rejecting..."
                      : "Reject"}
                  </button>
                </div>
              )}

              {/* ======= Status Messages ======= */}
              {selectedRequest.status === "APPROVED" && (
                <div className="bg-green-50 border border-green-200 rounded p-2 text-sm text-green-800">
                  ✓ Cancellation approved. Order marked as CANCELLED.
                </div>
              )}

              {selectedRequest.status === "REJECTED" && (
                <div className="bg-red-50 border border-red-200 rounded p-2 text-sm text-red-800">
                  ✕ Cancellation request rejected.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bill Modal */}
      <BillModal 
        order={selectedBillOrder} 
        isOpen={isBillModalOpen} 
        onClose={() => {
          setIsBillModalOpen(false);
          setSelectedBillOrder(null);
        }} 
      />

    </div>
  );
};
