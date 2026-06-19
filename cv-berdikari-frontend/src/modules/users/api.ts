import api from '@/lib/api';
import type { User } from './types';

export const getUsers = async (): Promise<User[]> => {
  const res = await api.get('/users');
  return res.data.data;
};

export const getUser = async (id: string): Promise<User> => {
  const res = await api.get(`/users/${id}`);
  return res.data;
};

export const createUser = async (data: Partial<User> & { password: string }): Promise<User> => {
  const res = await api.post('/users', data);
  return res.data;
};

export const updateUser = async (id: string, data: Partial<User>): Promise<User> => {
  const res = await api.patch(`/users/${id}`, data);
  return res.data;
};

export const deleteUser = async (id: string): Promise<void> => {
  await api.delete(`/users/${id}`);
};
