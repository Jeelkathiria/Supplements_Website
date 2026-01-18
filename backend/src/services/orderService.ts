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
    pincode: string;
  };
}

export const createOrder = async (payload: CheckoutPayload) => {
  try {
    // Calculate totals
    let totalAmount = 0;
    let totalDiscount = 0;

    // Verify all products exist and have sufficient stock
    for (const item of payload.cartItems) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        throw new Error(`Product ${item.productId} not found`);
      }

      if (product.stockQuantity < item.quantity) {
        throw new Error(
          `Insufficient stock for ${product.name}. Available: ${product.stockQuantity}, Requested: ${item.quantity}`
        );
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
      // Create order
      const order = await tx.order.create({
        data: {
          userId: payload.userId,
          totalAmount,
          discount: totalDiscount,
          status: OrderStatus.PENDING,
          address: {
            create: {
              userId: payload.userId,
              name: payload.shippingAddress.name,
              phone: payload.shippingAddress.phone,
              address: payload.shippingAddress.address,
              city: payload.shippingAddress.city,
              pincode: payload.shippingAddress.pincode,
            },
          },
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
        include: {
          items: {
            include: { product: true },
          },
          address: true,
        },
      });

      // Update product stock
      for (const item of payload.cartItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: {
              decrement: item.quantity,
            },
          },
        });
      }

      // Clear user's cart
      const userCart = await tx.cart.findUnique({
        where: { userId: payload.userId },
      });

      if (userCart) {
        await tx.cartItem.deleteMany({
          where: { cartId: userCart.id },
        });
      }

      return order;
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

    // Calculate totals and verify stock
    let totalAmount = 0;
    let totalDiscount = 0;

    for (const item of cart.items) {
      const product = item.product;

      if (product.stockQuantity < item.quantity) {
        throw new Error(
          `Insufficient stock for ${product.name}. Available: ${product.stockQuantity}, Requested: ${item.quantity}`
        );
      }

      const basePrice = product.basePrice;
      const discountAmount = (basePrice * (product.discountPercent || 0)) / 100;
      const finalPrice = basePrice - discountAmount;

      totalAmount += finalPrice * item.quantity;
      totalDiscount += discountAmount * item.quantity;
    }

    // Execute all operations in a transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          userId,
          totalAmount,
          gstAmount: 0,
          discount: totalDiscount,
          status: OrderStatus.PENDING,
          addressId,
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
        include: {
          items: {
            include: { product: true }
          },
          address: true
        }
      });

      // Update product stock
      for (const item of cart.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: {
              decrement: item.quantity
            }
          }
        });
      }

      // Clear cart
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id }
      });

      return newOrder;
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

    // Restore product stock
    for (const item of order.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stockQuantity: {
            increment: item.quantity,
          },
        },
      });
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
