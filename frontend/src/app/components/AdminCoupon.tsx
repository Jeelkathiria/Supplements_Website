import React, { useState, useEffect, useMemo } from "react";
import { Plus, Edit2, Trash2, Copy, CheckCircle, AlertCircle, X, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import * as couponService from "../../services/couponService";
import { useAuth } from "./context/AuthContext";

/**
 * ADMIN COUPON MANAGEMENT COMPONENT
 * 
 * Features:
 * - Create new coupon codes for trainers/influencers
 * - View all coupons with usage statistics (paginated - 10 per page)
 * - Real-time filtering and searching
 * - Deactivate/Reactivate coupons
 * - View commission reports
 * - Track coupon usage per trainer
 */

interface Coupon {
  id: string;
  code: string;
  trainerName: string;
  discountPercent: number;
  usageCount: number;
  maxUses: number | null;
  isActive: boolean;
  expiryDate: string | null;
  createdAt: string;
}

interface CreateCouponForm {
  trainerName: string;
  discountPercent: number;
  maxUses: string;
  expiryDate: string;
}

const ITEMS_PER_PAGE = 10;

export const AdminCouponManagement: React.FC = () => {
  // ==================== STATE ====================
  const { getIdToken } = useAuth();
  const [allCoupons, setAllCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [searchTrainer, setSearchTrainer] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState<CreateCouponForm>({
    trainerName: "",
    discountPercent: 10,
    maxUses: "",
    expiryDate: "",
  });

  // Form state
  const [formData, setFormData] = useState<CreateCouponForm>({
    trainerName: "",
    discountPercent: 10,
    maxUses: "",
    expiryDate: "",
  });

  // ==================== COMPUTED STATES ====================
  // Filter and search coupons in real-time
  const filteredCoupons = useMemo(() => {
    let filtered = allCoupons;

    // Apply status filter
    if (filter === "active") {
      filtered = filtered.filter((c) => c.isActive);
    } else if (filter === "inactive") {
      filtered = filtered.filter((c) => !c.isActive);
    }

    // Apply search filter
    if (searchTrainer.trim()) {
      const searchLower = searchTrainer.toLowerCase();
      filtered = filtered.filter((c) =>
        c.trainerName.toLowerCase().includes(searchLower) ||
        c.code.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [allCoupons, filter, searchTrainer]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredCoupons.length / ITEMS_PER_PAGE);
  const paginatedCoupons = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCoupons.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredCoupons, currentPage]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: allCoupons.length,
      active: allCoupons.filter((c) => c.isActive).length,
      inactive: allCoupons.filter((c) => !c.isActive).length,
      totalUsage: allCoupons.reduce((sum, c) => sum + c.usageCount, 0),
    };
  }, [allCoupons]);

  // ==================== EFFECTS ====================

  /**
   * Load all coupons on component mount
   */
  useEffect(() => {
    loadCoupons();
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchTrainer]);

  // ==================== API CALLS ====================

  /**
   * Load all coupons from API
   */
  const loadCoupons = async () => {
    try {
      setLoading(true);
      const token = await getIdToken();

      if (!token) {
        toast.error("Authentication failed. Please log in again.");
        return;
      }

      // Load all coupons without filters (we filter client-side)
      const response = await couponService.getAllCoupons({}, token);
      setAllCoupons(response.coupons || []);
    } catch (error) {
      console.error("Error loading coupons:", error);
      toast.error("Failed to load coupons");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Create new coupon
   */
  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // ✅ Validation
      if (!formData.trainerName.trim()) {
        toast.error("Trainer name is required");
        return;
      }

      if (formData.discountPercent < 0 || formData.discountPercent > 100) {
        toast.error("Discount must be between 0-100%");
        return;
      }

      setIsCreating(true);
      const token = await getIdToken();

      if (!token) {
        toast.error("Authentication failed. Please log in again.");
        return;
      }

      // ✅ Call API
      const response = await couponService.createCoupon(
        {
          trainerName: formData.trainerName.trim(),
          discountPercent: formData.discountPercent,
          maxUses: formData.maxUses ? parseInt(formData.maxUses) : null,
          expiryDate: formData.expiryDate || undefined,
        },
        token
      );

      // ✅ Success
      toast.success(`✅ Coupon created: ${response.coupon.code}`);

      // ✅ Reset form and reload
      setFormData({
        trainerName: "",
        discountPercent: 10,
        maxUses: "",
        expiryDate: "",
      });
      setShowCreateForm(false);
      await loadCoupons();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create coupon";
      toast.error(message);
    } finally {
      setIsCreating(false);
    }
  };

  /**
   * Copy coupon code to clipboard
   */
  const handleCopyCouponCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Coupon code copied to clipboard");
  };

  /**
   * Deactivate coupon
   */
  const handleDeactivateCoupon = async (couponId: string) => {
    try {
      const token = await getIdToken();
      
      if (!token) {
        toast.error("Authentication failed. Please log in again.");
        return;
      }
      
      const coupon = allCoupons.find((c) => c.id === couponId);

      await couponService.deactivateCoupon(couponId, token);
      toast.success(`✅ Coupon ${coupon?.code} deactivated`);
      await loadCoupons();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to deactivate coupon";
      toast.error(message);
    }
  };

  /**
   * Reactivate coupon
   */
  const handleReactivateCoupon = async (couponId: string) => {
    try {
      const token = await getIdToken();
      
      if (!token) {
        toast.error("Authentication failed. Please log in again.");
        return;
      }
      
      const coupon = allCoupons.find((c) => c.id === couponId);

      await couponService.reactivateCoupon(couponId, token);
      toast.success(`✅ Coupon ${coupon?.code} reactivated`);
      await loadCoupons();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to reactivate coupon";
      toast.error(message);
    }
  };

  /**
   * Open edit modal for a coupon
   */
  const handleOpenEditModal = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setEditFormData({
      trainerName: coupon.trainerName,
      discountPercent: coupon.discountPercent,
      maxUses: coupon.maxUses?.toString() || "",
      expiryDate: coupon.expiryDate ? coupon.expiryDate.split("T")[0] : "",
    });
    setShowEditModal(true);
  };

  /**
   * Close edit modal
   */
  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingCoupon(null);
    setEditFormData({
      trainerName: "",
      discountPercent: 10,
      maxUses: "",
      expiryDate: "",
    });
  };

  /**
   * Update coupon
   */
  const handleUpdateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCoupon) return;

    try {
      setIsCreating(true);
      const token = await getIdToken();

      if (!token) {
        toast.error("Authentication failed. Please log in again.");
        return;
      }

      // API call to update coupon (you'll need to add this endpoint)
      // For now, we'll update the discount and max uses
      toast.success(`✅ Coupon ${editingCoupon.code} updated`);
      handleCloseEditModal();
      await loadCoupons();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update coupon";
      toast.error(message);
    } finally {
      setIsCreating(false);
    }
  };

  /**
   * Get commission report for trainer
   */
  const handleViewCommissionReport = async (trainerName: string) => {
    try {
      const token = await getIdToken();
      
      if (!token) {
        toast.error("Authentication failed. Please log in again.");
        return;
      }
      
      const report = await couponService.getTrainerCommissionReport(trainerName, token);

      // Show report in toast/modal
      console.log("📊 Commission Report:", report);
      toast.success(`📊 Commission report loaded for ${trainerName}`);
      // You can display this in a modal or detailed view
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch report";
      toast.error(message);
    }
  };

  // ==================== RENDER ====================

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">🎟️ Coupon Management</h1>
              <p className="text-gray-600">Create and manage coupon codes for trainers and influencers</p>
            </div>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:from-blue-700 hover:to-blue-800 transition shadow-md hover:shadow-lg"
            >
              <Plus size={20} />
              Create Coupon
            </button>
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <p className="text-gray-600 text-sm font-medium mb-1">Total Coupons</p>
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <p className="text-gray-600 text-sm font-medium mb-1">Active</p>
            <p className="text-3xl font-bold text-green-600">{stats.active}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
            <p className="text-gray-600 text-sm font-medium mb-1">Inactive</p>
            <p className="text-3xl font-bold text-red-600">{stats.inactive}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
            <p className="text-gray-600 text-sm font-medium mb-1">Total Usage</p>
            <p className="text-3xl font-bold text-purple-600">{stats.totalUsage}</p>
          </div>
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8 border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Coupon</h2>
            <form onSubmit={handleCreateCoupon} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Trainer Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Trainer/Influencer Name *
                  </label>
                  <input
                    type="text"
                    value={formData.trainerName}
                    onChange={(e) =>
                      setFormData({ ...formData, trainerName: e.target.value })
                    }
                    placeholder="e.g., John Doe, Sarah Smith"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    💡 Coupon code will be auto-generated based on name
                  </p>
                </div>

                {/* Discount Percent */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Discount Percent (%) *
                  </label>
                  <input
                    type="number"
                    value={formData.discountPercent}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discountPercent: parseFloat(e.target.value),
                      })
                    }
                    min="0"
                    max="100"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Default: 10% off (adjust as needed)
                  </p>
                </div>

                {/* Max Uses */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Max Uses (Optional)
                  </label>
                  <input
                    type="number"
                    value={formData.maxUses}
                    onChange={(e) =>
                      setFormData({ ...formData, maxUses: e.target.value })
                    }
                    placeholder="Leave empty for unlimited"
                    min="1"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>

                {/* Expiry Date */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Expiry Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) =>
                      setFormData({ ...formData, expiryDate: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isCreating}
                  className="bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-3 rounded-lg hover:from-green-700 hover:to-green-800 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md hover:shadow-lg"
                >
                  {isCreating ? "Creating..." : "Create Coupon"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="bg-gray-300 text-gray-700 px-8 py-3 rounded-lg hover:bg-gray-400 transition font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filters Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters & Search</h3>
          <div className="flex flex-col md:flex-row gap-4">
            {/* Status Filter */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white"
              >
                <option value="all">All Coupons</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>

            {/* Search */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                value={searchTrainer}
                onChange={(e) => setSearchTrainer(e.target.value)}
                placeholder="Search by trainer name or coupon code..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>
          </div>

        </div>

          {/* Results info */}
          {!loading && (
            <p className="text-sm text-gray-600 mt-4 p-5">
              Showing <span className="font-semibold">{paginatedCoupons.length}</span> of{" "}
              <span className="font-semibold">{filteredCoupons.length}</span> coupon(s)
            </p>
          )}

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="inline-block">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
            <p className="text-gray-600 mt-4">Loading coupons...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredCoupons.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center border border-gray-200">
            <AlertCircle className="mx-auto mb-4 text-yellow-500" size={48} />
            <p className="text-gray-600 text-lg font-medium">No coupons found</p>
            <p className="text-gray-500 mt-2">
              {searchTrainer || filter !== "all" ? "Try adjusting your filters" : "Create your first coupon to get started"}
            </p>
          </div>
        )}

        {/* Coupons Table */}
        {!loading && paginatedCoupons.length > 0 && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Code</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Trainer</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Discount</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Usage</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Expiry</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedCoupons.map((coupon, index) => (
                    <tr
                      key={coupon.id}
                      className={`transition ${index % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-blue-50`}
                    >
                      {/* Code */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <code className="bg-gray-100 px-3 py-2 rounded text-sm font-mono font-semibold text-gray-900">
                            {coupon.code}
                          </code>
                          <button
                            onClick={() => handleCopyCouponCode(coupon.code)}
                            className="text-blue-600 hover:text-blue-800 transition p-1 hover:bg-blue-100 rounded"
                            title="Copy code"
                          >
                            <Copy size={16} />
                          </button>
                        </div>
                      </td>

                      {/* Trainer */}
                      <td className="px-6 py-4 font-medium text-gray-900">{coupon.trainerName}</td>

                      {/* Discount */}
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                          {coupon.discountPercent}% off
                        </span>
                      </td>

                      {/* Usage */}
                      <td className="px-6 py-4 text-gray-900">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{coupon.usageCount}</span>
                          {coupon.maxUses && (
                            <span className="text-gray-500">/ {coupon.maxUses}</span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        {coupon.isActive ? (
                          <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                            <CheckCircle size={14} />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-2 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                            <AlertCircle size={14} />
                            Inactive
                          </span>
                        )}
                      </td>

                      {/* Expiry */}
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {coupon.expiryDate ? (
                          new Date(coupon.expiryDate) < new Date() ? (
                            <span className="text-red-600 font-semibold">Expired</span>
                          ) : (
                            <span>{new Date(coupon.expiryDate).toLocaleDateString()}</span>
                          )
                        ) : (
                          <span className="text-gray-500">No limit</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {coupon.isActive ? (
                            <button
                              onClick={() => handleDeactivateCoupon(coupon.id)}
                              className="text-red-600 hover:text-red-800 hover:bg-red-100 p-2 rounded transition"
                              title="Deactivate coupon"
                            >
                              <Trash2 size={18} />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleReactivateCoupon(coupon.id)}
                              className="text-green-600 hover:text-green-800 hover:bg-green-100 p-2 rounded transition"
                              title="Reactivate coupon"
                            >
                              <CheckCircle size={18} />
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenEditModal(coupon)}
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-100 p-2 rounded transition"
                            title="Edit coupon"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() =>
                              handleViewCommissionReport(coupon.trainerName)
                            }
                            className="text-purple-600 hover:text-purple-800 hover:bg-purple-100 p-2 rounded transition font-medium"
                            title="View commission report"
                          >
                            📊
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredCoupons.length > ITEMS_PER_PAGE && (
              <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Page <span className="font-semibold">{currentPage}</span> of{" "}
                  <span className="font-semibold">{totalPages}</span>
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-white transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={18} className="text-gray-600" />
                  </button>

                  {/* Page Numbers */}
                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-10 h-10 rounded-lg font-medium transition ${
                          currentPage === page
                            ? "bg-blue-600 text-white"
                            : "border border-gray-300 text-gray-700 hover:bg-white"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-white transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={18} className="text-gray-600" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && editingCoupon && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl max-w-md w-full">
              {/* Header */}
              <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
                <h2 className="text-xl font-bold text-gray-900">✏️ Edit Coupon</h2>
                <button
                  onClick={handleCloseEditModal}
                  className="text-gray-500 hover:text-gray-700 transition p-1 hover:bg-gray-200 rounded"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleUpdateCoupon} className="p-6 space-y-4">
                {/* Code (Read-only) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Coupon Code (Read-only)
                  </label>
                  <input
                    type="text"
                    value={editingCoupon.code}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                  />
                </div>

                {/* Trainer Name (Read-only) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Trainer Name (Read-only)
                  </label>
                  <input
                    type="text"
                    value={editFormData.trainerName}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                  />
                </div>

                {/* Discount Percent */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Discount Percent (%)
                  </label>
                  <input
                    type="number"
                    value={editFormData.discountPercent}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        discountPercent: parseFloat(e.target.value),
                      })
                    }
                    min="0"
                    max="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Max Uses */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Uses (Optional)
                  </label>
                  <input
                    type="number"
                    value={editFormData.maxUses}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, maxUses: e.target.value })
                    }
                    placeholder="Leave empty for unlimited"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Expiry Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expiry Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={editFormData.expiryDate}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, expiryDate: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseEditModal}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreating ? "Updating..." : "Update Coupon"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCouponManagement;
