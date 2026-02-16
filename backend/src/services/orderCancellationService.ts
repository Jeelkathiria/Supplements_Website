import { PrismaClient } from "../generated/prisma";
import {
  sendCancellationApprovedEmail,
  sendCancellationRejectedEmail,
} from "./emailService";
import * as refundService from "./refundService";

const prisma = new PrismaClient();

export class OrderCancellationService {
  // Create a cancellation request
  static async createCancellationRequest(
    orderId: string,
    userId: string,
    reason: string,
    upiId?: string
  ) {
    console.log("OrderCancellationService.createCancellationRequest:", { orderId, userId, reasonLength: reason.length, hasUpiId: !!upiId });

    // Validate inputs
    if (!orderId || !userId || !reason) {
      const error = "Order ID, User ID, and reason are required";
      console.error(error);
      throw new Error(error);
    }

    // Validate reason has at least 20 letters
    const letterCount = reason.trim().length;
    console.log("Letter count:", letterCount);

    if (letterCount < 20) {
      const error = `Reason must be at least 20 letters. Current: ${letterCount} letters.`;
      console.error(error);
      throw new Error(error);
    }

    // Check if order exists
    console.log("🔍 Checking order:", { orderId, requestUserId: userId });
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, userId: true, status: true }
    });

    if (!order) {
      const error = "Order not found";
      console.error("❌ Order not found in database:", { orderId, userId });
      throw new Error(error);
    }

    console.log("✅ Order found:", { orderId, orderUserId: order.userId, status: order.status });

    // NOTE: Removed ownership check - any user can request cancellation for any order
    // Admin will review and approve/reject based on business logic

    // Check if cancellation request already exists for this order
    console.log("🔍 Checking for existing cancellation request:", orderId);
    const existingRequest = await prisma.orderCancellationRequest.findUnique({
      where: { orderId },
    });

    if (existingRequest) {
      const error = "Cancellation request already exists for this order";
      console.error("❌ Request already exists:", { existingRequestId: existingRequest.id });
      throw new Error(error);
    }

    console.log("✅ No existing request found");

    // Create cancellation request
    console.log("Creating new cancellation request");
    const request = await prisma.orderCancellationRequest.create({
      data: {
        orderId,
        userId,
        reason,
        ...(upiId && { upiId }), // Only include upiId if provided
      },
      include: {
        order: true,
      },
    });

    console.log("Cancellation request created:", request.id);
    return request;
  }

  // Get all pending cancellation requests (for admin)
  static async getPendingRequests() {
    return prisma.orderCancellationRequest.findMany({
      where: {
        status: "PENDING",
      },
      include: {
        order: {
          include: {
            address: true,
            items: {
              include: {
                product: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  // Get all cancellation requests with filters (for admin)
  static async getAllRequests(status?: "PENDING" | "APPROVED" | "REJECTED") {
    const where = status ? { status } : {};

    return prisma.orderCancellationRequest.findMany({
      where,
      include: {
        order: {
          include: {
            address: true,
            items: {
              include: {
                product: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  // Get cancellation request by order ID
  static async getRequestByOrderId(orderId: string) {
    return prisma.orderCancellationRequest.findUnique({
      where: { orderId },
      include: {
        order: true,
      },
    });
  }

  // Approve cancellation request and update order status
  static async approveCancellationRequest(requestId: string) {
    const request = await prisma.orderCancellationRequest.findUnique({
      where: { id: requestId },
      include: {
        order: {
          select: {
            id: true,
            totalAmount: true,
            paymentMethod: true,
            deliveredAt: true,
            status: true,
          },
        },
      },
    });

    if (!request) {
      throw new Error("Cancellation request not found");
    }

    console.log("🔍 Order details:", {
      orderId: request.orderId,
      paymentMethod: request.order.paymentMethod,
      status: request.order.status,
      deliveredAt: request.order.deliveredAt,
      requestCreatedAt: request.createdAt,
    });

    // Update request status
    const updatedRequest = await prisma.orderCancellationRequest.update({
      where: { id: requestId },
      data: { status: "APPROVED" },
    });

    // Update order status to CANCELLED
    await prisma.order.update({
      where: { id: request.orderId },
      data: { status: "CANCELLED" },
    });

    // Determine if this is pre-delivery or post-delivery cancellation
    const orderStatus = request.order.status;
    const orderDeliveredAt = request.order.deliveredAt;
    const requestCreatedAt = new Date(request.createdAt);
    
    // An order is considered post-delivery if:
    // 1. Status is DELIVERED, OR
    // 2. deliveredAt timestamp exists and is before the cancellation request was created
    const isPostDelivery = 
      orderStatus === "DELIVERED" || 
      (orderDeliveredAt && new Date(orderDeliveredAt) < requestCreatedAt);

    console.log("📊 Cancellation Type Analysis:", {
      orderStatus,
      orderDeliveredAt,
      requestCreatedAt,
      isPostDelivery,
      detectionReason: orderStatus === "DELIVERED" 
        ? "Order status is DELIVERED" 
        : orderDeliveredAt 
          ? "deliveredAt exists and is before request creation"
          : "Order not yet delivered (pre-delivery)",
    });

    // Create refund record based on delivery status and payment method
    let shouldCreateRefund = false;
    let refundReason = "";
    
    if (isPostDelivery) {
      // Post-delivery: Create refund for ANY payment method (UPI or COD)
      shouldCreateRefund = true;
      refundReason = "Post-delivery cancellation (both UPI and COD)";
      console.log("📦 Post-delivery cancellation: Creating refund for ANY payment method");
    } else {
      // Pre-delivery: Create refund only for UPI (COD payment not collected yet)
      const paymentMethod = (request.order.paymentMethod || "").toLowerCase().trim();
      console.log("💳 Pre-delivery cancellation - Payment method check:", {
        rawPaymentMethod: request.order.paymentMethod,
        normalizedPaymentMethod: paymentMethod,
      });

      if (paymentMethod === "upi") {
        shouldCreateRefund = true;
        refundReason = "Pre-delivery cancellation (UPI payment)";
        console.log("📦 Pre-delivery cancellation: Creating refund for UPI payment");
      } else {
        refundReason = "Pre-delivery cancellation (COD - no payment collected)";
        console.log("ℹ️ Pre-delivery cancellation: COD payment - No refund needed (payment not collected yet)");
      }
    }

    console.log("💰 Refund Decision:", { shouldCreateRefund, refundReason });

    let refundCreated = null;
    if (shouldCreateRefund) {
      try {
        console.log("Creating refund record - Payment method:", request.order.paymentMethod, "- Type:", isPostDelivery ? "Post-Delivery" : "Pre-Delivery");
        refundCreated = await refundService.createRefundForApprovedCancellation(
          request.orderId,
          request.reason,
          request.upiId || undefined
        );
        console.log("✅ Refund record created successfully");
      } catch (refundError) {
        console.error("⚠️ Warning: Could not create refund record:", refundError);
        // Don't throw error - cancellation approval should succeed even if refund creation fails
      }
    }

    // Send approval email to user
    try {
      const user = await prisma.user.findUnique({
        where: { id: request.userId },
      });

      if (user && user.email) {
        await sendCancellationApprovedEmail(
          user.email,
          request.orderId,
          user.name || "Valued Customer"
        );
      }
    } catch (emailError) {
      console.error("Error sending cancellation approval email:", emailError);
      // Don't throw error - cancellation is already processed
    }

    // Return both request and refund info
    return {
      request: updatedRequest,
      refund: refundCreated,
    };
  }

  // Reject cancellation request
  static async rejectCancellationRequest(requestId: string) {
    const request = await prisma.orderCancellationRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new Error("Cancellation request not found");
    }

    const updatedRequest = await prisma.orderCancellationRequest.update({
      where: { id: requestId },
      data: { status: "REJECTED" },
    });

    // Send rejection email to user
    try {
      const user = await prisma.user.findUnique({
        where: { id: request.userId },
      });

      if (user && user.email) {
        await sendCancellationRejectedEmail(
          user.email,
          request.orderId,
          user.name || "Valued Customer"
        );
      }
    } catch (emailError) {
      console.error("Error sending cancellation rejection email:", emailError);
      // Don't throw error - rejection is already processed
    }

    return updatedRequest;
  }

  // Get cancellation request for user
  static async getUserCancellationRequest(orderId: string, userId: string) {
    return prisma.orderCancellationRequest.findUnique({
      where: { orderId },
      include: { order: true },
    }).then((request) => {
      if (request && request.userId !== userId) {
        throw new Error("Unauthorized");
      }
      return request;
    });
  }

  // Upload video for cancellation request (for delivered orders with defects)
  static async uploadVideo(requestId: string, userId: string, videoUrl: string) {
    // Get the cancellation request
    const request = await prisma.orderCancellationRequest.findUnique({
      where: { id: requestId },
      include: { order: true },
    });

    if (!request) {
      throw new Error("Cancellation request not found");
    }

    // Verify the user owns this request
    if (request.userId !== userId) {
      throw new Error("Unauthorized - you can only upload videos for your own requests");
    }

    // Verify the order is in DELIVERED status
    if (request.order.status !== "DELIVERED") {
      throw new Error("Video can only be uploaded for delivered orders");
    }

    // Update the request with video URL
    return prisma.orderCancellationRequest.update({
      where: { id: requestId },
      data: {
        videoUrl,
        videoUploadedAt: new Date(),
      },
      include: {
        order: true,
      },
    });
  }
}

