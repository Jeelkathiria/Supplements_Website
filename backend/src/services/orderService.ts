import prisma from "../lib/prisma";
import { $Enums } from "../generated/prisma";
import { generateOrderId } from "../lib/idGenerator";
import {
  sendOrderConfirmationEmail,
  sendOrderShippedEmail,
  sendOrderDeliveredEmail,
} from "./emailService";

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
    // Calculate totals and store product snapshots
    let totalAmount = 0;
    let totalDiscount = 0;
    const productSnapshots: { [key: string]: any } = {};

    // Verify all products exist and store snapshots
    for (const item of payload.cartItems) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        throw new Error(`Product ${item.productId} not found`);
      }

      productSnapshots[item.productId] = product;

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

      // Create order with custom order ID (numbers and hyphens only) - ensured unique
      const customOrderId = await generateOrderId();
      const order = await tx.order.create({
        data: {
          id: customOrderId,
          userId: payload.userId,
          totalAmount,
          discount: totalDiscount,
          status: OrderStatus.PENDING,
          addressId: orderAddress.id,
          items: {
            create: payload.cartItems.map((item) => {
              const product = productSnapshots[item.productId];
              return {
                productId: item.productId,
                quantity: item.quantity,
                price: item.price,
                flavor: item.flavor || null,
                size: item.size || null,
                // Store product snapshot
                productName: product.name,
                basePrice: product.basePrice,
                discountPercent: product.discountPercent || 0,
                imageUrl: product.imageUrls?.[0] || null,
              };
            }),
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

export const placeOrderFromCart = async (
  userId: string,
  addressId: string,
  paymentMethod: string = 'cod',
  couponCode?: string,
  couponDiscount: number = 0
) => {
  try {
    console.log("=== PLACE ORDER FROM CART ===");
    console.log("User ID:", userId);
    console.log("Address ID:", addressId);
    console.log("Payment Method:", paymentMethod);
    console.log("Coupon Code:", couponCode);
    console.log("Coupon Discount:", couponDiscount);

    // Verify address exists and belongs to user
    const address = await prisma.address.findUnique({
      where: { id: addressId }
    });

    console.log("Address found:", !!address);
    if (address) console.log("Address belongs to user:", address.userId === userId);

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

    console.log("Cart found:", !!cart);
    if (cart) console.log("Cart items count:", cart.items.length);

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

    // Apply coupon discount
    const finalTotalAmount = Math.max(0, totalAmount - couponDiscount);

    console.log("Total amount before coupon:", totalAmount);
    console.log("Coupon discount:", couponDiscount);
    console.log("Final total amount:", finalTotalAmount);
    console.log("Total product discount:", totalDiscount);

    // Execute all operations in a transaction
    const order = await prisma.$transaction(async (tx) => {
      console.log("Starting transaction...");

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

      console.log("OrderAddress created:", orderAddress.id);

      // Create order with custom order ID (numbers and hyphens only) - ensured unique
      const customOrderId = await generateOrderId();
      const newOrder = await tx.order.create({
        data: {
          id: customOrderId,
          userId,
          totalAmount: finalTotalAmount,
          discount: couponDiscount > 0 ? couponDiscount : totalDiscount,
          status: OrderStatus.PENDING,
          paymentMethod: paymentMethod,
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
                size: item.size,
                // Store product snapshot
                productName: product.name,
                basePrice: basePrice,
                discountPercent: product.discountPercent || 0,
                imageUrl: product.imageUrls?.[0] || null,
              };
            })
          }
        },
      });

      console.log("Order created:", newOrder.id);
      console.log("Order totalAmount:", newOrder.totalAmount);
      console.log("Order discount:", newOrder.discount);

      // Update OrderAddress with the order ID
      await tx.orderAddress.update({
        where: { id: orderAddress.id },
        data: { orderId: newOrder.id }
      });

      console.log("OrderAddress updated with orderId");

      // If a coupon was applied, create AppliedCoupon record
      if (couponCode && couponDiscount > 0) {
        console.log("Creating AppliedCoupon record for code:", couponCode);
        
        // Find the coupon
        const coupon = await tx.coupon.findUnique({
          where: { code: couponCode }
        });

        if (coupon) {
          const appliedCoupon = await tx.appliedCoupon.create({
            data: {
              couponId: coupon.id,
              orderId: newOrder.id,
              userId,
              discountAmount: couponDiscount,
              trainerName: coupon.trainerName,
              trainerId: coupon.trainerId || undefined,
              commissionNote: `${coupon.discountPercent}% discount = ₹${couponDiscount.toFixed(2)}`
            }
          });

          console.log("AppliedCoupon created:", appliedCoupon.id);

          // Update order with couponCode
          await tx.order.update({
            where: { id: newOrder.id },
            data: { couponCode }
          });

          console.log("Order updated with couponCode");
        }
      }

      // Fetch the complete order with relations
      const completeOrder = await tx.order.findUnique({
        where: { id: newOrder.id },
        include: {
          items: {
            include: { product: true }
          },
          address: true,
          appliedCoupon: true
        }
      });

      // Only clear cart for COD orders
      // For UPI orders, cart will be cleared after payment verification
      if (paymentMethod === 'cod') {
        await tx.cartItem.deleteMany({
          where: { cartId: cart.id }
        });

        console.log("Cart items cleared (COD order)");
      } else {
        console.log("Cart NOT cleared - payment verification pending (UPI order)");
      }

      return completeOrder;
    });

    // Send order confirmation email only for COD orders
    // For online payments (UPI/Razorpay), email will be sent after payment verification
    const isCodPayment = paymentMethod && paymentMethod.toLowerCase() === 'cod';
    console.log("Check payment method - paymentMethod:", paymentMethod, "isCod:", isCodPayment);
    
    if (isCodPayment) {
      try {
        console.log("📧 COD Order - Fetching user for email send. User ID:", userId);
        const user = await prisma.user.findUnique({
          where: { id: userId },
        });

        console.log("📧 User found:", user);
        console.log("📧 User email:", user?.email);
        console.log("📧 User name:", user?.name);

        if (!user) {
          console.error("❌ User not found in database");
        } else if (!user.email) {
          console.error("❌ User email is empty or null");
        } else {
          const items = order?.items?.map((item) => ({
            productName: item.product.name,
            quantity: item.quantity,
            price: item.price,
            flavor: item.flavor || undefined,
            size: item.size || undefined,
          })) || [];

          console.log("📧 Sending COD confirmation email to:", user.email);
          console.log("📧 Order ID:", order?.id);
          console.log("📧 Items count:", items?.length || 0);

          if (order && items) {
            await sendOrderConfirmationEmail(
              user.email,
              order.id,
              user.name || "Valued Customer",
              order.totalAmount,
              items
            );

            console.log("✅ COD Order confirmation email sent successfully!");
          }
        }
      } catch (emailError: any) {
        console.error("❌ Error sending COD order confirmation email:");
        console.error("Error message:", emailError?.message);
        console.error("Error details:", emailError);
        // Don't throw error - order is already created, email is just a notification
      }
    } else {
      console.log("📧 Online payment order (UPI/Razorpay) - Email will be sent after payment verification");
    }

    console.log("=== PLACE ORDER FROM CART SUCCESS ===");
    
    // Transform order response: map 'discount' to 'discountAmount' for API compatibility
    const transformedOrder = {
      ...order,
      discountAmount: order.discount
    };
    
    return transformedOrder;
  } catch (error) {
    console.error("=== PLACE ORDER FROM CART ERROR ===");
    console.error("Error type:", error instanceof Error ? "Error" : typeof error);
    console.error("Error message:", error instanceof Error ? error.message : String(error));
    console.error("Full error:", error);
    if (error instanceof Error && error.stack) {
      console.error("Stack trace:", error.stack);
    }
    throw error;
  }
};

