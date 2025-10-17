import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { Product } from '@/types/product';

export type CartItem = {
  productId: string;
  product: Product;
  qty: number;
  price: number;
  size?: string;
};

export type CartContextType = {
  items: CartItem[];
  count: number; // total quantity
  total: number; // subtotal
  addItem: (product: Product, qty?: number, size?: string) => void;
  updateQty: (productId: string, qty: number, size?: string) => void;
  removeItem: (productId: string, size?: string) => void;
  getQty: (productId: string) => number;
  getSizeQty: (productId: string, size: string) => number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback((product: Product, qty: number = 1, size?: string) => {
    setItems(prev => {
      const idx = prev.findIndex(i => i.productId === product._id && i.size === size);
      if (idx >= 0) {
        const clone = [...prev];
        clone[idx] = { ...clone[idx], qty: clone[idx].qty + qty };
        return clone;
      }
      return [...prev, { productId: product._id, product, qty, price: product.price, size }];
    });
  }, []);

  const updateQty = useCallback((productId: string, qty: number, size?: string) => {
    setItems(prev => {
      if (qty <= 0) {
        return prev.filter(i => !(i.productId === productId && (size ? i.size === size : true)));
      }
      return prev.map(i => (i.productId === productId && (size ? i.size === size : true) ? { ...i, qty } : i));
    });
  }, []);

  const removeItem = useCallback((productId: string, size?: string) => {
    setItems(prev => prev.filter(i => !(i.productId === productId && (size ? i.size === size : true))));
  }, []);

  const getQty = useCallback((productId: string) => {
    return items.filter(i => i.productId === productId).reduce((acc, it) => acc + it.qty, 0);
  }, [items]);

  const getSizeQty = useCallback((productId: string, size: string) => {
    const found = items.find(i => i.productId === productId && i.size === size);
    return found ? found.qty : 0;
  }, [items]);

  const count = useMemo(() => items.reduce((acc, i) => acc + i.qty, 0), [items]);
  const total = useMemo(() => items.reduce((acc, i) => acc + i.qty * i.price, 0), [items]);

  const value = useMemo(() => ({ items, count, total, addItem, updateQty, removeItem, getQty, getSizeQty }), [items, count, total, addItem, updateQty, removeItem, getQty, getSizeQty]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextType {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return ctx;
}
