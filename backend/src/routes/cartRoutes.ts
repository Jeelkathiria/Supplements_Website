import { Router } from "express";
import * as cartController from "../controllers/cartController";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

router.get("/", requireAuth, cartController.getCart);
router.post("/add", requireAuth, cartController.addItem);
router.post("/merge", requireAuth, cartController.mergeCart);
router.put("/update", requireAuth, cartController.updateItem);
router.delete("/remove", requireAuth, cartController.removeItem);

export default router;
