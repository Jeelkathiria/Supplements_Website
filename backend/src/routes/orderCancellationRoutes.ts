import { Router } from "express";
import { OrderCancellationController } from "../controllers/orderCancellationController";
import { requireAuth } from "../middlewares/requireAuth";
import { videoUpload } from "../middlewares/videoUpload";

const router = Router();

// Admin routes (more specific, place first)
// Get all pending cancellation requests
router.get("/admin/pending", requireAuth, OrderCancellationController.getPendingRequests);

// Get all cancellation requests with optional filter
router.get("/admin/all", requireAuth, OrderCancellationController.getAllRequests);

// User routes
// Get cancellation request for specific order
router.get("/order/:orderId", requireAuth, OrderCancellationController.getRequestByOrderId);

// Upload video for cancellation request (for delivered orders)
router.post("/:requestId/upload-video", requireAuth, videoUpload.single("video"), OrderCancellationController.uploadVideo);

// Create cancellation request
router.post("/", requireAuth, OrderCancellationController.createRequest);

// Approve cancellation request (admin only)
router.patch("/:requestId/approve", requireAuth, OrderCancellationController.approveCancellation);

// Reject cancellation request (admin only)
router.patch("/:requestId/reject", requireAuth, OrderCancellationController.rejectCancellation);

export default router;
