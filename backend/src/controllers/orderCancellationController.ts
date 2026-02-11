import { Request, Response } from "express";
import { OrderCancellationService } from "../services/orderCancellationService";

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export class OrderCancellationController {
  // Create cancellation request
  static async createRequest(req: Request, res: Response) {
    try {
      const { orderId, reason } = req.body;
      const userId = req.user?.uid;

      console.log("📨 Create cancellation request API called:", { orderId, reasonLength: reason?.length, userId });

      if (!userId) {
        console.error("❌ No user ID found in request");
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Trim reason to remove extra whitespace, handle string arrays
      const reasonValue = Array.isArray(reason) ? reason[0] : reason;
      const trimmedReason = (reasonValue as string)?.trim() || '';

      if (!orderId || !trimmedReason) {
        console.error("❌ Missing required fields:", { orderId, reason: trimmedReason });
        return res.status(400).json({ 
          error: "Order ID and reason are required",
          received: { orderId, reason: trimmedReason, isEmpty: !trimmedReason }
        });
      }

      console.log("✅ Input validation passed");

      const request = await OrderCancellationService.createCancellationRequest(
        orderId,
        userId,
        trimmedReason
      );

      return res.status(201).json({
        success: true,
        message: "Cancellation request submitted successfully",
        data: request,
      });
    } catch (error: any) {
      console.error("Error creating cancellation request:", error.message);
      return res.status(400).json({
        success: false,
        error: error.message || "Failed to create cancellation request",
      });
    }
  }

  // Get pending requests (admin only)
  static async getPendingRequests(req: Request, res: Response) {
    try {
      const requests = await OrderCancellationService.getPendingRequests();
      return res.status(200).json({
        success: true,
        data: requests,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error.message || "Failed to fetch pending requests",
      });
    }
  }

  // Get all requests with optional filter (admin only)
  static async getAllRequests(req: Request, res: Response) {
    try {
      const { status } = req.query;
      const requests = await OrderCancellationService.getAllRequests(
        status as "PENDING" | "APPROVED" | "REJECTED" | undefined
      );
      return res.status(200).json({
        success: true,
        data: requests,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error.message || "Failed to fetch requests",
      });
    }
  }

  // Approve cancellation request (admin only)
  static async approveCancellation(req: Request, res: Response) {
    try {
      const { requestId } = req.params;
      const id = Array.isArray(requestId) ? requestId[0] : requestId;

      if (!id) {
        return res.status(400).json({ error: "Request ID is required" });
      }

      const updated = await OrderCancellationService.approveCancellationRequest(id);

      return res.status(200).json({
        success: true,
        message: "Cancellation request approved. Order cancelled.",
        data: updated,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: error.message || "Failed to approve cancellation request",
      });
    }
  }

  // Reject cancellation request (admin only)
  static async rejectCancellation(req: Request, res: Response) {
    try {
      const { requestId } = req.params;
      const id = Array.isArray(requestId) ? requestId[0] : requestId;

      if (!id) {
        return res.status(400).json({ error: "Request ID is required" });
      }

      const updated = await OrderCancellationService.rejectCancellationRequest(id);

      return res.status(200).json({
        success: true,
        message: "Cancellation request rejected.",
        data: updated,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: error.message || "Failed to reject cancellation request",
      });
    }
  }

  // Get cancellation request for specific order
  static async getRequestByOrderId(req: Request, res: Response) {
    try {
      const { orderId } = req.params;
      const id = Array.isArray(orderId) ? orderId[0] : orderId;

      if (!id) {
        return res.status(400).json({ error: "Order ID is required" });
      }

      const req_data = await OrderCancellationService.getRequestByOrderId(id);

      return res.status(200).json({
        success: true,
        data: req_data,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error.message || "Failed to fetch cancellation request",
      });
    }
  }

  // Upload video for cancellation request (for delivered orders with defects)
  static async uploadVideo(req: Request, res: Response) {
    try {
      const { requestId } = req.params;
      const userId = req.user?.uid;
      const id = Array.isArray(requestId) ? requestId[0] : requestId;

      if (!id) {
        return res.status(400).json({ error: "Request ID is required" });
      }

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "Video file is required" });
      }

      // Store the video URL
      const videoUrl = `/uploads/videos/${req.file.filename}`;

      // Update cancellation request with video URL
      const updated = await OrderCancellationService.uploadVideo(id, userId, videoUrl);

      return res.status(200).json({
        success: true,
        message: "Video uploaded successfully",
        data: updated,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: error.message || "Failed to upload video",
      });
    }
  }
}

