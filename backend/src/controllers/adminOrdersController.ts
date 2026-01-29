import { Request, Response } from "express";
import { AuthRequest } from "../middlewares/requireAuth";
import prisma from "../lib/prisma";
import { $Enums } from "../generated/prisma";

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
            product: {
              select: {
                id: true,
                name: true,
                basePrice: true,
                discountPercent: true,
                imageUrls: true,
              }
            }
          }
        },
        address: true
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
    const { id } = req.params;
    const { status } = req.body;

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
            product: {
              select: {
                id: true,
                name: true,
                basePrice: true,
                discountPercent: true,
                imageUrls: true,
              }
            }
          }
        },
        address: true
      }
    });

    // Fetch user details
    const user = await prisma.user.findUnique({
      where: { id: updated.userId }
    });

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
