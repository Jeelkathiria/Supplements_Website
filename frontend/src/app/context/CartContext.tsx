import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { CartItem, Product } from '../types';
import * as cartService from '../../services/cartService';
import { useAuth } from './AuthContext';

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, quantity?: number, selectedSize?: string, selectedColor?: string) => Promise<void>;
  removeFromCart: (productId: string, selectedSize?: string, selectedColor?: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number, selectedSize?: string, selectedColor?: string) => Promise<void>;
  clearCart: () => Promise<void>;
  getCartTotal: () => number;
  isLoading: boolean;
  error: string | null;
  syncCart: () => Promise<void>;
}

const defaultCartContext: CartContextType = {
  cartItems: [],
  addToCart: async () => {},
  removeFromCart: async () => {},
  updateQuantity: async () => {},
  clearCart: async () => {},
  getCartTotal: () => 0,
  isLoading: false,
  error: null,
  syncCart: async () => {},
};

const CartContext = createContext<CartContextType>(defaultCartContext);

const CART_STORAGE_KEY = 'supplements_cart';

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, firebaseUser } = useAuth();

  // Sync cart from backend when user logs in
  useEffect(() => {
    if (isAuthenticated && firebaseUser) {
      syncCart();
    }
  }, [isAuthenticated, firebaseUser?.uid]);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) {
        setCartItems(JSON.parse(savedCart));
      }
    } catch (error) {
      console.error('Failed to load cart from localStorage:', error);
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch (error) {
      console.error('Failed to save cart to localStorage:', error);
    }
  }, [cartItems]);

  const syncCart = async () => {
    try {
      setIsLoading(true);
      const backendCart = await cartService.getCart();
      if (backendCart && backendCart.items) {
        // Convert backend cart to frontend format
        const items: CartItem[] = backendCart.items.map((item) => ({
          product: item.product,
          quantity: item.quantity,
          selectedSize: undefined, // Backend doesn't track these yet
          selectedColor: undefined,
        }));
        setCartItems(items);
        setError(null);
      }
    } catch (err) {
      console.error('Failed to sync cart:', err);
      setError('Failed to sync cart from server');
    } finally {
      setIsLoading(false);
    }
  };

  const addToCart = async (
    product: Product,
    quantity = 1,
    selectedSize?: string,
    selectedColor?: string
  ) => {
    try {
      setError(null);
      
      if (isAuthenticated) {
        // Add to backend
        await cartService.addToCart(product.id, quantity);
      }

      // Also add to local state
      setCartItems((prev) => {
        const existingItem = prev.find(
          (item) =>
            item.product.id === product.id &&
            item.selectedSize === selectedSize &&
            item.selectedColor === selectedColor
        );

        if (existingItem) {
          return prev.map((item) =>
            item.product.id === product.id &&
            item.selectedSize === selectedSize &&
            item.selectedColor === selectedColor
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        }

        return [...prev, { product, quantity, selectedSize, selectedColor }];
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add item to cart';
      setError(errorMessage);
      throw err;
    }
  };

  const removeFromCart = async (
    productId: string,
    selectedSize?: string,
    selectedColor?: string
  ) => {
    try {
      setError(null);

      if (isAuthenticated) {
        // Remove from backend
        await cartService.removeFromCart(productId);
      }

      // Remove from local state
      setCartItems((prev) =>
        prev.filter(
          (item) =>
            !(
              item.product.id === productId &&
              item.selectedSize === selectedSize &&
              item.selectedColor === selectedColor
            )
        )
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove item from cart';
      setError(errorMessage);
      throw err;
    }
  };

  const updateQuantity = async (
    productId: string,
    quantity: number,
    selectedSize?: string,
    selectedColor?: string
  ) => {
    try {
      setError(null);

      if (quantity <= 0) {
        await removeFromCart(productId, selectedSize, selectedColor);
        return;
      }

      if (isAuthenticated) {
        // Update in backend
        await cartService.updateCartItem(productId, quantity);
      }

      // Update local state
      setCartItems((prev) =>
        prev.map((item) =>
          item.product.id === productId &&
          item.selectedSize === selectedSize &&
          item.selectedColor === selectedColor
            ? { ...item, quantity }
            : item
        )
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update cart';
      setError(errorMessage);
      throw err;
    }
  };

  const clearCart = async () => {
    try {
      setError(null);
      // Clear backend cart by removing all items
      if (isAuthenticated) {
        for (const item of cartItems) {
          await cartService.removeFromCart(item.product.id);
        }
      }
      setCartItems([]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clear cart';
      setError(errorMessage);
      throw err;
    }
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => {
      const basePrice = item.product.basePrice;
      const discountPercent = item.product.discountPercent || 0;
      const gstPercent = item.product.gstPercent || 0;

      const discountedPrice = basePrice - (basePrice * discountPercent) / 100;
      const finalPrice = discountedPrice + (discountedPrice * gstPercent) / 100;

      return total + finalPrice * item.quantity;
    }, 0);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        isLoading,
        error,
        syncCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  return context;
};