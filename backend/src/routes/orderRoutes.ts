import { Router } from "express";
import * as orderController from "../controllers/orderController";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

// User routes
router.post("/checkout", requireAuth, orderController.createCheckout);
router.get("/my", requireAuth, orderController.getUserOrders);
router.get("/:orderId", requireAuth, orderController.getOrderById);
router.delete("/:orderId/cancel", requireAuth, orderController.cancelOrder);

// Admin routes
router.get("/", requireAuth, orderController.getAllOrders);
router.patch("/:orderId/status", requireAuth, orderController.updateOrderStatus);

export default router;
