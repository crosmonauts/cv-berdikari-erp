import api from '@/lib/api';
import type { OrderItem } from './types';

const API_URL = `/order-items`;

export const getOrderItems = async (orderId: string): Promise<OrderItem[]> => {
  const response = await api.get(`${API_URL}/order/${orderId}`);
  return response.data;
};

export const createOrderItem = async (data: {
  orderId: string;
  productId: string;
  quantity: number;
  priceAtBuy: number;
  clientItemCode?: string;
}): Promise<OrderItem> => {
  const response = await api.post(API_URL, data);
  return response.data;
};

export const deleteOrderItem = async (id: string) => {
  const response = await api.delete(`${API_URL}/${id}`);
  return response.data;
};

export const scanOrderItemBarcode = async (
  orderId: string,
  barcode: string,
  qty: number,
) => {
  const response = await api.post(`${API_URL}/scan`, {
    orderId,
    barcode,
    qty,
  });
  return response.data;
};

export const revertScanOrderItem = async (
  orderId: string,
  productId: string,
  qty: number = 1,
) => {
  const response = await api.post(`${API_URL}/scan/revert`, {
    orderId,
    productId,
    qty,
  });
  return response.data;
};
