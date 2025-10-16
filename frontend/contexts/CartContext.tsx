import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { Product } from '@/types/product';

export type CartItem = {
  productId: string;
  product: Product;
  qty: number;
  price: number;
};

export type CartContextType = {
  items: CartItem[];
  count: number; // total quantity
  total: number; // subtotal
  addItem: (product: Product, qty?: number) => void;
  updateQty: (productId: string, qty: number) => void;
  removeItem: (productId: string) => void;
  getQty: (productId: string) => number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback((product: Product, qty: number = 1) => {
    setItems(prev => {
      const idx = prev.findIndex(i => i.productId === product._id);
      if (idx >= 0) {
        const clone = [...prev];
        clone[idx] = { ...clone[idx], qty: clone[idx].qty + qty };
        return clone;
      }
      return [...prev, { productId: product._id, product, qty, price: product.price }];
    });
  }, []);

  const updateQty = useCallback((productId: string, qty: number) => {
    setItems(prev => {
      if (qty <= 0) {
        return prev.filter(i => i.productId !== productId);
      }
      return prev.map(i => (i.productId === productId ? { ...i, qty } : i));
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems(prev => prev.filter(i => i.productId !== productId));
  }, []);

  const getQty = useCallback((productId: string) => {
    const found = items.find(i => i.productId === productId);
    return found ? found.qty : 0;
  }, [items]);

  const count = useMemo(() => items.reduce((acc, i) => acc + i.qty, 0), [items]);
  const total = useMemo(() => items.reduce((acc, i) => acc + i.qty * i.price, 0), [items]);

  const value = useMemo(() => ({ items, count, total, addItem, updateQty, removeItem, getQty }), [items, count, total, addItem, updateQty, removeItem, getQty]);

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
