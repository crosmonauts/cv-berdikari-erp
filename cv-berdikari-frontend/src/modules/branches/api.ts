import api from '@/lib/api';
import type { Branch } from './types';

export const getBranches = async (): Promise<Branch[]> => {
  const response = await api.get(`/branches`);
  return response.data.data;
};

export const getBranch = async (id: string): Promise<Branch> => {
  const response = await api.get(`/branches/${id}`);
  return response.data;
};

export const createBranch = async (
  branchData: Partial<Branch>,
): Promise<Branch> => {
  const response = await api.post(`/branches`, branchData);
  return response.data;
};

export const updateBranch = async (
  id: string,
  branchData: Partial<Branch>,
): Promise<Branch> => {
  const response = await api.patch(`/branches/${id}`, branchData);
  return response.data;
};

export const deleteBranch = async (id: string): Promise<void> => {
  await api.delete(`/branches/${id}`);
};
