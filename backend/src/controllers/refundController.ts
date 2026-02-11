import { Response } from "express";
import { AuthRequest } from "../middlewares/requireAuth";
import * as refundService from "../services/refundService";
import { $Enums } from "../generated/prisma";

const RefundStatus = $Enums.RefundStatus;
type RefundStatusType = $Enums.RefundStatus;

export const getAllRefunds = async (req: AuthRequest, res: Response) => {
  try {
    console.log("📦 Fetching all refunds...");
    const refunds = await refundService.getAllRefunds();
    res.json(refunds);
  } catch (error) {
    console.error("Error fetching refunds:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch refunds";
    res.status(500).json({ message });
  }
};

export const getRefundsByStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.params;
    console.log("📦 Fetching refunds with status:", status);

    if (!Object.values(RefundStatus).includes(status as RefundStatusType)) {
      return res.status(400).json({ message: "Invalid refund status" });
    }

    const refunds = await refundService.getRefundsByStatus(status as RefundStatusType);
    res.json(refunds);
  } catch (error) {
    console.error("Error fetching refunds by status:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch refunds";
    res.status(500).json({ message });
  }
};

export const getRefundByOrderId = async (req: AuthRequest, res: Response) => {
  try {
    const { orderId } = req.params;
    const id = Array.isArray(orderId) ? orderId[0] : orderId;

    console.log("📦 Fetching refund for order:", id);

    const refund = await refundService.getRefundByOrderId(id);
    
    if (!refund) {
      return res.status(404).json({ message: "Refund not found for this order" });
    }

    res.json(refund);
  } catch (error) {
    console.error("Error fetching refund:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch refund";
    res.status(500).json({ message });
  }
};

export const updateRefundStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { orderId } = req.params;
    const id = Array.isArray(orderId) ? orderId[0] : orderId;
    const { status } = req.body;

    console.log("💰 Updating refund status for order:", id, "New status:", status);

    if (!status) {
      return res.status(400).json({ message: "Refund status is required" });
    }

    if (!Object.values(RefundStatus).includes(status as RefundStatusType)) {
      return res.status(400).json({ message: "Invalid refund status" });
    }

    const refund = await refundService.updateRefundStatus(id, status as RefundStatusType);
    
    console.log("✅ Refund status updated successfully");
    res.json(refund);
  } catch (error) {
    console.error("Error updating refund status:", error);
    const message = error instanceof Error ? error.message : "Failed to update refund status";
    res.status(500).json({ message });
  }
};
