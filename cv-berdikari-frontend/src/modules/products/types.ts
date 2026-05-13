// src/modules/products/types.ts

// Ini adalah "cetakan" bentuk data Produk yang sudah sinkron dengan Backend (Prisma)
export interface Product {
  id: string;
  sku: string;
  name: string;
  buyPrice: number; // <--- TAMBAHKAN INI (Harga Kulakan)
  price: number;    // Ini Harga Jual (Sudah inc. PPN 11%)
  stock: number;
  barcode?: string; // Tambahkan optional jika suatu saat Mas Nanda mau pakai scan barcode
}