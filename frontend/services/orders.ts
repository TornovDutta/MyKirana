import api from './api';
import { DeliveryAddress } from '../types';

export const orderService = {
  preview: (items: Array<{ product_id: string; quantity: number }>, deliveryAddress: DeliveryAddress) =>
    api.post('/orders/preview', { items, delivery_address: deliveryAddress }).then((r) => r.data),

  place: (items: Array<{ product_id: string; quantity: number }>, deliveryAddress: DeliveryAddress, notes?: string) =>
    api.post('/orders/', { items, delivery_address: deliveryAddress, notes }).then((r) => r.data),

  getMyOrders: (status?: string) =>
    api.get('/orders/my', { params: { status } }).then((r) => r.data),

  getById: (orderId: string) => api.get(`/orders/${orderId}`).then((r) => r.data),

  updateStatus: (orderId: string, status: string) =>
    api.patch(`/orders/${orderId}/status`, { status }).then((r) => r.data),

  cancel: (orderId: string) => api.patch(`/orders/${orderId}/cancel`).then((r) => r.data),
};
