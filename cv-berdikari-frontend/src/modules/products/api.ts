import axios from 'axios';
import type { Product } from './types';

// Alamat backend NestJS Anda
const API_URL = import.meta.env.VITE_API_URL;

// 1. Fungsi untuk mengambil semua data produk
export const getProducts = async (): Promise<Product[]> => {
  const response = await axios.get(`${API_URL}/products`);
  return response.data;
};

// 2. Fungsi untuk menambah produk baru
// Omit<Product, 'id'> artinya mengirim semua data KECUALI 'id' (dibuat otomatis oleh DB)
export const createProduct = async (
  productData: Omit<Product, 'id'>,
): Promise<Product> => {
  const response = await axios.post(`${API_URL}/products`, productData);
  return response.data;
};

// 3. Fungsi untuk mengubah (edit) data dasar produk
export const updateProduct = async (
  id: string,
  productData: Partial<Product>,
): Promise<Product> => {
  const response = await axios.patch(`${API_URL}/products/${id}`, productData);
  return response.data;
};

// 4. Fungsi untuk menghapus produk berdasarkan ID
export const deleteProduct = async (id: string): Promise<void> => {
  await axios.delete(`${API_URL}/products/${id}`);
};

// 5. FUNGSI KHUSUS RESTOCK (TAMBAH KLOTER BARU)
// Fungsi ini mengirimkan jumlah barang masuk dan harga modal terbaru ke backend
export const restockProduct = async (
  id: string,
  quantity: number,
  purchasePrice: number,
): Promise<any> => {
  const response = await axios.post(`${API_URL}/products/${id}/restock`, {
    quantity,
    purchasePrice,
  });
  return response.data;
};
