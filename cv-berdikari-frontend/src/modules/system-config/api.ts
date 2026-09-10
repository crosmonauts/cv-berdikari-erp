import api from '@/lib/api';

export const getPpnRate = () => api.get('/system-config/ppn');

export const setPpnRate = (rate: number) => api.put('/system-config/ppn', { rate });
