import { create } from 'zustand';
import { Order } from '../types';

interface OrderState {
  orders: Order[];
  activeOrder: Order | null;
  setOrders: (orders: Order[]) => void;
  setActiveOrder: (order: Order | null) => void;
  updateOrderStatus: (orderId: string, status: Order['status']) => void;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],
  activeOrder: null,

  setOrders: (orders) => set({ orders }),

  setActiveOrder: (order) => set({ activeOrder: order }),

  updateOrderStatus: (orderId, status) => {
    set({
      orders: get().orders.map((o) => (o.id === orderId ? { ...o, status } : o)),
      activeOrder: get().activeOrder?.id === orderId ? { ...get().activeOrder!, status } : get().activeOrder,
    });
  },
}));
