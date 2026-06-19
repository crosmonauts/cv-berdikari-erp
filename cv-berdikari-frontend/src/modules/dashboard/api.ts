import api from '@/lib/api';
import type { DashboardStats } from './types';

const API_URL = `/dashboard`;

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const response = await api.get(`${API_URL}/stats`);
  return response.data;
};
