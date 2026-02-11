import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Check, Clock, AlertCircle } from "lucide-react";

interface Refund {
  id: string;
  orderId: string;
  status: "INITIATED" | "REFUND_COMPLETED";
  refundAmount: number;
  reason: string;
  initiatedAt: string;
  completedAt?: string;
  order?: {
    id: string;
    userId: string;
    totalAmount: number;
  };
}

export const AdminRefundStatus: React.FC = () => {
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [filteredRefunds, setFilteredRefunds] = useState<Refund[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<"all" | "INITIATED" | "REFUND_COMPLETED">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingRefundId, setUpdatingRefundId] = useState<string | null>(null);

  const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  // Fetch all refunds
  useEffect(() => {
    fetchRefunds();
  }, []);

  // Filter refunds based on status and search
  useEffect(() => {
    let filtered = refunds;

    if (selectedStatus !== "all") {
      filtered = filtered.filter((r) => r.status === selectedStatus);
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (r) =>
          r.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.reason.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredRefunds(filtered);
  }, [refunds, selectedStatus, searchQuery]);

  const fetchRefunds = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${apiBase}/refunds/admin/all`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch refunds: ${response.statusText}`);
      }

      const data = await response.json();
      setRefunds(data);
    } catch (error) {
      console.error("Error fetching refunds:", error);
      toast.error("Failed to load refunds");
    } finally {
      setIsLoading(false);
    }
  };

  const updateRefundStatus = async (orderId: string, newStatus: "REFUND_COMPLETED") => {
    try {
      setUpdatingRefundId(orderId);
      const response = await fetch(`${apiBase}/refunds/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update refund: ${response.statusText}`);
      }

      const updatedRefund = await response.json();

      // Update the refunds list
      setRefunds((prev) =>
        prev.map((r) => (r.orderId === orderId ? { ...r, ...updatedRefund } : r))
      );

      toast.success("Refund status updated successfully");
    } catch (error) {
      console.error("Error updating refund:", error);
      toast.error("Failed to update refund status");
    } finally {
      setUpdatingRefundId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === "INITIATED") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs font-medium">
          <Clock className="w-3 h-3" />
          Initiated
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs font-medium">
        <Check className="w-3 h-3" />
        Completed
      </span>
    );
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-neutral-300 border-t-emerald-600"></div>
          <p className="text-neutral-600">Loading refunds...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-neutral-900">Refund Status Management</h2>
        <p className="mt-1 text-neutral-600">
          Monitor and manage refund processing for approved cancellations
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-600">Total Refunds</p>
              <p className="text-2xl font-bold text-neutral-900">{refunds.length}</p>
            </div>
            <div className="rounded-lg bg-blue-100 p-3">
              <AlertCircle className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-600">Completed Refunds</p>
              <p className="text-2xl font-bold text-neutral-900">
                {refunds.filter((r) => r.status === "REFUND_COMPLETED").length}
              </p>
            </div>
            <div className="rounded-lg bg-green-100 p-3">
              <Check className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-neutral-200 bg-white p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-900 mb-2">
              Filter by Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) =>
                setSelectedStatus(e.target.value as "all" | "INITIATED" | "REFUND_COMPLETED")
              }
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Refunds</option>
              <option value="INITIATED">Initiated</option>
              <option value="REFUND_COMPLETED">Completed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-900 mb-2">
              Search by Order ID
            </label>
            <input
              type="text"
              placeholder="Search order ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Refunds Table */}
      <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        {filteredRefunds.length === 0 ? (
          <div className="flex h-64 items-center justify-center">
            <p className="text-neutral-500">No refunds found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                <th className="px-6 py-3 text-left text-sm font-semibold text-neutral-900">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-neutral-900">
                  Refund Amount
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-neutral-900">
                  Reason
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-neutral-900">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-neutral-900">
                  Initiated Date
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-neutral-900">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {filteredRefunds.map((refund) => (
                <tr key={refund.id} className="hover:bg-neutral-50">
                  <td className="px-6 py-4 text-sm font-medium text-neutral-900">
                    {refund.orderId.substring(0, 8)}...
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-700">
                    ₹{refund.refundAmount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-700">
                    <div className="max-w-xs truncate" title={refund.reason}>
                      {refund.reason}
                    </div>
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(refund.status)}</td>
                  <td className="px-6 py-4 text-sm text-neutral-700">
                    {formatDate(refund.initiatedAt)}
                  </td>
                  <td className="px-6 py-4">
                    {refund.status === "INITIATED" ? (
                      <button
                        onClick={() => updateRefundStatus(refund.orderId, "REFUND_COMPLETED")}
                        disabled={updatingRefundId === refund.orderId}
                        className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        {updatingRefundId === refund.orderId ? (
                          <>
                            <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                            Updating...
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4" />
                            Mark Complete
                          </>
                        )}
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-2 px-3 py-2 text-sm text-neutral-600 bg-neutral-100 rounded-lg">
                        <Check className="w-4 h-4" />
                        Completed
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
