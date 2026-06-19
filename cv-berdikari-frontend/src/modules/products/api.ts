import api from '@/lib/api';
import type { Product } from './types';

export const getProducts = async (): Promise<Product[]> => {
  const response = await api.get(`/products`);
  return response.data.data;
};

export const getProduct = async (id: string): Promise<Product> => {
  const response = await api.get(`/products/${id}`);
  return response.data;
};

export const createProduct = async (
  productData: Omit<Product, 'id'>,
): Promise<Product> => {
  const response = await api.post(`/products`, productData);
  return response.data;
};

export const updateProduct = async (
  id: string,
  productData: Partial<Product>,
): Promise<Product> => {
  const response = await api.patch(`/products/${id}`, productData);
  return response.data;
};

export const deleteProduct = async (id: string): Promise<void> => {
  await api.delete(`/products/${id}`);
};

export const restockProduct = async (
  id: string,
  quantity: number,
  purchasePrice: number,
): Promise<any> => {
  const response = await api.post(`/products/${id}/restock`, {
    quantity,
    purchasePrice,
  });
  return response.data;
};
