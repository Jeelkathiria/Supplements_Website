import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import * as refundController from "../controllers/refundController";

const router = Router();

// Get all refunds (admin only)
router.get("/admin/all", requireAuth, refundController.getAllRefunds);

// Get refunds by status (admin only)
router.get("/admin/status/:status", requireAuth, refundController.getRefundsByStatus);

// Get refund by order ID
router.get("/order/:orderId", requireAuth, refundController.getRefundByOrderId);

// Update refund status (admin only)
router.patch("/:orderId/status", requireAuth, refundController.updateRefundStatus);

export default router;
