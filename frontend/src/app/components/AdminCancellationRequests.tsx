import React, { useState, useEffect } from "react";
import {
  AlertCircle,
  Search,
  X,
  Play,
  Check,
  Clock,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { OrderCancellationService } from "../../services/orderCancellationService";
import type { Order } from "../../services/orderService";

interface CancellationRequest {
  id: string;
  orderId: string;
  userId: string;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  videoUrl?: string;
  videoUploadedAt?: string;
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

export const AdminCancellationRequests: React.FC = () => {
  const [requests, setRequests] = useState<CancellationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "PENDING" | "APPROVED" | "REJECTED">("all");
  const [selectedRequest, setSelectedRequest] = useState<CancellationRequest | null>(null);
  const [updatingRequestId, setUpdatingRequestId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const CARDS_PER_PAGE = 9;

  useEffect(() => {
    loadCancellationRequests();
  }, []);

  const loadCancellationRequests = async () => {
    try {
      setIsLoading(true);
      const data = await OrderCancellationService.getAllRequests();
      setRequests(data);
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
      } else {
        updated = await OrderCancellationService.rejectCancellation(requestId);
      }

      setRequests((prev) =>
        prev.map((req) => (req.id === requestId ? updated : req))
      );
      setSelectedRequest(null);
      toast.success(`Request ${newStatus.toLowerCase()}`);
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

  // Filter requests based on search and status
  const filteredRequests = requests.filter((req) => {
    // Only show requests where order status is DELIVERED or CANCELLED (for approved requests)
    const orderStatus = req.order?.status;
    if (orderStatus !== "DELIVERED" && orderStatus !== "CANCELLED") {
      return false;
    }

    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      req.orderId.toLowerCase().includes(searchLower) ||
      req.userId.toLowerCase().includes(searchLower) ||
      req.reason.toLowerCase().includes(searchLower);

    const matchesStatus =
      filterStatus === "all" || req.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredRequests.length / CARDS_PER_PAGE);
  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * CARDS_PER_PAGE,
    currentPage * CARDS_PER_PAGE
  );

  return (
    <div className="space-y-4">
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

        {/* Status Filter */}
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
      </div>

      {/* Requests Grid */}
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
                    <div
                      className={`rounded-full p-2 ${STATUS_COLORS[request.status]}`}
                    >
                      <StatusIcon className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Order and Request Status */}
                  <div className="flex gap-2 mb-3">
                    <div
                      className={`inline-block px-2 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-800`}
                    >
                      Order: DELIVERED
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

                  {/* Video Indicator */}
                  {request.videoUrl ? (
                    <div className="flex items-center gap-2 text-green-600 text-sm mb-3 bg-green-50 px-2 py-1 rounded">
                      <Play className="w-4 h-4" />
                      <span className="font-medium">Video Uploaded</span>
                    </div>
                  ) : (
                    <div className="text-xs text-neutral-500 mb-3 bg-neutral-100 px-2 py-1 rounded">
                      ⚠️ No video uploaded
                    </div>
                  )}

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

      {/* Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-neutral-200 p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-neutral-900">
                Cancellation Request Details
              </h2>
              <button
                onClick={() => setSelectedRequest(null)}
                className="text-neutral-500 hover:text-neutral-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Request Info */}
              <div className="space-y-3">
                <h3 className="font-bold text-neutral-900">Request Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-neutral-600">Request ID:</span>
                    <p className="font-mono font-semibold text-neutral-900">
                      {selectedRequest.id}
                    </p>
                  </div>
                  <div>
                    <span className="text-neutral-600">Order ID:</span>
                    <p className="font-mono font-semibold text-neutral-900">
                      {selectedRequest.orderId}
                    </p>
                  </div>
                  <div>
                    <span className="text-neutral-600">Order Status:</span>
                    <p className="font-semibold inline-block px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                      DELIVERED
                    </p>
                  </div>
                  <div>
                    <span className="text-neutral-600">Request Status:</span>
                    <p
                      className={`font-semibold inline-block px-2 py-1 rounded text-xs ${STATUS_COLORS[selectedRequest.status]
                        }`}
                    >
                      {selectedRequest.status}
                    </p>
                  </div>
                  <div>
                    <span className="text-neutral-600">User ID:</span>
                    <p className="font-mono font-semibold text-neutral-900">
                      {selectedRequest.userId.substring(0, 12)}...
                    </p>
                  </div>
                  <div>
                    <span className="text-neutral-600">Requested Date:</span>
                    <p className="font-semibold text-neutral-900">
                      {new Date(selectedRequest.createdAt).toLocaleDateString(
                        "en-IN"
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Cancellation Reason */}
              <div className="space-y-2">
                <h3 className="font-bold text-neutral-900">Cancellation Reason</h3>
                <div className="bg-neutral-50 p-3 rounded-lg">
                  <p className="text-sm text-neutral-700 whitespace-pre-wrap">
                    {selectedRequest.reason}
                  </p>
                </div>
              </div>

              {/* Video Evidence */}
              {selectedRequest.videoUrl ? (
                <div className="space-y-2 border-t border-neutral-200 pt-4">
                  <h3 className="font-bold text-neutral-900 flex items-center gap-2">
                    <Play className="w-5 h-5 text-green-600" />
                    Video Evidence (Uploaded by User)
                  </h3>
                  <div className="bg-black rounded-lg overflow-hidden">
                    <video
                      src={getFullVideoUrl(selectedRequest.videoUrl)}
                      controls
                      className="w-full max-h-80"
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-neutral-500 bg-neutral-50 p-2 rounded">
                    <span>✓ Video Uploaded</span>
                    <span>
                      {selectedRequest.videoUploadedAt
                        ? new Date(
                          selectedRequest.videoUploadedAt
                        ).toLocaleString("en-IN")
                        : "Unknown"}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="border-t border-neutral-200 pt-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800">
                      ⚠️ No video evidence has been uploaded for this cancellation request.
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {selectedRequest.status === "PENDING" && (
                <div className="border-t border-neutral-200 pt-4">
                  <h4 className="font-bold text-neutral-900 mb-3">
                    Review Decision
                  </h4>
                  <div className="flex gap-3">
                    <button
                      onClick={() =>
                        handleStatusUpdate(selectedRequest.id, "APPROVED")
                      }
                      disabled={updatingRequestId === selectedRequest.id}
                      className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      {updatingRequestId === selectedRequest.id
                        ? "Approving..."
                        : "✓ Approve Cancellation"}
                    </button>
                    <button
                      onClick={() =>
                        handleStatusUpdate(selectedRequest.id, "REJECTED")
                      }
                      disabled={updatingRequestId === selectedRequest.id}
                      className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      {updatingRequestId === selectedRequest.id
                        ? "Rejecting..."
                        : "✕ Reject Request"}
                    </button>
                  </div>
                </div>
              )}

              {selectedRequest.status === "APPROVED" && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-800">
                    ✓ This request has been approved. Order is marked as CANCELLED.
                  </p>
                </div>
              )}

              {selectedRequest.status === "REJECTED" && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800">
                    ✕ This request has been rejected.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
