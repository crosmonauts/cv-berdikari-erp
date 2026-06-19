import api from '@/lib/api';
import type { Shipment } from './types';

const API_URL = `/shipments`;

export const getShipments = async (): Promise<Shipment[]> => {
  const response = await api.get(API_URL);
  return response.data.data;
};

export const createShipment = async (data: FormData): Promise<Shipment> => {
  const response = await api.post(API_URL, data);
  return response.data;
};
