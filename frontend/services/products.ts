import api from './api';

export const productService = {
  getByShop: (shopId: string, category?: string, search?: string) =>
    api
      .get(`/products/shop/${shopId}`, { params: { category, search } })
      .then((r) => r.data),

  getMyProducts: () => api.get('/products/my').then((r) => r.data),

  addProduct: (data: object) => api.post('/products/', data).then((r) => r.data),

  updateProduct: (productId: string, data: object) =>
    api.patch(`/products/${productId}`, data).then((r) => r.data),

  deleteProduct: (productId: string) =>
    api.delete(`/products/${productId}`).then((r) => r.data),
};
