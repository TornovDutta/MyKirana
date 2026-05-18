import api from './api';
import { API_BASE_URL } from '../constants/config';

export const uploadService = {
  uploadImage: async (uri: string): Promise<string> => {
    const filename = uri.split('/').pop() ?? 'image.jpg';
    const ext = filename.split('.').pop()?.toLowerCase() ?? 'jpg';
    const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

    const formData = new FormData();
    formData.append('file', { uri, name: filename, type: mimeType } as any);

    const response = await api.post('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return `${API_BASE_URL}${response.data.url}`;
  },
};
