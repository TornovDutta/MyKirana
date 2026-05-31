import api from './api';

export const deliveryService = {
  getAvailable: (lat: number, lng: number) =>
    api.get('/delivery/available', { params: { lat, lng } }).then((r) => r.data),

  accept: (orderId: string) => api.post(`/delivery/${orderId}/accept`).then((r) => r.data),

  updateLocation: (orderId: string, coordinates: [number, number]) =>
    api.patch(`/delivery/${orderId}/location`, { coordinates }).then((r) => r.data),

  markDelivered: (orderId: string) =>
    api.post(`/delivery/${orderId}/delivered`).then((r) => r.data),

  getMyDeliveries: () => api.get('/delivery/my').then((r) => r.data),

  trackDelivery: (orderId: string) =>
    api.get(`/delivery/${orderId}/track`).then((r) => r.data),
};
