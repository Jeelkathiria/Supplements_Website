import { PrismaClient } from "../generated/prisma";

const prisma = new PrismaClient();

export class OrderCancellationService {
  // Create a cancellation request
  static async createCancellationRequest(
    orderId: string,
    userId: string,
    reason: string
  ) {
    console.log("OrderCancellationService.createCancellationRequest:", { orderId, userId, reasonLength: reason.length });
    
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
      include: { order: true },
    });

    if (!request) {
      throw new Error("Cancellation request not found");
    }

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

    return updatedRequest;
  }

  // Reject cancellation request
  static async rejectCancellationRequest(requestId: string) {
    const request = await prisma.orderCancellationRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new Error("Cancellation request not found");
    }

    return prisma.orderCancellationRequest.update({
      where: { id: requestId },
      data: { status: "REJECTED" },
    });
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
}
