import api from './api';
import { SavedAddress } from '../types';

type AddressPayload = Omit<SavedAddress, 'id'>;

export const addressService = {
  list: async (): Promise<SavedAddress[]> => {
    const res = await api.get('/users/me/addresses');
    return res.data;
  },
  add: async (data: AddressPayload): Promise<SavedAddress> => {
    const res = await api.post('/users/me/addresses', data);
    return res.data;
  },
  update: async (id: string, data: AddressPayload): Promise<void> => {
    await api.patch(`/users/me/addresses/${id}`, data);
  },
  remove: async (id: string): Promise<void> => {
    await api.delete(`/users/me/addresses/${id}`);
  },
};
