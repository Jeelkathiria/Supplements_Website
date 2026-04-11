import { Request, Response } from "express";
import { AuthRequest } from "../middlewares/requireAuth";
import prisma from "../lib/prisma";
import { $Enums } from "../generated/prisma";
import { 
  sendOrderShippedEmail, 
  sendOrderDeliveredEmail, 
  sendOrderConfirmationEmail,
  sendCancellationApprovedEmail
} from "../services/emailService";

const OrderStatus = $Enums.OrderStatus;
type OrderStatusType = $Enums.OrderStatus;

export const getAllOrders = async (_req: Request, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          select: {
            id: true,
            orderId: true,
            productId: true,
            quantity: true,
            price: true,
            flavor: true,
            size: true,
            basePrice: true,
            discountPercent: true,
            productName: true,
            imageUrl: true,
            product: {
              select: {
                id: true,
                name: true,
                imageUrls: true,
              }
            }
          }
        },
        address: true,
        appliedCoupon: true
      }
    });

    // Fetch user details for each order
    const ordersWithUsers = await Promise.all(
      orders.map(async (order) => {
        const user = await prisma.user.findUnique({
          where: { id: order.userId }
        });
        return {
          ...order,
          user: {
            id: user?.id,
            email: user?.email,
            name: user?.name,
            phone: user?.phone
          }
        };
      })
    );

    res.json(ordersWithUsers);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const paramId = req.params.id;
    const id = Array.isArray(paramId) ? paramId[0] : paramId;
    const { status, trackingNumber } = req.body;

    // Validate status
    if (!status || !Object.values(OrderStatus).includes(status as OrderStatusType)) {
      return res.status(400).json({ message: "Invalid order status" });
    }

    const updated = await prisma.order.update({
      where: { id },
      data: { status },
      include: {
        items: {
          select: {
            id: true,
            orderId: true,
            productId: true,
            quantity: true,
            price: true,
            flavor: true,
            size: true,
            basePrice: true,
            discountPercent: true,
            productName: true,
            imageUrl: true,
            product: {
              select: {
                id: true,
                name: true,
                imageUrls: true,
              }
            }
          }
        },
        address: true,
        appliedCoupon: true
      }
    });

    // Fetch user details
    const user = await prisma.user.findUnique({
      where: { id: updated.userId }
    });

    // Send Status Update Emails
    if (user && user.email) {
      try {
        console.log(`📧 Detected status change for order ${id}: ${status}`);
        
        if (status === OrderStatus.SHIPPED) {
          console.log(`📧 Sending Shipped email to ${user.email}`);
          await sendOrderShippedEmail(user.email, updated.id, user.name || "Valued Customer", trackingNumber);
        } 
        else if (status === OrderStatus.DELIVERED) {
          console.log(`📧 Sending Delivered email to ${user.email}`);
          await sendOrderDeliveredEmail(user.email, updated.id, user.name || "Valued Customer");
        }
        else if (status === OrderStatus.PAID) {
          console.log(`📧 Status updated to PAID - Sending notification to ${user.email}`);
          const items = updated.items.map(item => ({
            productName: item.productName || item.product.name,
            quantity: item.quantity,
            price: item.price,
            flavor: item.flavor || undefined,
            size: item.size || undefined
          }));
          await sendOrderConfirmationEmail(user.email, updated.id, user.name || "Valued Customer", updated.totalAmount, items);
        }
        else if (status === OrderStatus.CANCELLED) {
          console.log(`📧 Order manually marked as CANCELLED - Sending notification to ${user.email}`);
          await sendCancellationApprovedEmail(user.email, updated.id, user.name || "Valued Customer", "Order marked as cancelled by administrator.");
        }
      } catch (emailErr) {
        console.error("❌ Failed to send status update email:", emailErr);
        // We don't fail the request if email fails
      }
    }

    res.json({
      message: "Order status updated successfully",
      order: {
        ...updated,
        user: {
          id: user?.id,
          email: user?.email,
          name: user?.name,
          phone: user?.phone
        }
      }
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    const message = error instanceof Error ? error.message : "Failed to update order status";
    res.status(500).json({ message });
  }
};
