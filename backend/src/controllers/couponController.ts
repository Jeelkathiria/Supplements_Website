import { Response } from "express";
import { AuthRequest } from "../middlewares/requireAuth";
import * as couponService from "../services/couponService";

/**
 * COUPON CONTROLLER - Handles all coupon-related HTTP requests
 * Provides endpoints for admin to manage coupons and customers to apply them
 */

// ==================== ADMIN ENDPOINTS ====================

/**
 * POST /api/coupons/create
 * Create a new coupon code for a trainer/influencer
 * 🔒 Admin only
 * 
 * Request body:
 * {
 *   trainerName: "John Doe"
 *   discountPercent: 10
 *   maxUses: null (unlimited)
 *   expiryDate: "2026-12-31"
 * }
 */
export const createCoupon = async (req: AuthRequest, res: Response) => {
  try {
    // ✅ Check admin authorization
    const adminEmail = req.user?.email;
    if (adminEmail !== "admin@gmail.com") {
      return res.status(403).json({
        success: false,
        message: "Only admin can create coupons",
      });
    }

    const adminId = req.user?.dbUser?.id;
    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: "Admin ID is required",
      });
    }

    // ✅ Validate request body
    const { trainerName, discountPercent, minAmount, maxUses, expiryDate, trainerId } =
      req.body;

    if (!trainerName) {
      return res.status(400).json({
        success: false,
        message: "Trainer name is required",
      });
    }

    // ✅ Create coupon using service
    const coupon = await couponService.createCoupon({
      trainerName,
      trainerId,
      discountPercent: discountPercent || 10,
      minAmount: minAmount ? parseFloat(minAmount) : 0,
      maxUses,
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      createdByAdminId: adminId,
    });

    // ✅ Return success response with coupon details
    res.status(201).json({
      success: true,
      message: "Coupon created successfully",
      coupon,
    });
  } catch (error) {
    console.error("Error creating coupon:", error);
    const message = error instanceof Error ? error.message : "Failed to create coupon";
    res.status(500).json({
      success: false,
      message,
      error: message,
    });
  }
};

/**
 * GET /api/coupons
 * Get all coupons with optional filters
 * 🔒 Admin only
 * 
 * Query params:
 * - isActive: boolean (filter by active/inactive)
 * - trainerName: string (filter by trainer name)
 */
