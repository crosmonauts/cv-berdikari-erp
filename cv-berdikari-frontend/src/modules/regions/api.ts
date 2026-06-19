import api from '@/lib/api';
import type { Region } from './types';

export const getRegions = async (): Promise<Region[]> => {
  const response = await api.get('/regions');
  return response.data.data;
};

export const getRegion = async (id: string): Promise<Region> => {
  const response = await api.get(`/regions/${id}`);
  return response.data;
};

export const createRegion = async (data: Partial<Region>): Promise<Region> => {
  const response = await api.post('/regions', data);
  return response.data;
};

export const updateRegion = async (id: string, data: Partial<Region>): Promise<Region> => {
  const response = await api.patch(`/regions/${id}`, data);
  return response.data;
};

export const deleteRegion = async (id: string): Promise<void> => {
  await api.delete(`/regions/${id}`);
};
