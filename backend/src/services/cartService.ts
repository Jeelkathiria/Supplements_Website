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

    // First, check if an item with the same productId, flavor, and size exists
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: productId,
        flavor: flavor || null,
        size: size || null
      }
    });

    if (existingItem) {
      // If item exists with same attributes, increment quantity
      return await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: { increment: quantity }
        },
        include: { product: true }
      });
    } else {
      // If item doesn't exist, create a new one
      return await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
          flavor: flavor || null,
          size: size || null
        },
        include: { product: true }
      });
    }
  } catch (error) {
    console.error("Error adding to cart:", error);
    throw error;
  }
};

export const updateCartItem = async (
  userId: string,
  productId: string,
  quantity: number,
  flavor?: string,
  size?: string
) => {
  try {
    const cart = await getOrCreateCart(userId);

    // Find the item with matching productId, flavor, and size
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: productId,
        flavor: flavor || null,
        size: size || null
      }
    });

    if (!existingItem) {
      throw new Error('Cart item not found');
    }

    return await prisma.cartItem.update({
      where: { id: existingItem.id },
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
  productId: string,
  flavor?: string,
  size?: string
) => {
  try {
    const cart = await getOrCreateCart(userId);

    // Check if item exists before deleting
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: productId,
        flavor: flavor || null,
        size: size || null
      }
    });

    if (!existingItem) {
      // Item doesn't exist, return null - this is not an error
      return null;
    }

    return await prisma.cartItem.delete({
      where: {
        id: existingItem.id
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
      // Check if an item with the same productId, flavor, and size exists
      const existingItem = await prisma.cartItem.findFirst({
        where: {
          cartId: cart.id,
          productId: item.productId,
          flavor: item.flavor || null,
          size: item.size || null
        }
      });

      if (existingItem) {
        // If item exists with same attributes, increment quantity
        await prisma.cartItem.update({
          where: { id: existingItem.id },
          data: {
            quantity: { increment: item.quantity }
          }
        });
      } else {
        // If item doesn't exist, create a new one
        await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId: item.productId,
            quantity: item.quantity,
            flavor: item.flavor || null,
            size: item.size || null
          }
        });
      }
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
    let totalDiscount = 0;

    const itemsWithTotals = cart.items.map((item) => {
      const product = item.product;
      const basePrice = product.basePrice;
      const discountAmount = (basePrice * (product.discountPercent || 0)) / 100;
      const finalPrice = basePrice - discountAmount;

      const itemTotal = finalPrice * item.quantity;
      const itemDiscount = discountAmount * item.quantity;

      subtotal += itemTotal;
      totalDiscount += itemDiscount;

      return {
        ...item,
        unitPrice: finalPrice,
        totalPrice: itemTotal,
        discountAmount: itemDiscount
      };
    });

    return {
      ...cart,
      items: itemsWithTotals,
      totals: {
        subtotal,
        discount: totalDiscount,
        grandTotal: subtotal
      }
    };
  } catch (error) {
    console.error("Error getting cart with totals:", error);
    throw error;
  }
};
