import api from '@/lib/api';
import type { Order, OrderCounts } from './types';

export const getOrderCounts = async (): Promise<OrderCounts> => {
  const response = await api.get('/orders/counts');
  return response.data;
};

export const getOrders = async (): Promise<Order[]> => {
  const response = await api.get(`/orders`);
  return response.data.data;
};

export const getOrder = async (id: string): Promise<Order> => {
  const response = await api.get(`/orders/${id}`);
  return response.data;
};

export const createOrder = async (data: any): Promise<Order> => {
  const response = await api.post(`/orders`, data);
  return response.data;
};

export const updateOrder = async (id: string, data: any) => {
  const response = await api.patch(`/orders/${id}`, data);
  return response.data;
};

export const updateOrderStatus = async (id: string, status: string) => {
  const response = await api.patch(`/orders/${id}/status`, { status });
  return response.data;
};
