import prisma from "../lib/prisma";

export const getOrCreateCart = async (userId: string) => {
  try {
    return await prisma.cart.upsert({
      where: { userId },
      update: {},
      create: { userId },
      include: {
        items: {
          include: { product: true }
        }
      }
    });
  } catch (error) {
    console.error("Error getting or creating cart:", error);
    throw error;
  }
};

export const addToCart = async (
  userId: string,
  productId: string,
  quantity: number,
  flavor?: string,
  size?: string
) => {
  try {
    const cart = await getOrCreateCart(userId);

    return await prisma.cartItem.upsert({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId
        }
      },
      update: {
        quantity: { increment: quantity },
        flavor: flavor || undefined,
        size: size || undefined
      },
      create: {
        cartId: cart.id,
        productId,
        quantity,
        flavor: flavor || null,
        size: size || null
      },
      include: { product: true }
    });
  } catch (error) {
    console.error("Error adding to cart:", error);
    throw error;
  }
};

export const updateCartItem = async (
  userId: string,
  productId: string,
  quantity: number
) => {
  try {
    const cart = await getOrCreateCart(userId);

    return await prisma.cartItem.update({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId
        }
      },
      data: { quantity },
      include: { product: true }
    });
  } catch (error) {
    console.error("Error updating cart item:", error);
    throw error;
  }
};

export const removeCartItem = async (
  userId: string,
  productId: string
) => {
  try {
    const cart = await getOrCreateCart(userId);

    // Check if item exists before deleting
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId
        }
      }
    });

    if (!existingItem) {
      // Item doesn't exist, return null - this is not an error
      return null;
    }

    return await prisma.cartItem.delete({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId
        }
      }
    });
  } catch (error) {
    console.error("Error removing cart item:", error);
    throw error;
  }
};

export const mergeGuestCart = async (
  userId: string,
  guestCartItems: Array<{
    productId: string;
    quantity: number;
    flavor?: string;
    size?: string;
  }>
) => {
  try {
    const cart = await getOrCreateCart(userId);

    for (const item of guestCartItems) {
      await prisma.cartItem.upsert({
        where: {
          cartId_productId: {
            cartId: cart.id,
            productId: item.productId
          }
        },
        update: {
          quantity: { increment: item.quantity },
          flavor: item.flavor || undefined,
          size: item.size || undefined
        },
        create: {
          cartId: cart.id,
          productId: item.productId,
          quantity: item.quantity,
          flavor: item.flavor || null,
          size: item.size || null
        }
      });
    }

    // Return updated cart
    return await getOrCreateCart(userId);
  } catch (error) {
    console.error("Error merging guest cart:", error);
    throw error;
  }
};

export const getCartWithTotals = async (userId: string) => {
  try {
    const cart = await getOrCreateCart(userId);

    // Calculate totals
    let subtotal = 0;
    let totalGst = 0;
    let totalDiscount = 0;

    const itemsWithTotals = cart.items.map((item) => {
      const product = item.product;
      const basePrice = product.basePrice;
      const discountAmount = (basePrice * (product.discountPercent || 0)) / 100;
      const priceAfterDiscount = basePrice - discountAmount;
      const gstAmount = (priceAfterDiscount * (product.gstPercent || 0)) / 100;
      const finalPrice = priceAfterDiscount + gstAmount;

      const itemTotal = finalPrice * item.quantity;
      const itemGst = gstAmount * item.quantity;
      const itemDiscount = discountAmount * item.quantity;

      subtotal += itemTotal;
      totalGst += itemGst;
      totalDiscount += itemDiscount;

      return {
        ...item,
        unitPrice: finalPrice,
        totalPrice: itemTotal,
        gstAmount: itemGst,
        discountAmount: itemDiscount
      };
    });

    return {
      ...cart,
      items: itemsWithTotals,
      totals: {
        subtotal,
        gst: totalGst,
        discount: totalDiscount,
        grandTotal: subtotal
      }
    };
  } catch (error) {
    console.error("Error getting cart with totals:", error);
    throw error;
  }
};
