import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Cart } from '../types';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

interface CartContextType {
  cart: Cart | null;
  itemCount: number;
  total: number;
  addToCart: (productId: number, quantity?: number) => Promise<void>;
  updateQuantity: (productId: number, quantity: number) => Promise<void>;
  removeItem: (productId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

/**
 * Manages buyer shopping cart state, item counts, and totals.
 */
export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isBuyer = user?.role === 'BUYER';
  const buyerId = isBuyer ? user.id : null;

  const refreshCart = useCallback(async () => {
    if (!buyerId) {
      setCart(null);
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.getCart(buyerId);
      setCart(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load cart';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [buyerId]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addToCart = async (productId: number, quantity: number = 1) => {
    if (!buyerId) {
      throw new Error('Please log in as a Buyer to add items to your cart.');
    }
    setIsLoading(true);
    setError(null);
    try {
      const updated = await api.addToCart(buyerId, productId, quantity);
      setCart(updated);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not add item to cart';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = async (productId: number, quantity: number) => {
    if (!buyerId) return;
    setIsLoading(true);
    setError(null);
    try {
      const updated = await api.updateCartItem(buyerId, productId, quantity);
      setCart(updated);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not update quantity';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const removeItem = async (productId: number) => {
    if (!buyerId) return;
    setIsLoading(true);
    setError(null);
    try {
      const updated = await api.removeFromCart(buyerId, productId);
      setCart(updated);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not remove item';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const clearCart = async () => {
    if (!buyerId) return;
    setIsLoading(true);
    setError(null);
    try {
      await api.clearCart(buyerId);
      setCart(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not clear cart';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        itemCount: cart?.totalItemCount || 0,
        total: cart?.total || 0,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        refreshCart,
        isLoading,
        error,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

/**
 * Custom hook to access shopping cart context.
 */
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