export const getAllCoupons = async (req: AuthRequest, res: Response) => {
  try {
    // ✅ Check admin authorization
    const adminEmail = req.user?.email;
    if (adminEmail !== "admin@gmail.com") {
      return res.status(403).json({
        success: false,
        message: "Only admin can view coupons",
      });
    }

    // ✅ Parse filters from query parameters
    const { isActive, trainerName } = req.query;
    const filters: any = {};

    if (isActive !== undefined) {
      filters.isActive = String(isActive) === "true";
    }

    if (trainerName) {
      filters.trainerName = String(trainerName);
    }

    // ✅ Get coupons from service
    const coupons = await couponService.getAllCoupons(filters);

    // ✅ Return success response
    res.status(200).json({
      success: true,
      count: coupons.length,
      coupons,
    });
  } catch (error) {
    console.error("Error fetching coupons:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch coupons";
    res.status(500).json({
      success: false,
      message,
    });
  }
};

/**
 * GET /api/coupons/:couponId
 * Get coupon details with usage history
 * 🔒 Admin only
 */
export const getCouponById = async (req: AuthRequest, res: Response) => {
  try {
    // ✅ Check admin authorization
    const adminEmail = req.user?.email;
    if (adminEmail !== "admin@gmail.com") {
      return res.status(403).json({
        success: false,
        message: "Only admin can view coupon details",
      });
    }

    const { couponId } = req.params;

    // ✅ Validate ID
    if (!couponId) {
      return res.status(400).json({
        success: false,
        message: "Coupon ID is required",
      });
    }

    // ✅ Get coupon from service
    const coupon = await couponService.getCouponById(String(couponId));

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    // ✅ Return success response
    res.status(200).json({
      success: true,
      coupon,
    });
  } catch (error) {
    console.error("Error fetching coupon:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch coupon";
    res.status(500).json({
      success: false,
      message,
    });
  }
};

/**
 * POST /api/coupons/:couponId/deactivate
 * Deactivate a coupon (soft delete)
 * 🔒 Admin only
 */
export const deactivateCoupon = async (req: AuthRequest, res: Response) => {
  try {
    // ✅ Check admin authorization
    const adminEmail = req.user?.email;
    if (adminEmail !== "admin@gmail.com") {
      return res.status(403).json({
        success: false,
        message: "Only admin can deactivate coupons",
      });
    }

    const { couponId } = req.params;

    if (!couponId) {
      return res.status(400).json({
        success: false,
        message: "Coupon ID is required",
      });
    }

    // ✅ Deactivate coupon
    const coupon = await couponService.deactivateCoupon(String(couponId));

    // ✅ Return success response
    res.status(200).json({
      success: true,
      message: "Coupon deactivated successfully",
      coupon,
    });
  } catch (error) {
    console.error("Error deactivating coupon:", error);
    const message = error instanceof Error ? error.message : "Failed to deactivate coupon";
    res.status(500).json({
      success: false,
      message,
    });
  }
};

/**
 * POST /api/coupons/:couponId/reactivate
 * Reactivate a coupon
 * 🔒 Admin only
 */
export const reactivateCoupon = async (req: AuthRequest, res: Response) => {
  try {
    // ✅ Check admin authorization
    const adminEmail = req.user?.email;
    if (adminEmail !== "admin@gmail.com") {
      return res.status(403).json({
        success: false,
        message: "Only admin can reactivate coupons",
      });
    }

    const { couponId } = req.params;

    if (!couponId) {
      return res.status(400).json({
        success: false,
        message: "Coupon ID is required",
      });
    }

    // ✅ Reactivate coupon
    const coupon = await couponService.reactivateCoupon(String(couponId));

    // ✅ Return success response
    res.status(200).json({
      success: true,
      message: "Coupon reactivated successfully",
      coupon,
    });
  } catch (error) {
    console.error("Error reactivating coupon:", error);
    const message = error instanceof Error ? error.message : "Failed to reactivate coupon";
    res.status(500).json({
      success: false,
      message,
    });
  }
};

/**
 * PUT /api/coupons/:couponId
 * Update a coupon (discount percent, minAmount, maxUses, expiryDate)
 * 🔒 Admin only
 * 
 * Request body:
 * {
 *   discountPercent?: 15
 *   minAmount?: 500
 *   maxUses?: 50
 *   expiryDate?: "2026-12-31"
 * }
 */
export const updateCoupon = async (req: AuthRequest, res: Response) => {
  try {
    // ✅ Check admin authorization
    const adminEmail = req.user?.email;
    if (adminEmail !== "admin@gmail.com") {
      return res.status(403).json({
        success: false,
        message: "Only admin can update coupons",
      });
    }

    const { couponId } = req.params;
    const { discountPercent, minAmount, maxUses, expiryDate } = req.body;

    if (!couponId) {
      return res.status(400).json({
        success: false,
        message: "Coupon ID is required",
      });
    }

    // ✅ Update coupon using service
    const coupon = await couponService.updateCoupon(String(couponId), {
      discountPercent: discountPercent !== undefined ? discountPercent : undefined,
      minAmount: minAmount !== undefined ? parseFloat(minAmount) : undefined,
      maxUses: maxUses ? parseInt(maxUses) : undefined,
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
    });

    // ✅ Return success response
    res.status(200).json({
      success: true,
      message: "Coupon updated successfully",
      coupon,
    });
  } catch (error) {
    console.error("Error updating coupon:", error);
    const message = error instanceof Error ? error.message : "Failed to update coupon";
    res.status(500).json({
      success: false,
      message,
    });
  }
};

/**
 * GET /api/coupons/trainer/:trainerName/commission-report
 * Get commission report for a trainer
 * 🔒 Admin only
 * 
 * Returns: Total coupons issued, total discount given, usage count
 * Used for offline commission calculation
 */
export const getTrainerCommissionReport = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    // ✅ Check admin authorization
    const adminEmail = req.user?.email;
    if (adminEmail !== "admin@gmail.com") {
      return res.status(403).json({
        success: false,
        message: "Only admin can view commission reports",
      });
    }

    const { trainerName } = req.params;

    if (!trainerName) {
      return res.status(400).json({
        success: false,
        message: "Trainer name is required",
      });
    }

    // ✅ Get commission report
    const report = await couponService.getTrainerCommissionReport(
      decodeURIComponent(String(trainerName))
    );

    // ✅ Return success response
    res.status(200).json({
      success: true,
      report,
    });
  } catch (error) {
    console.error("Error fetching commission report:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch commission report";
    res.status(500).json({
      success: false,
      message,
    });
  }
};

/**
 * GET /api/coupons/trainer/:trainerName/detailed-commission-report
 * Get detailed commission report with all orders where coupon was applied
 * 🔒 Admin only
 * 
 * Returns: Complete order details, items, discount info, customer address
 */
export const getDetailedCommissionReport = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    // ✅ Check admin authorization
    const adminEmail = req.user?.email;
    if (adminEmail !== "admin@gmail.com") {
      return res.status(403).json({
        success: false,
        message: "Only admin can view detailed commission reports",
      });
    }

    const { trainerName } = req.params;

    if (!trainerName) {
      return res.status(400).json({
        success: false,
        message: "Trainer name is required",
      });
    }

    // ✅ Get detailed report
    const report = await couponService.getDetailedTrainerCommissionReport(
      decodeURIComponent(String(trainerName))
    );

    // ✅ Return success response
    res.status(200).json({
      success: true,
      report,
    });
  } catch (error) {
    console.error("Error fetching detailed commission report:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch detailed commission report";
    res.status(500).json({
      success: false,
      message,
    });
  }
};