// Helper function to transform order response
const transformOrderResponse = (order: any): any => {
  if (!order) return order;
  return {
    ...order,
    discountAmount: order.discount
  };
};

// Helper function to transform multiple orders
const transformOrdersResponse = (orders: any[]): any[] => {
  return orders.map(transformOrderResponse);
};

export const getUserOrders = async (userId: string) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: { product: true },
        },
        address: true,
        appliedCoupon: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return transformOrdersResponse(orders);
  } catch (error) {
    console.error("Error fetching user orders:", error);
    throw error;
  }
};

export const getOrderById = async (orderId: string) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: { product: true },
        },
        address: true,
        cancellationRequest: true,
        appliedCoupon: true,
      },
    });
    return transformOrderResponse(order);
  } catch (error) {
    console.error("Error fetching order:", error);
    throw error;
  }
};

export const getAllOrders = async (status?: OrderStatusType) => {
  try {
    const whereClause = status ? { status } : {};
    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        items: {
          include: { product: true },
        },
        address: true,
        cancellationRequest: true,
        appliedCoupon: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return transformOrdersResponse(orders);
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
    // Check if there's a pending cancellation request for this order
    const pendingCancellation = await prisma.orderCancellationRequest.findFirst({
      where: {
        orderId,
        status: 'PENDING'
      }
    });

    if (pendingCancellation) {
      throw new Error("Cannot update order status while a cancellation request is pending. Please accept or reject the cancellation request first.");
    }

    // Prepare data object with status and appropriate timestamp
    const updateData: any = { status };
    
    if (status === OrderStatus.SHIPPED) {
      updateData.shippedAt = new Date();
    } else if (status === OrderStatus.DELIVERED) {
      updateData.deliveredAt = new Date();
    }

    const order = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: {
        items: {
          include: { product: true },
        },
        address: true,
      },
    });

    // Send appropriate email based on status change
    try {
      const user = await prisma.user.findUnique({
        where: { id: order.userId },
      });

      if (user && user.email) {
        if (status === OrderStatus.SHIPPED) {
          await sendOrderShippedEmail(
            user.email,
            order.id,
            user.name || "Valued Customer"
          );
        } else if (status === OrderStatus.DELIVERED) {
          await sendOrderDeliveredEmail(
            user.email,
            order.id,
            user.name || "Valued Customer"
          );
        }
      }
    } catch (emailError) {
      console.error("Error sending order status email:", emailError);
      // Don't throw error - order is already updated, email is just a notification
    }

    return order;
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

