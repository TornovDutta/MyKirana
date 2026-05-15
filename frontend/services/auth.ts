import api from './api';
import { UserRole } from '../types';

export const authService = {
  register: (data: { name: string; email: string; phone: string; password: string; role: UserRole }) =>
    api.post('/auth/register', data).then((r) => r.data),

  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }).then((r) => r.data),

  getProfile: () => api.get('/users/me').then((r) => r.data),

  updateProfile: (data: { name?: string; phone?: string; profile_image?: string }) =>
    api.patch('/users/me', data).then((r) => r.data),
};
