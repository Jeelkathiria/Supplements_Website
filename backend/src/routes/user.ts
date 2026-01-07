import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import {
  syncUser,
  addAddress,
  getAddresses,
  setDefaultAddress,
  deleteAddress,
  getCheckoutData
} from "../controllers/userController";

const router = Router();

router.post("/sync", requireAuth, syncUser);
router.get("/checkout", requireAuth, getCheckoutData);
router.post("/address", requireAuth, addAddress);
router.get("/address", requireAuth, getAddresses);
router.patch("/address/:id/default", requireAuth, setDefaultAddress);
router.delete("/address/:id", requireAuth, deleteAddress);

export default router;
