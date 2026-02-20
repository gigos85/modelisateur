import { apiClient } from './api';
import { CUJ } from '../types/cuj';

export const cujService = {
  async list(): Promise<CUJ[]> {
    const { data } = await apiClient.get<CUJ[]>('/cuj');
    return data;
  },
  async create(payload: Omit<CUJ, 'id'>): Promise<CUJ> {
    const { data } = await apiClient.post<CUJ>('/cuj', payload);
    return data;
  },
  async update(id: string, payload: Omit<CUJ, 'id'>): Promise<CUJ> {
    const { data } = await apiClient.put<CUJ>(`/cuj/${id}`, payload);
    return data;
  },
  async remove(id: string): Promise<void> {
    await apiClient.delete(`/cuj/${id}`);
  }
};
