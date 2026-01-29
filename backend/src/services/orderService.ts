import prisma from "../lib/prisma";
import { $Enums } from "../generated/prisma";

const OrderStatus = $Enums.OrderStatus;
type OrderStatusType = $Enums.OrderStatus;

export interface CheckoutPayload {
  userId: string;
  cartItems: Array<{
    productId: string;
    quantity: number;
    price: number; // finalPrice per unit
    flavor?: string;
    size?: string;
  }>;
  shippingAddress: {
    name: string;
    phone: string;
    address: string;
    city: string;
    state?: string;
    pincode: string;
  };
}

export const createOrder = async (payload: CheckoutPayload) => {
  try {
    // Calculate totals
    let totalAmount = 0;
    let totalDiscount = 0;

    // Verify all products exist
    for (const item of payload.cartItems) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        throw new Error(`Product ${item.productId} not found`);
      }

      // Calculate amounts
      const basePrice = product.basePrice;
      const discountAmount =
        (basePrice * (product.discountPercent || 0)) / 100;
      const finalPrice = basePrice - discountAmount;

      totalAmount += finalPrice * item.quantity;
      totalDiscount += discountAmount * item.quantity;
    }

    // Execute all operations in a transaction for data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Create OrderAddress (historical snapshot)
      const orderAddress = await tx.orderAddress.create({
        data: {
          name: payload.shippingAddress.name,
          phone: payload.shippingAddress.phone,
          address: payload.shippingAddress.address,
          city: payload.shippingAddress.city,
          state: payload.shippingAddress.state || "",
          pincode: payload.shippingAddress.pincode,
        },
      });

      // Create order
      const order = await tx.order.create({
        data: {
          userId: payload.userId,
          totalAmount,
          discount: totalDiscount,
          status: OrderStatus.PENDING,
          addressId: orderAddress.id,
          items: {
            create: payload.cartItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              flavor: item.flavor || null,
              size: item.size || null,
            })),
          },
        },
      });

      // Update OrderAddress with the order ID
      await tx.orderAddress.update({
        where: { id: orderAddress.id },
        data: { orderId: order.id }
      });

      // Fetch the complete order with relations
      const completeOrder = await tx.order.findUnique({
        where: { id: order.id },
        include: {
          items: {
            include: { product: true },
          },
          address: true,
        },
      });

      return completeOrder;
    });

    return result;
  } catch (error) {
    console.error("Error creating order:", error);
    throw error;
  }
};

export const placeOrderFromCart = async (userId: string, addressId: string) => {
  try {
    // Verify address exists and belongs to user
    const address = await prisma.address.findUnique({
      where: { id: addressId }
    });

    if (!address || address.userId !== userId) {
      throw new Error("Address not found or unauthorized");
    }

    // Get user's cart
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: { product: true }
        }
      }
    });

    if (!cart || cart.items.length === 0) {
      throw new Error("Cart is empty");
    }

    // Calculate totals
    let totalAmount = 0;
    let totalDiscount = 0;

    for (const item of cart.items) {
      const product = item.product;

      const basePrice = product.basePrice;
      const discountAmount = (basePrice * (product.discountPercent || 0)) / 100;
      const finalPrice = basePrice - discountAmount;

      totalAmount += finalPrice * item.quantity;
      totalDiscount += discountAmount * item.quantity;
    }

    // Execute all operations in a transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create OrderAddress first (historical snapshot) without orderId
      const orderAddress = await tx.orderAddress.create({
        data: {
          name: address.name,
          phone: address.phone,
          address: address.address,
          city: address.city,
          state: address.state || "",
          pincode: address.pincode,
        },
      });

      // Create order and connect to OrderAddress
      const newOrder = await tx.order.create({
        data: {
          userId,
          totalAmount,
          discount: totalDiscount,
          status: OrderStatus.PENDING,
          addressId: orderAddress.id,
          items: {
            create: cart.items.map((item) => {
              const product = item.product;
              const basePrice = product.basePrice;
              const discountAmount = (basePrice * (product.discountPercent || 0)) / 100;
              const finalPrice = basePrice - discountAmount;

              return {
                productId: item.productId,
                quantity: item.quantity,
                price: finalPrice,
                flavor: item.flavor,
                size: item.size
              };
            })
          }
        },
      });

      // Update OrderAddress with the order ID
      await tx.orderAddress.update({
        where: { id: orderAddress.id },
        data: { orderId: newOrder.id }
      });

      // Fetch the complete order with relations
      const completeOrder = await tx.order.findUnique({
        where: { id: newOrder.id },
        include: {
          items: {
            include: { product: true }
          },
          address: true
        }
      });

      // Clear cart
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id }
      });

      return completeOrder;
    });

    return order;
  } catch (error) {
    console.error("Error placing order from cart:", error);
    throw error;
  }
};

export const getUserOrders = async (userId: string) => {
  try {
    return await prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: { product: true },
        },
        address: true,
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Error fetching user orders:", error);
    throw error;
  }
};

export const getOrderById = async (orderId: string) => {
  try {
    return await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: { product: true },
        },
        address: true,
      },
    });
  } catch (error) {
    console.error("Error fetching order:", error);
    throw error;
  }
};

export const getAllOrders = async (status?: OrderStatusType) => {
  try {
    const whereClause = status ? { status } : {};
    return await prisma.order.findMany({
      where: whereClause,
      include: {
        items: {
          include: { product: true },
        },
        address: true,
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    throw error;
  }
};

export const updateOrderStatus = async (
  orderId: string,
  status: OrderStatusType
) => {
  try {
    return await prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: {
        items: {
          include: { product: true },
        },
        address: true,
      },
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    throw error;
  }
};

export const cancelOrder = async (orderId: string) => {
  try {
    // Get order details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      throw new Error("Order not found");
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new Error(`Cannot cancel order with status ${order.status}`);
    }

    // Update order status
    return await prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.CANCELLED },
      include: {
        items: {
          include: { product: true },
        },
        address: true,
      },
    });
  } catch (error) {
    console.error("Error cancelling order:", error);
    throw error;
  }
};
