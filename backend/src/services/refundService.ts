import prisma from "../lib/prisma";
import { $Enums } from "../generated/prisma";

const RefundStatus = $Enums.RefundStatus;
type RefundStatusType = $Enums.RefundStatus;

export const createRefundForApprovedCancellation = async (
  orderId: string,
  reason: string,
  upiId?: string
) => {
  try {
    console.log("📦 Creating refund for approved cancellation - Order ID:", orderId, "UPI ID:", upiId);

    // Get order details to get refund amount
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new Error("Order not found");
    }

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

    console.log("✅ Refund created successfully:", refund.id, "for UPI:", upiId);
    return refund;
  } catch (error) {
    console.error("❌ Error creating refund:", error);
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
    return refund;
  } catch (error) {
    console.error("Error updating refund status:", error);
    throw error;
  }
};
