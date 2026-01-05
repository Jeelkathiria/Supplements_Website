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
  quantity: number
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
        quantity: { increment: quantity }
      },
      create: {
        cartId: cart.id,
        productId,
        quantity
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
