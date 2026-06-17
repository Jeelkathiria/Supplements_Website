import { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import { CartItem, Product } from '../../types';
import { getCartItemPrice } from '../../utils/pricingUtils';
import * as cartService from "../../../services/cartService";
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import {
  getGuestCart,
  addToGuestCart,
  updateGuestCartItem,
  removeGuestCartItem,
  clearGuestCart
} from '../../utils/cartUtils';
import { fetchProducts } from '../../../services/productService';

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, quantity?: number, selectedSize?: string, selectedColor?: string, selectedWeight?: string) => Promise<void>;
  removeFromCart: (productId: string, selectedSize?: string, selectedColor?: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number, selectedSize?: string, selectedColor?: string) => Promise<void>;
  clearCart: () => Promise<void>;
  getCartTotal: () => number;
  isLoading: boolean;
  error: string | null;
  syncCart: () => Promise<void>;
  mergeGuestCart: () => Promise<void>;
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
  mergeGuestCart: async () => {},
};

const CartContext = createContext<CartContextType>(defaultCartContext);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, firebaseUser } = useAuth();
  const [hasAttemptedMerge, setHasAttemptedMerge] = useState(false);
  const [productsList, setProductsList] = useState<Product[]>([]);
  const debounceTimers = useRef<Record<string, NodeJS.Timeout>>({});

  // Load products list on mount
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const products = await fetchProducts();
        setProductsList(products);
      } catch (err) {
        console.error("Failed to load products in CartContext:", err);
      }
    };
    loadProducts();
  }, []);

  // Load, sync, and merge cart based on auth status
  useEffect(() => {
    const initializeCart = async () => {
      if (isAuthenticated && firebaseUser) {
        if (!hasAttemptedMerge) {
          await handleLoginMerge();
          setHasAttemptedMerge(true);
        } else {
          await syncCart();
        }
      } else if (!isAuthenticated) {
        setHasAttemptedMerge(false);
        // Logged out: Load guest cart from localStorage
        const guestItems = getGuestCart();
        
        // Resolve guest items with full product details
        let resolvedProducts = productsList;
        if (resolvedProducts.length === 0) {
          try {
            resolvedProducts = await fetchProducts();
            setProductsList(resolvedProducts);
          } catch (err) {
            console.error("Failed to load products for guest cart:", err);
          }
        }

        const resolvedItems: CartItem[] = [];
        for (const item of guestItems) {
          const product = resolvedProducts.find((p) => p.id === item.productId);
          if (product) {
            resolvedItems.push({
              product,
              quantity: item.quantity,
              selectedSize: item.size,
              selectedColor: item.flavor,
            });
          }
        }

        setCartItems(resolvedItems);
      }
    };

    initializeCart();
  }, [isAuthenticated, firebaseUser?.uid, productsList.length]);

  const syncLocalWithState = (items: CartItem[]) => {
    const minimalItems = items.map(item => ({
      productId: item.product.id,
      quantity: item.quantity,
      flavor: item.selectedColor,
      size: item.selectedSize
    }));
    if (minimalItems.length > 0) {
      localStorage.setItem('cart', JSON.stringify(minimalItems));
    } else {
      localStorage.removeItem('cart');
    }

    if (isAuthenticated && firebaseUser) {
      localStorage.setItem('cart_user_id', firebaseUser.uid);
    } else {
      localStorage.removeItem('cart_user_id');
    }
  };

  const handleLoginMerge = async () => {
    try {
      const currentCartUserId = localStorage.getItem('cart_user_id');
      const isAlreadySyncedForUser = currentCartUserId === firebaseUser?.uid;

      if (isAlreadySyncedForUser) {
        console.log("Cart is already synchronized for this user. Skipping merge, just syncing.");
        await syncCart();
        return;
      }

      // Get guest cart from localStorage
      const guestCartItems = getGuestCart();

      // If there are guest cart items, merge them
      if (guestCartItems.length > 0) {
        const itemsToMerge = guestCartItems
          .filter(item => item.productId && item.quantity > 0)
          .map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            flavor: item.flavor,
            size: item.size,
          }));

        // Only merge if we have valid items
        if (itemsToMerge.length > 0) {
          try {
            const mergedCart = await cartService.mergeGuestCart(itemsToMerge);
            if (mergedCart && mergedCart.items) {
              const items: CartItem[] = mergedCart.items.map((item: any) => ({
                product: item.product,
                quantity: item.quantity,
                selectedSize: item.size || undefined,
                selectedColor: item.flavor || undefined,
              }));
              setCartItems(items);
              syncLocalWithState(items);
            }
            return;
          } catch (mergeErr) {
            console.error('Error during guest cart merge:', mergeErr);
            // If merge fails, fall back to just syncing
          }
        }
      }
      
      // Sync the backend cart (for authenticated users or if merge fails)
      await syncCart();
    } catch (err) {
      console.error('Error during login merge:', err);
      // Still try to sync even if merge fails
      try {
        await syncCart();
      } catch (syncErr) {
        console.error('Error syncing cart:', syncErr);
      }
    }
  };

  const syncCart = async () => {
    try {
      setIsLoading(true);
      const backendCart = await cartService.getCart();
      if (backendCart && backendCart.items) {
        // Convert backend cart to frontend format
        const items: CartItem[] = backendCart.items.map((item: any) => ({
          product: item.product,
          quantity: item.quantity,
          selectedSize: item.size || undefined,
          selectedColor: item.flavor || undefined,
        }));
        setCartItems(items);
        syncLocalWithState(items);
        setError(null);
      }
    } catch (err) {
      console.error('Failed to sync cart:', err);
      setError('Failed to sync cart from server');
    } finally {
      setIsLoading(false);
    }
  };

  const mergeGuestCart = async () => {
    try {
      setIsLoading(true);
      
      // Convert local cart to API format
      const guestItems = getGuestCart();
      const itemsToMerge = guestItems
        .filter(item => item.productId && item.quantity > 0);

      // Send to backend to merge
      if (itemsToMerge.length > 0) {
        const mergedCart = await cartService.mergeGuestCart(itemsToMerge);
        
        // Update local state with merged cart
        if (mergedCart && mergedCart.items) {
          const items: CartItem[] = mergedCart.items.map((item: any) => ({
            product: item.product,
            quantity: item.quantity,
            selectedSize: item.size || undefined,
            selectedColor: item.flavor || undefined,
          }));
          setCartItems(items);
          syncLocalWithState(items);
          
          toast.success('Cart merged successfully!');
        }
      } else {
        // No guest items, just sync backend cart
        await syncCart();
      }
      setError(null);
    } catch (err) {
      console.error('Failed to merge cart:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to merge cart';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const addToCart = async (
    product: Product,
    quantity = 1,
    selectedSize?: string,
    selectedColor?: string,
    _selectedWeight?: string
  ) => {
    try {
      setError(null);
      
      // 1. Optimistic local state update
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

      // 2. Always update local storage
      addToGuestCart(product.id, quantity, selectedColor, selectedSize);

      if (isAuthenticated) {
        // 3. Authenticated backend call
        await cartService.addToCart(product.id, quantity, selectedColor, selectedSize);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add item to cart';
      setError(errorMessage);
      if (isAuthenticated) {
        // Rollback / sync in case of backend error
        await syncCart();
      }
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

      // 1. Optimistic local state update
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

      // 2. Always update local storage
      removeGuestCartItem(productId, selectedColor, selectedSize);

      if (isAuthenticated) {
        // 3. Authenticated backend call
        await cartService.removeFromCart(productId, selectedColor, selectedSize);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove item from cart';
      setError(errorMessage);
      if (isAuthenticated) {
        await syncCart();
      }
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

      // 1. Optimistic local state update
      setCartItems((prev) =>
        prev.map((item) =>
          item.product.id === productId &&
          item.selectedSize === selectedSize &&
          item.selectedColor === selectedColor
            ? { ...item, quantity }
            : item
        )
      );

      // 2. Always update local storage
      updateGuestCartItem(productId, quantity, selectedColor, selectedSize);

      if (isAuthenticated) {
        // 3. Authenticated debounced backend update
        const variantKey = `${productId}_${selectedSize || ''}_${selectedColor || ''}`;
        
        if (debounceTimers.current[variantKey]) {
          clearTimeout(debounceTimers.current[variantKey]);
        }

        debounceTimers.current[variantKey] = setTimeout(async () => {
          try {
            await cartService.updateCartItem(productId, quantity, selectedColor, selectedSize);
            delete debounceTimers.current[variantKey];
          } catch (err) {
            console.error("Failed to sync quantity update to backend:", err);
            setError("Failed to sync quantity with database");
            await syncCart();
          }
        }, 500);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update cart';
      setError(errorMessage);
      throw err;
    }
  };

  const clearCart = async () => {
    try {
      setError(null);
      
      // 1. Clear local state
      setCartItems([]);

      // 2. Always clear local storage guest cart key "cart"
      clearGuestCart();

      if (isAuthenticated) {
        // 3. Clear authenticated cart
        await cartService.clearCart();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clear cart';
      setError(errorMessage);
      if (isAuthenticated) {
        await syncCart();
      }
      throw err;
    }
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => {
      const price = getCartItemPrice(item.product, item.selectedSize, item.selectedColor);
      return total + price * item.quantity;
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
        mergeGuestCart,
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