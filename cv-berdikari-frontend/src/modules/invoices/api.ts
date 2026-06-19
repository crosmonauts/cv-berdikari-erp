import api from '@/lib/api';
import type { Invoice } from './types';

export const getInvoices = async (): Promise<Invoice[]> => {
  const response = await api.get(`/invoices`);
  return response.data.data;
};

export const getInvoice = async (id: string): Promise<Invoice> => {
  const response = await api.get(`/invoices/${id}`);
  return response.data;
};

export const createInvoice = async (
  invoiceData: Omit<Invoice, 'id' | 'order'>,
): Promise<Invoice> => {
  const response = await api.post(`/invoices`, invoiceData);
  return response.data;
};

export const updateInvoice = async (id: string, data: Partial<Invoice>): Promise<Invoice> => {
  const response = await api.patch(`/invoices/${id}`, data);
  return response.data;
};

export const deleteInvoice = async (id: string): Promise<void> => {
  await api.delete(`/invoices/${id}`);
};
