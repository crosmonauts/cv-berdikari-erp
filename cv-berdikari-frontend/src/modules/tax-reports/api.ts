import api from '@/lib/api';
import type { TaxReport } from './types';

const API_URL = '/tax-reports';

export const getTaxReports = async (): Promise<TaxReport[]> => {
  const response = await api.get(API_URL);
  return response.data.data;
};

export const getTaxReport = async (id: string): Promise<TaxReport> => {
  const response = await api.get(`${API_URL}/${id}`);
  return response.data;
};

export const createTaxReport = async (data: {
  invoiceId: string;
  taxFakturNum: string;
}): Promise<TaxReport> => {
  const response = await api.post(API_URL, data);
  return response.data;
};

export const updateTaxReport = async (
  id: string,
  data: Partial<TaxReport>,
): Promise<TaxReport> => {
  const response = await api.patch(`${API_URL}/${id}`, data);
  return response.data;
};

export const deleteTaxReport = async (id: string): Promise<void> => {
  await api.delete(`${API_URL}/${id}`);
};
