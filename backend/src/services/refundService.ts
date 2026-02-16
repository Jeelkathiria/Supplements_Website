import prisma from "../lib/prisma";
import { $Enums } from "../generated/prisma";
import {
  sendRefundInitiatedEmail,
  sendRefundCompletedEmail,
} from "./emailService";

const RefundStatus = $Enums.RefundStatus;
type RefundStatusType = $Enums.RefundStatus;

export const createRefundForApprovedCancellation = async (
  orderId: string,
  reason: string,
  upiId?: string
) => {
  try {
    console.log("📦 Creating refund for approved cancellation", {
      orderId,
      hasUpiId: !!upiId,
      upiId: upiId ? "***" : "not provided",
    });

    // Get order details to get refund amount
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        totalAmount: true,
        paymentMethod: true,
      },
    });

    if (!order) {
      throw new Error("Order not found");
    }

    console.log("💳 Order payment info:", {
      orderId,
      paymentMethod: order.paymentMethod,
      totalAmount: order.totalAmount,
    });

    // Create refund record with INITIATED status
    const refund = await prisma.orderRefund.create({
      data: {
        orderId,
        refundAmount: order.totalAmount,
        reason,
        status: RefundStatus.INITIATED,
        ...(upiId && { upiId }), // Only include upiId if provided
      },
    });

    console.log("✅ Refund created successfully", {
      refundId: refund.id,
      orderId: refund.orderId,
      amount: refund.refundAmount,
      status: refund.status,
      hasUpiId: !!refund.upiId,
    });

    // Send refund initiated email to user
    try {
      const user = await prisma.user.findUnique({
        where: { id: order.id }, // Get user from order
        include: {
          orders: {
            where: { id: orderId },
            select: { id: true },
          },
        },
      });

      // Actually, we need to get the order first to get the user, let me fix that
      const orderWithUser = await prisma.order.findUnique({
        where: { id: orderId },
        select: {
          totalAmount: true,
          paymentMethod: true,
          userId: true,
        },
      });

      if (orderWithUser) {
        const userForEmail = await prisma.user.findUnique({
          where: { id: orderWithUser.userId },
        });

        if (userForEmail && userForEmail.email) {
          console.log("📧 Sending refund initiated email to:", userForEmail.email);
          await sendRefundInitiatedEmail(
            userForEmail.email,
            orderId,
            userForEmail.name || "Valued Customer",
            refund.refundAmount,
            orderWithUser.paymentMethod || "cod"
          );
          console.log("✅ Refund initiated email sent successfully!");
        }
      }
    } catch (emailError) {
      console.error("❌ Error sending refund initiated email:", emailError);
      // Don't throw error - refund is already created, email is just a notification
    }

    return refund;
  } catch (error: any) {
    console.error("❌ Error creating refund:", {
      orderId,
      errorMessage: error.message,
      errorCode: error.code,
    });
    throw error;
  }
};

export const getAllRefunds = async () => {
  try {
    return await prisma.orderRefund.findMany({
      include: {
        order: true,
      },
      orderBy: { initiatedAt: "desc" },
    });
  } catch (error) {
    console.error("Error fetching refunds:", error);
    throw error;
  }
};

export const getRefundsByStatus = async (status: RefundStatusType) => {
  try {
    return await prisma.orderRefund.findMany({
      where: { status },
      include: {
        order: true,
      },
      orderBy: { initiatedAt: "desc" },
    });
  } catch (error) {
    console.error("Error fetching refunds by status:", error);
    throw error;
  }
};

export const getRefundByOrderId = async (orderId: string) => {
  try {
    return await prisma.orderRefund.findUnique({
      where: { orderId },
      include: {
        order: true,
      },
    });
  } catch (error) {
    console.error("Error fetching refund:", error);
    throw error;
  }
};

export const updateRefundStatus = async (
  orderId: string,
  newStatus: RefundStatusType
) => {
  try {
    console.log("💰 Updating refund status - Order ID:", orderId, "New Status:", newStatus);

    const updateData: any = { status: newStatus };

    // Set completedAt when status is REFUND_COMPLETED
    if (newStatus === RefundStatus.REFUND_COMPLETED) {
      updateData.completedAt = new Date();
    }

    const refund = await prisma.orderRefund.update({
      where: { orderId },
      data: updateData,
      include: {
        order: true,
      },
    });

    console.log("✅ Refund status updated successfully");

    // Send refund completed email when status is REFUND_COMPLETED
    if (newStatus === RefundStatus.REFUND_COMPLETED) {
      try {
        const userForEmail = await prisma.user.findUnique({
          where: { id: refund.order.userId },
        });

        if (userForEmail && userForEmail.email) {
          console.log("📧 Sending refund completed email to:", userForEmail.email);
          await sendRefundCompletedEmail(
            userForEmail.email,
            orderId,
            userForEmail.name || "Valued Customer",
            refund.refundAmount,
            refund.completedAt?.toString() || new Date().toString()
          );
          console.log("✅ Refund completed email sent successfully!");
        }
      } catch (emailError) {
        console.error("❌ Error sending refund completed email:", emailError);
        // Don't throw error - refund status is already updated, email is just a notification
      }
    }

    return refund;
  } catch (error) {
    console.error("Error updating refund status:", error);
    throw error;
  }
};
