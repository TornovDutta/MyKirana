import api from './api';
import { DeliveryAddress } from '../types';

export const orderService = {
  preview: (items: Array<{ product_id: string; quantity: number }>, deliveryAddress: DeliveryAddress) =>
    api.post('/orders/preview', { items, delivery_address: deliveryAddress }).then((r) => r.data),

  place: (items: Array<{ product_id: string; quantity: number }>, deliveryAddress: DeliveryAddress, notes?: string, paymentMethod: string = 'online') =>
    api.post('/orders/', { items, delivery_address: deliveryAddress, notes, payment_method: paymentMethod }).then((r) => r.data),

  getMyOrders: (status?: string) =>
    api.get('/orders/my', { params: { status } }).then((r) => r.data),

  getById: (orderId: string) => api.get(`/orders/${orderId}`).then((r) => r.data),

  updateStatus: (orderId: string, status: string) =>
    api.patch(`/orders/${orderId}/status`, { status }).then((r) => r.data),

  cancel: (orderId: string) => api.patch(`/orders/${orderId}/cancel`).then((r) => r.data),

  shopConfirm: (orderId: string, status: 'confirmed' | 'ready') =>
    api.patch(`/orders/${orderId}/shop-confirm`, { status }).then((r) => r.data),

  verifyPayment: (orderId: string, paymentData: { razorpay_order_id: string, razorpay_payment_id: string, razorpay_signature: string }) =>
    api.post(`/orders/${orderId}/verify-payment`, paymentData).then((r) => r.data),
};
