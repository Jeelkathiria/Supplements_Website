import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { requireAdmin } from "../middlewares/requireAdmin";
import { getAllOrders, updateOrderStatus } from "../controllers/adminOrdersController";

const router = Router();

router.get("/orders", requireAuth, requireAdmin, getAllOrders);
router.patch("/orders/:id/status", requireAuth, requireAdmin, updateOrderStatus);

export default router;
