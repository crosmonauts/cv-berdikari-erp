import axios from 'axios';
import type { DashboardStats } from './types';

const BASE_URL = import.meta.env.VITE_API_URL;
const API_URL = `${BASE_URL}/dashboard`;

// Sekarang API menjamin bahwa data yang dikembalikan berformat DashboardStats
export const getDashboardStats = async (): Promise<DashboardStats> => {
  const response = await axios.get(`${API_URL}/stats`);
  return response.data;
};