export const clearCartAfterPayment = async (userId: string) => {
  try {
    console.log("=== CLEARING CART AFTER PAYMENT ===");
    console.log("User ID:", userId);

    const cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      console.log("No cart found for user");
      return;
    }

    // Clear cart items
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id }
    });

    console.log("Cart cleared after payment verification");
  } catch (error) {
    console.error("Error clearing cart after payment:", error);
    throw error;
  }
};

export const sendOrderConfirmationEmailForOrder = async (orderId: string) => {
  try {
    console.log("📧 sendOrderConfirmationEmailForOrder called for order:", orderId);
    
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: { product: true }
        }
      }
    });

    if (!order) {
      console.error("❌ Order not found:", orderId);
      return false;
    }

    console.log("✅ Order found:", order.id, "Payment method:", order.paymentMethod);

    const user = await prisma.user.findUnique({
      where: { id: order.userId },
    });

    console.log("📧 User lookup result:", user ? "Found" : "Not found");
    console.log("📧 User email:", user?.email);
    console.log("📧 User name:", user?.name);

    if (!user) {
      console.error("❌ User not found in database");
      return false;
    } else if (!user.email) {
      console.error("❌ User email is empty or null");
      return false;
    }

    const items = order.items.map((item) => ({
      productName: item.product.name,
      quantity: item.quantity,
      price: item.price,
      flavor: item.flavor || undefined,
      size: item.size || undefined,
    }));

    console.log("📧 Preparing to send confirmation email...");
    console.log("📧 To:", user.email);
    console.log("📧 Order ID:", order.id);
    console.log("📧 Items count:", items.length);

    await sendOrderConfirmationEmail(
      user.email,
      order.id,
      user.name || "Valued Customer",
      order.totalAmount,
      items
    );

    console.log("✅ Order confirmation email sent successfully for order:", order.id);
    return true;
  } catch (error: any) {
    console.error("❌ CRITICAL ERROR sending order confirmation email:");
    console.error("Error message:", error?.message);
    console.error("Error stack:", error?.stack);
    console.error("Full error:", error);
    // Don't throw error - order is already created, email is just a notification
    return false;
  }
};
