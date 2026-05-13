import axios from 'axios';
import type { Invoice } from './types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const getInvoices = async (): Promise<Invoice[]> => {
  const response = await axios.get(`${API_URL}/invoices`);
  return response.data;
};

// Fungsi untuk membuat tagihan baru
export const createInvoice = async (
  invoiceData: Omit<Invoice, 'id'>,
): Promise<Invoice> => {
  const response = await axios.post(`${API_URL}/invoices`, invoiceData);
  return response.data;
};
