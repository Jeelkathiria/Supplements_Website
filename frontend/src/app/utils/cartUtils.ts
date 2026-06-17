export interface GuestCartItem {
  productId: string;
  quantity: number;
  flavor?: string;
  size?: string;
}

const STORAGE_KEY = 'cart';

/**
 * Retrieves the guest cart from localStorage.
 */
export const getGuestCart = (): GuestCartItem[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error reading guest cart from localStorage:', error);
    return [];
  }
};

/**
 * Saves the guest cart to localStorage.
 */
export const saveGuestCart = (cart: GuestCartItem[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  } catch (error) {
    console.error('Error writing guest cart to localStorage:', error);
  }
};

/**
 * Adds an item to the guest cart.
 */
export const addToGuestCart = (productId: string, quantity: number, flavor?: string, size?: string): void => {
  const cart = getGuestCart();
  const existingIndex = cart.findIndex(
    item => item.productId === productId && item.flavor === flavor && item.size === size
  );
  if (existingIndex > -1) {
    cart[existingIndex].quantity += quantity;
  } else {
    cart.push({ productId, quantity, flavor, size });
  }
  saveGuestCart(cart);
};

/**
 * Updates the quantity of an item in the guest cart.
 */
export const updateGuestCartItem = (productId: string, quantity: number, flavor?: string, size?: string): void => {
  let cart = getGuestCart();
  if (quantity <= 0) {
    removeGuestCartItem(productId, flavor, size);
    return;
  }
  const existingIndex = cart.findIndex(
    item => item.productId === productId && item.flavor === flavor && item.size === size
  );
  if (existingIndex > -1) {
    cart[existingIndex].quantity = quantity;
  }
  saveGuestCart(cart);
};

/**
 * Removes an item from the guest cart.
 */
export const removeGuestCartItem = (productId: string, flavor?: string, size?: string): void => {
  let cart = getGuestCart();
  cart = cart.filter(
    item => !(item.productId === productId && item.flavor === flavor && item.size === size)
  );
  saveGuestCart(cart);
};

/**
 * Clears the entire guest cart from localStorage.
 */
export const clearGuestCart = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing guest cart:', error);
  }
};
