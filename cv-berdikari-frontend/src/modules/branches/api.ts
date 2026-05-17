import axios from 'axios';
import type { Branch } from './types';

const API_URL = import.meta.env.VITE_API_URL;

export const getBranches = async (): Promise<Branch[]> => {
  const response = await axios.get(`${API_URL}/branches`);
  return response.data;
};

export const createBranch = async (
  branchData: Partial<Branch>,
): Promise<Branch> => {
  const response = await axios.post(`${API_URL}/branches`, branchData);
  return response.data;
};

// --- TAMBAHAN: FUNGSI UPDATE ---
export const updateBranch = async (
  id: string,
  branchData: Partial<Branch>,
): Promise<Branch> => {
  // Menggunakan PATCH karena kita hanya mengubah sebagian data
  const response = await axios.patch(`${API_URL}/branches/${id}`, branchData);
  return response.data;
};

// --- TAMBAHAN: FUNGSI DELETE ---
export const deleteBranch = async (id: string): Promise<any> => {
  const response = await axios.delete(`${API_URL}/branches/${id}`);
  return response.data;
};