// ==================== CUSTOMER ENDPOINTS ====================

/**
 * POST /api/coupons/validate
 * Validate a coupon code before applying
 * 👤 Customer (no auth required but preferred)
 * 
 * Request body:
 * {
 *   couponCode: "JOHN_10"
 * }
 * 
 * Returns:
 * {
 *   isValid: true,
 *   coupon: {
 *     code: "JOHN_10",
 *     trainerName: "John Doe",
 *     discountPercent: 10
 *   }
 * }
 */
export const validateCoupon = async (req: AuthRequest, res: Response) => {
  try {
    const { couponCode, cartTotal } = req.body;

    // ✅ Validate input
    if (!couponCode) {
      return res.status(400).json({
        success: false,
        message: "Coupon code is required",
      });
    }

    // ✅ Validate coupon using service
    const result = await couponService.validateCoupon(couponCode, cartTotal);

    // ✅ Return validation result
    // Note: We return success: true even if coupon is invalid
    // The isValid field indicates validity
    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Error validating coupon:", error);
    const message = error instanceof Error ? error.message : "Failed to validate coupon";
    res.status(500).json({
      success: false,
      message,
    });
  }
};

/**
 * POST /api/coupons/apply
 * Apply a coupon to an order
 * 👤 Authenticated customer only
 * 
 * Request body:
 * {
 *   couponCode: "JOHN_10",
 *   orderId: "order-123",
 *   cartTotal: 1299.99
 * }
 * 
 * Returns:
 * {
 *   success: true,
 *   coupon: { ... },
 *   discountAmount: 129.99
 * }
 */
export const applyCoupon = async (req: AuthRequest, res: Response) => {
  try {
    // ✅ Check authentication
    const userId = req.user?.dbUser?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User must be authenticated to apply coupon",
      });
    }

    // ✅ Validate request body
    const { couponCode, orderId, cartTotal } = req.body;

    if (!couponCode) {
      return res.status(400).json({
        success: false,
        message: "Coupon code is required",
      });
    }

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required",
      });
    }

    if (!cartTotal || cartTotal <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid cart total is required",
      });
    }

    // ✅ Apply coupon using service
    const result = await couponService.applyCouponToOrder(
      couponCode,
      orderId,
      userId,
      cartTotal
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error,
      });
    }

    // ✅ Return success response
    res.status(200).json({
      success: true,
      message: "Coupon applied successfully",
      coupon: result.coupon,
      discountAmount: result.discountAmount,
    });
  } catch (error) {
    console.error("Error applying coupon:", error);
    const message = error instanceof Error ? error.message : "Failed to apply coupon";
    res.status(500).json({
      success: false,
      message,
    });
  }
};

/**
 * GET /api/coupons/trainer/:trainerName/applied
 * Get all applied coupons for a trainer
 * 🔒 Admin only
 * 
 * Query params:
 * - fromDate: optional (YYYY-MM-DD)
 * - toDate: optional (YYYY-MM-DD)
 */
export const getAppliedCouponsByTrainer = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    // ✅ Check admin authorization
    const adminEmail = req.user?.email;
    if (adminEmail !== "admin@gmail.com") {
      return res.status(403).json({
        success: false,
        message: "Only admin can view applied coupons",
      });
    }

    const { trainerName } = req.params;
    const { fromDate, toDate } = req.query;

    if (!trainerName) {
      return res.status(400).json({
        success: false,
        message: "Trainer name is required",
      });
    }

    // ✅ Parse date range if provided
    const dateRange =
      fromDate && toDate
        ? {
            fromDate: new Date(String(fromDate)),
            toDate: new Date(String(toDate)),
          }
        : undefined;

    // ✅ Get applied coupons
    const result = await couponService.getAppliedCouponsByTrainer(
      decodeURIComponent(String(trainerName)),
      dateRange
    );

    // ✅ Return success response
    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Error fetching applied coupons:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch applied coupons";
    res.status(500).json({
      success: false,
      message,
    });
  }
};
