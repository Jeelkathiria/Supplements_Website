import { Request, Response } from "express";
import { AuthRequest } from "../middlewares/requireAuth";
import * as orderService from "../services/orderService";
import { $Enums } from "../generated/prisma";

const OrderStatus = $Enums.OrderStatus;
type OrderStatusType = $Enums.OrderStatus;

export const createCheckout = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const { cartItems, shippingAddress } = req.body;

    // Validate input
    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    if (!shippingAddress || !shippingAddress.name || !shippingAddress.phone ||
        !shippingAddress.address || !shippingAddress.city || !shippingAddress.pincode) {
      return res.status(400).json({ message: "Invalid shipping address" });
    }

    // Validate cart items
    for (const item of cartItems) {
      if (!item.productId || !item.quantity || !item.price) {
        return res.status(400).json({ message: "Invalid cart item data" });
      }
      if (item.quantity <= 0) {
        return res.status(400).json({ message: "Quantity must be greater than 0" });
      }
    }

    const order = await orderService.createOrder({
      userId,
      cartItems,
      shippingAddress,
    });

    res.status(201).json({
      message: "Order created successfully",
      order,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    const message = error instanceof Error ? error.message : "Failed to create order";
    res.status(500).json({ message });
  }
};

export const getUserOrders = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const orders = await orderService.getUserOrders(userId);
    res.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};

export const getOrderById = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const { orderId } = req.params;
    const order = await orderService.getOrderById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if order belongs to user
    if (order.userId !== userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    res.json(order);
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ message: "Failed to fetch order" });
  }
};

export const getAllOrders = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.query;

    // Validate status if provided
    let orderStatus: OrderStatusType | undefined;
    if (status) {
      if (!Object.values(OrderStatus).includes(status as OrderStatusType)) {
        return res.status(400).json({ message: "Invalid order status" });
      }
      orderStatus = status as OrderStatusType;
    }

    const orders = await orderService.getAllOrders(orderStatus);
    res.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};

export const updateOrderStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!status || !Object.values(OrderStatus).includes(status as OrderStatusType)) {
      return res.status(400).json({ message: "Invalid order status" });
    }

    const order = await orderService.updateOrderStatus(orderId, status as OrderStatusType);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({
      message: "Order status updated successfully",
      order,
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ message: "Failed to update order status" });
  }
};

export const cancelOrder = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const { orderId } = req.params;

    // Verify order belongs to user
    const order = await orderService.getOrderById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.userId !== userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const cancelledOrder = await orderService.cancelOrder(orderId);

    res.json({
      message: "Order cancelled successfully",
      order: cancelledOrder,
    });
  } catch (error) {
    console.error("Error cancelling order:", error);
    const message = error instanceof Error ? error.message : "Failed to cancel order";
    res.status(500).json({ message });
  }
};
