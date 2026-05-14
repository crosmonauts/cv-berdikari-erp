import axios from 'axios';
import type { Branch } from './types';

const API_URL = import.meta.env.VITE_API_URL;

export const getBranches = async (): Promise<Branch[]> => {
  const response = await axios.get(`${API_URL}/branches`);
  return response.data;
};

export const createBranch = async (
  branchData: Omit<Branch, 'id'>,
): Promise<Branch> => {
  const response = await axios.post(`${API_URL}/branches`, branchData);
  return response.data;
};
