import { create } from 'zustand';
import { CartItem, Product } from '../types';

interface CartState {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
  getItemQuantity: (productId: string) => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],

  addItem: (product, quantity = 1) => {
    const existing = get().items.find((i) => i.product.id === product.id);
    if (existing) {
      set({ items: get().items.map((i) => (i.product.id === product.id ? { ...i, quantity: i.quantity + quantity } : i)) });
    } else {
      set({ items: [...get().items, { product, quantity }] });
    }
  },

  removeItem: (productId) => set({ items: get().items.filter((i) => i.product.id !== productId) }),

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId);
    } else {
      set({ items: get().items.map((i) => (i.product.id === productId ? { ...i, quantity } : i)) });
    }
  },

  clearCart: () => set({ items: [] }),

  getTotal: () => get().items.reduce((sum, i) => sum + i.product.price * i.quantity, 0),

  getItemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

  getItemQuantity: (productId) => get().items.find((i) => i.product.id === productId)?.quantity ?? 0,
}));
