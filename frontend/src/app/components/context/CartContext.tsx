import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { CartItem, Product } from '../../types';
import { getCartItemPrice } from '../../utils/pricingUtils';
import * as cartService from "../../../services/cartService";
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

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

// Guest cart storage key (for non-authenticated users)
const GUEST_CART_STORAGE_KEY = 'supplements_cart_guest';

// Generate user-specific cart storage key based on email or UID
const getUserCartStorageKey = (emailOrUid: string): string => {
  return `supplements_cart_${emailOrUid.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
};

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, firebaseUser } = useAuth();
  const [hasAttemptedMerge, setHasAttemptedMerge] = useState(false);

  // Load cart on mount or when user changes
  useEffect(() => {
    try {
      if (isAuthenticated && firebaseUser?.email) {
        // User is logged in - load their specific cart
        const userCartKey = getUserCartStorageKey(firebaseUser.email);
        const savedUserCart = localStorage.getItem(userCartKey);
        
        if (savedUserCart) {
          setCartItems(JSON.parse(savedUserCart));
        } else {
        }
      } else if (!isAuthenticated) {
        // User is NOT logged in (guest) - load guest cart
        const savedGuestCart = localStorage.getItem(GUEST_CART_STORAGE_KEY);
        if (savedGuestCart) {
          setCartItems(JSON.parse(savedGuestCart));
        } else {
          setCartItems([]);
        }
      }
    } catch (error) {
      console.error('Failed to load cart from localStorage:', error);
    }
  }, [isAuthenticated, firebaseUser?.email, firebaseUser?.uid]);

  // Save cart to localStorage whenever it changes (to appropriate key based on user)
  useEffect(() => {
    try {
      if (isAuthenticated && firebaseUser?.email) {
        // Save to user-specific cart key
        const userCartKey = getUserCartStorageKey(firebaseUser.email);
        localStorage.setItem(userCartKey, JSON.stringify(cartItems));
      } else {
        // Save to guest cart key
        localStorage.setItem(GUEST_CART_STORAGE_KEY, JSON.stringify(cartItems));
      }
    } catch (error) {
      console.error('Failed to save cart to localStorage:', error);
    }
  }, [cartItems, isAuthenticated, firebaseUser?.email]);

  // Merge guest cart and sync when user logs in
  useEffect(() => {
    if (isAuthenticated && firebaseUser && !hasAttemptedMerge) {
      handleLoginMerge();
      setHasAttemptedMerge(true);
    } else if (!isAuthenticated) {
      // Reset merge flag when user logs out
      setHasAttemptedMerge(false);
      // Cart will be reloaded by the other useEffect that watches isAuthenticated
    }
  }, [isAuthenticated, firebaseUser?.uid]);

  const handleLoginMerge = async () => {
    try {
      // Get guest cart from localStorage
      const guestCartData = localStorage.getItem(GUEST_CART_STORAGE_KEY);
      let guestCartItems: CartItem[] = [];
      
      if (guestCartData) {
        try {
          guestCartItems = JSON.parse(guestCartData);
        } catch (e) {
          console.error('Failed to parse guest cart:', e);
        }
      }

      // If there are guest cart items, merge them
      if (guestCartItems.length > 0) {
        const itemsToMerge = guestCartItems
          .filter(item => item.product && item.product.id && item.quantity > 0)
          .map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
            flavor: item.selectedColor || undefined,
            size: item.selectedSize || undefined,
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
              
              // Clear guest cart from localStorage after successful merge
              localStorage.removeItem(GUEST_CART_STORAGE_KEY);
              
              // Save merged cart to user-specific key
              if (firebaseUser?.email) {
                const userCartKey = getUserCartStorageKey(firebaseUser.email);
                localStorage.setItem(userCartKey, JSON.stringify(items));
              }
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
      
      // Convert local cart to API format - validate all required fields
      const guestCartItems = cartItems
        .filter(item => item.product && item.product.id && item.quantity > 0)
        .map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          flavor: item.selectedColor || undefined,
          size: item.selectedSize || undefined,
        }));

      // Send to backend to merge
      if (guestCartItems.length > 0) {
        const mergedCart = await cartService.mergeGuestCart(guestCartItems);
        
        // Update local state with merged cart
        if (mergedCart && mergedCart.items) {
          const items: CartItem[] = mergedCart.items.map((item: any) => ({
            product: item.product,
            quantity: item.quantity,
            selectedSize: item.size || undefined,
            selectedColor: item.flavor || undefined,
          }));
          setCartItems(items);
          
          // Clear guest cart from localStorage after successful merge
          localStorage.removeItem(GUEST_CART_STORAGE_KEY);
          
          // Save merged cart to user-specific key if authenticated
          if (isAuthenticated && firebaseUser?.email) {
            const userCartKey = getUserCartStorageKey(firebaseUser.email);
            localStorage.setItem(userCartKey, JSON.stringify(items));
          }
          
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
    selectedWeight?: string
  ) => {
    try {
      setError(null);
      
      if (isAuthenticated) {
        // Add to backend with flavor and size
        await cartService.addToCart(product.id, quantity, selectedColor, selectedSize);
      }

      // Also add to local state
      setCartItems((prev) => {
        const existingItem = prev.find(
          (item) =>
            item.product.id === product.id &&
            item.selectedSize === selectedSize &&
            item.selectedColor === selectedColor &&
            item.selectedWeight === selectedWeight
        );

        if (existingItem) {
          return prev.map((item) =>
            item.product.id === product.id &&
            item.selectedSize === selectedSize &&
            item.selectedColor === selectedColor &&
            item.selectedWeight === selectedWeight
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        }

        return [...prev, { product, quantity, selectedSize, selectedColor, selectedWeight }];
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
        // Remove from backend with size and flavor to match exact variant
        await cartService.removeFromCart(productId, selectedColor, selectedSize);
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
        // Update in backend with flavor and size
        await cartService.updateCartItem(productId, quantity, selectedColor, selectedSize);
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