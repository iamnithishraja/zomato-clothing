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
  clearCart: () => void;
  getQty: (productId: string) => number;
  getSizeQty: (productId: string, size: string) => number;
  isInCart: (productId: string) => boolean; // Check if product (any variant) is in cart
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback((product: Product, qty: number = 1, size?: string) => {
    setItems(prev => {
      // For matching, compare sizes carefully (undefined/null should match each other)
      const idx = prev.findIndex(i => {
        const sameProduct = i.productId === product._id;
        const sameSize = (!i.size && !size) || (i.size === size);
        return sameProduct && sameSize;
      });
      
      if (idx >= 0) {
        const clone = [...prev];
        clone[idx] = { ...clone[idx], qty: clone[idx].qty + qty };
        return clone;
      }
      
      // Only add size property if it's defined
      const newItem: CartItem = {
        productId: product._id,
        product,
        qty,
        price: product.price
      };
      
      if (size) {
        newItem.size = size;
      }
      
      return [...prev, newItem];
    });
  }, []);

  const updateQty = useCallback((productId: string, qty: number, size?: string) => {
    setItems(prev => {
      if (qty <= 0) {
        // Remove item(s)
        return prev.filter(i => {
          const sameProduct = i.productId === productId;
          const sameSize = (!i.size && !size) || (i.size === size);
          return !(sameProduct && sameSize);
        });
      }
      
      // Update quantity
      return prev.map(i => {
        const sameProduct = i.productId === productId;
        const sameSize = (!i.size && !size) || (i.size === size);
        
        if (sameProduct && sameSize) {
          return { ...i, qty };
        }
        return i;
      });
    });
  }, []);

  const removeItem = useCallback((productId: string, size?: string) => {
    setItems(prev => prev.filter(i => {
      const sameProduct = i.productId === productId;
      const sameSize = (!i.size && !size) || (i.size === size);
      return !(sameProduct && sameSize);
    }));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const getQty = useCallback((productId: string) => {
    // Only return quantity for items WITHOUT sizes (for product card display)
    return items.filter(i => i.productId === productId && !i.size).reduce((acc, it) => acc + it.qty, 0);
  }, [items]);

  const getSizeQty = useCallback((productId: string, size: string) => {
    const found = items.find(i => i.productId === productId && i.size === size);
    return found ? found.qty : 0;
  }, [items]);

  const isInCart = useCallback((productId: string) => {
    // Check if ANY variant (with or without size) of this product is in cart
    return items.some(i => i.productId === productId);
  }, [items]);

  const count = useMemo(() => items.reduce((acc, i) => acc + i.qty, 0), [items]);
  const total = useMemo(() => items.reduce((acc, i) => acc + i.qty * i.price, 0), [items]);

  const value = useMemo(() => ({ items, count, total, addItem, updateQty, removeItem, clearCart, getQty, getSizeQty, isInCart }), [items, count, total, addItem, updateQty, removeItem, clearCart, getQty, getSizeQty, isInCart]);

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
