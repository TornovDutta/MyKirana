import api from './api';
import { UserRole } from '../types';

export const authService = {
  sendOtp: (phone: string) =>
    api.post('/auth/send-otp', { phone }).then((r) => r.data),

  verifyOtp: (data: { phone: string; otp: string; name?: string; role?: UserRole }) =>
    api.post('/auth/verify-otp', data).then((r) => r.data),

  getProfile: () => api.get('/users/me').then((r) => r.data),

  updateProfile: (data: { name?: string; phone?: string; profile_image?: string }) =>
    api.patch('/users/me', data).then((r) => r.data),
};
