import api from '@/lib/api';
import type { ProductCategory } from './types';

export const getProductCategories = async (): Promise<ProductCategory[]> => {
  const response = await api.get('/product-categories');
  return response.data.data;
};

export const createProductCategory = async (data: Partial<ProductCategory>): Promise<ProductCategory> => {
  const response = await api.post('/product-categories', data);
  return response.data;
};

export const updateProductCategory = async (id: string, data: Partial<ProductCategory>): Promise<ProductCategory> => {
  const response = await api.patch(`/product-categories/${id}`, data);
  return response.data;
};

export const deleteProductCategory = async (id: string): Promise<void> => {
  await api.delete(`/product-categories/${id}`);
};
