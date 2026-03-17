import { Router } from "express";
import * as couponController from "../controllers/couponController";
import { requireAuth } from "../middlewares/requireAuth";

/**
 * COUPON ROUTES - API endpoints for coupon management and application
 * 
 * Structure:
 * - Admin endpoints for coupon creation and management
 * - Customer endpoints for coupon validation and application
 */

const router = Router();

// ==================== ADMIN ROUTES ====================
// All admin routes require authentication via requireAuth middleware

/**
 * POST /api/coupons/create
 * Create a new coupon code for a trainer/influencer
 * 🔒 Admin only
 */
router.post("/create", requireAuth, couponController.createCoupon);

/**
 * GET /api/coupons
 * Get all coupons with optional filters
 * 🔒 Admin only
 */
router.get("/", requireAuth, couponController.getAllCoupons);

/**
 * GET /api/coupons/:couponId
 * Get coupon details with usage history
 * 🔒 Admin only
 */
router.get("/:couponId", requireAuth, couponController.getCouponById);

/**
 * POST /api/coupons/:couponId/deactivate
 * Deactivate a coupon (soft delete)
 * 🔒 Admin only
 */
router.post("/:couponId/deactivate", requireAuth, couponController.deactivateCoupon);

/**
 * POST /api/coupons/:couponId/reactivate
 * Reactivate a coupon
 * 🔒 Admin only
 */
router.post("/:couponId/reactivate", requireAuth, couponController.reactivateCoupon);

/**
 * PUT /api/coupons/:couponId
 * Update a coupon (discount percent, minAmount, maxUses, expiryDate)
 * 🔒 Admin only
 */
router.put("/:couponId", requireAuth, couponController.updateCoupon);

/**
 * GET /api/coupons/trainer/:trainerName/detailed-commission-report
 * Get detailed commission report with all orders where coupon was applied
 * 🔒 Admin only
 */
router.get(
  "/trainer/:trainerName/detailed-commission-report",
  requireAuth,
  couponController.getDetailedCommissionReport
);

/**
 * GET /api/coupons/trainer/:trainerName/commission-report
 * Get commission report for a trainer
 * 🔒 Admin only
 * Used for offline commission calculation
 */
router.get(
  "/trainer/:trainerName/commission-report",
  requireAuth,
  couponController.getTrainerCommissionReport
);

/**
 * GET /api/coupons/trainer/:trainerName/applied
 * Get all applied coupons for a trainer
 * 🔒 Admin only
 */
router.get(
  "/trainer/:trainerName/applied",
  requireAuth,
  couponController.getAppliedCouponsByTrainer
);

// ==================== CUSTOMER ROUTES ====================
// Customer endpoints - may or may not require auth

/**
 * POST /api/coupons/validate
 * Validate a coupon code before applying
 * 👤 No auth required (but can be called by authenticated user)
 */
router.post("/validate", couponController.validateCoupon);

/**
 * POST /api/coupons/apply
 * Apply a coupon to an order
 * 👤 Authenticated customer only
 */
router.post("/apply", requireAuth, couponController.applyCoupon);

export default router;
