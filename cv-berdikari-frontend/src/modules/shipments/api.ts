import axios from 'axios';
import type { Shipment } from './types';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const API_URL = `${BASE_URL}/shipments`;

// Mengambil daftar pengiriman dan memastikan hasilnya berupa array of Shipment
export const getShipments = async (): Promise<Shipment[]> => {
  const response = await axios.get(API_URL);
  return response.data;
};

// Mengirim FormData dan memastikan balasan dari server sesuai dengan tipe Shipment
export const createShipment = async (data: FormData): Promise<Shipment> => {
  const response = await axios.post(API_URL, data);
  return response.data;
};
