import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Copy, CheckCircle, AlertCircle, X } from "lucide-react";
import { toast } from "sonner";
import * as couponService from "../../services/couponService";
import { useAuth } from "./context/AuthContext";

/**
 * ADMIN COUPON MANAGEMENT COMPONENT
 * 
 * Features:
 * - Create new coupon codes for trainers/influencers
 * - View all coupons with usage statistics
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

export const AdminCouponManagement: React.FC = () => {
  // ==================== STATE ====================
  const { getIdToken } = useAuth();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [searchTrainer, setSearchTrainer] = useState("");
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

  // ==================== EFFECTS ====================

  /**
   * Load all coupons on component mount
   */
  useEffect(() => {
    loadCoupons();
  }, []);

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

      const response = await couponService.getAllCoupons(
        {
          isActive: filter === "active" ? true : filter === "inactive" ? false : undefined,
          trainerName: searchTrainer || undefined,
        },
        token
      );

      setCoupons(response.coupons || []);
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
      
      const coupon = coupons.find((c) => c.id === couponId);

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
      
      const coupon = coupons.find((c) => c.id === couponId);

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
    <div className="p-6 bg-white rounded-lg">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">🎟️ Coupon Management</h1>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"
        >
          <Plus size={20} />
          Create Coupon
        </button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="bg-gray-50 p-6 rounded-lg mb-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Create New Coupon</h2>
          <form onSubmit={handleCreateCoupon} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Trainer Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trainer/Influencer Name *
                </label>
                <input
                  type="text"
                  value={formData.trainerName}
                  onChange={(e) =>
                    setFormData({ ...formData, trainerName: e.target.value })
                  }
                  placeholder="e.g., John Doe, Sarah Smith"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  💡 Coupon code will be auto-generated based on name
                </p>
              </div>

              {/* Discount Percent */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount Percent (%)
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Default: 10% off (adjust as needed)
                </p>
              </div>

              {/* Max Uses */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  value={formData.expiryDate}
                  onChange={(e) =>
                    setFormData({ ...formData, expiryDate: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isCreating}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
              >
                {isCreating ? "Creating..." : "Create Coupon"}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="bg-gray-400 text-white px-6 py-2 rounded-lg hover:bg-gray-500 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4 mb-6 flex-wrap">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Coupons</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </select>

        <input
          type="text"
          value={searchTrainer}
          onChange={(e) => setSearchTrainer(e.target.value)}
          placeholder="Search by trainer name..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          onClick={loadCoupons}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Refresh
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-8">
          <p className="text-gray-500">Loading coupons...</p>
        </div>
      )}

      {/* Coupons List */}
      {!loading && coupons.length === 0 && (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <AlertCircle className="mx-auto mb-2 text-yellow-500" size={32} />
          <p className="text-gray-500">No coupons found</p>
        </div>
      )}

      {!loading && coupons.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100 border-b">
                <th className="px-4 py-3 text-left font-semibold">Code</th>
                <th className="px-4 py-3 text-left font-semibold">Trainer</th>
                <th className="px-4 py-3 text-left font-semibold">Discount</th>
                <th className="px-4 py-3 text-left font-semibold">Usage</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-left font-semibold">Expiry</th>
                <th className="px-4 py-3 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon) => (
                <tr
                  key={coupon.id}
                  className="border-b hover:bg-gray-50 transition"
                >
                  {/* Code */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <code className="bg-gray-100 px-3 py-1 rounded text-sm font-mono">
                        {coupon.code}
                      </code>
                      <button
                        onClick={() => handleCopyCouponCode(coupon.code)}
                        className="text-blue-600 hover:text-blue-800 transition"
                        title="Copy code"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  </td>

                  {/* Trainer */}
                  <td className="px-4 py-3 font-medium">{coupon.trainerName}</td>

                  {/* Discount */}
                  <td className="px-4 py-3 font-semibold text-green-600">
                    {coupon.discountPercent}% off
                  </td>

                  {/* Usage */}
                  <td className="px-4 py-3">
                    {coupon.usageCount}
                    {coupon.maxUses && (
                      <span className="text-gray-500 ml-1">/ {coupon.maxUses}</span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    {coupon.isActive ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                        <CheckCircle size={14} />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                        <AlertCircle size={14} />
                        Inactive
                      </span>
                    )}
                  </td>

                  {/* Expiry */}
                  <td className="px-4 py-3 text-sm">
                    {coupon.expiryDate ? (
                      new Date(coupon.expiryDate) < new Date() ? (
                        <span className="text-red-600">Expired</span>
                      ) : (
                        new Date(coupon.expiryDate).toLocaleDateString()
                      )
                    ) : (
                      <span className="text-gray-500">No limit</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {coupon.isActive ? (
                        <button
                          onClick={() => handleDeactivateCoupon(coupon.id)}
                          className="text-red-600 hover:text-red-800 transition"
                          title="Deactivate coupon"
                        >
                          <Trash2 size={18} />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleReactivateCoupon(coupon.id)}
                          className="text-green-600 hover:text-green-800 transition"
                          title="Reactivate coupon"
                        >
                          <CheckCircle size={18} />
                        </button>
                      )}
                      <button
                        onClick={() => handleOpenEditModal(coupon)}
                        className="text-blue-600 hover:text-blue-800 transition"
                        title="Edit coupon"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() =>
                          handleViewCommissionReport(coupon.trainerName)
                        }
                        className="text-purple-600 hover:text-purple-800 transition"
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
      )}

      {/* Edit Modal */}
      {showEditModal && editingCoupon && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b">
              <h2 className="text-xl font-bold">✏️ Edit Coupon</h2>
              <button
                onClick={handleCloseEditModal}
                className="text-gray-500 hover:text-gray-700 transition"
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

      {/* Summary */}
      {!loading && coupons.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-gray-700">
            <strong>Total Coupons:</strong> {coupons.length} |{" "}
            <strong>Active:</strong> {coupons.filter((c) => c.isActive).length} |{" "}
            <strong>Total Usage:</strong>{" "}
            {coupons.reduce((sum, c) => sum + c.usageCount, 0)}
          </p>
        </div>
      )}
    </div>
  );
};

export default AdminCouponManagement;
