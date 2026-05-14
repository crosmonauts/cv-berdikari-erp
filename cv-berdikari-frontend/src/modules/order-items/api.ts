import axios from 'axios';
import type { OrderItem } from './types'; // <-- Import tipe datanya

const BASE_URL = import.meta.env.VITE_API_URL;
const API_URL = `${BASE_URL}/order-items`;

// Mengambil daftar barang dari 1 PO tertentu
export const getOrderItems = async (orderId: string): Promise<OrderItem[]> => {
  const response = await axios.get(`${API_URL}/order/${orderId}`);
  return response.data;
};

// Menambahkan barang ke dalam PO
export const createOrderItem = async (data: {
  orderId: string;
  productId: string;
  quantity: number;
}): Promise<OrderItem> => {
  const response = await axios.post(API_URL, data);
  return response.data;
};

export const deleteOrderItem = async (id: string) => {
  const response = await axios.delete(`${API_URL}/${id}`);
  return response.data;
};

// FITUR BARU: Mengirim tembakan barcode & jumlah (QTY) ke backend
export const scanOrderItemBarcode = async (
  orderId: string,
  barcode: string,
  qty: number,
) => {
  const response = await axios.post(`${API_URL}/scan`, {
    orderId,
    barcode,
    qty,
  });
  return response.data;
};
