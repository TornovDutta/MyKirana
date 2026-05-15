import api from './api';

export const shopService = {
  getNearby: (lat: number, lng: number, radiusKm = 10, category?: string) =>
    api
      .get('/shops/nearby', { params: { lat, lng, radius_km: radiusKm, category } })
      .then((r) => r.data),

  getById: (shopId: string) => api.get(`/shops/${shopId}`).then((r) => r.data),

  getMyShop: () => api.get('/shops/my').then((r) => r.data),

  createShop: (data: object) => api.post('/shops/', data).then((r) => r.data),

  updateShop: (data: object) => api.patch('/shops/my', data).then((r) => r.data),
};
