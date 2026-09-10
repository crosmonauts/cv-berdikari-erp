import api from '@/lib/api';

export const getNsfpPool = () => api.get('/nsfp-pool');

export const createNsfpPool = (data: { startNum: string; endNum: string; year: number; prefix?: string }) =>
  api.post('/nsfp-pool', data);
