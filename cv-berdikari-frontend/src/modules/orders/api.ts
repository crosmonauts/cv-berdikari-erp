import axios from 'axios';
import type { Order } from './types';

const API_URL = import.meta.env.VITE_API_URL;

// Fungsi mengambil data PO
export const getOrders = async (): Promise<Order[]> => {
  const response = await axios.get(`${API_URL}/orders`);
  return response.data;
};

// Fungsi baru untuk menambah PO (Sekarang menerima FormData atau JSON bebas)
export const createOrder = async (data: any): Promise<Order> => {
  const response = await axios.post(`${API_URL}/orders`, data);
  return response.data;
};

// Fungsi untuk mengirim perubahan data PO ke backend (Bug path /orders sudah diperbaiki!)
export const updateOrder = async (id: string, data: any) => {
  const response = await axios.patch(`${API_URL}/orders/${id}`, data);
  return response.data;
};
