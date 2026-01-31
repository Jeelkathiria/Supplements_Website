import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
} from "../controllers/paymentController";

const router = Router();

router.post("/create-order", requireAuth, createRazorpayOrder);
router.post("/verify", requireAuth, verifyRazorpayPayment);

export default router;
