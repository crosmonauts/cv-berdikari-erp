import type { Product } from "../products/types";

export interface OrderItem {
  id: string;
  quantity: number;
  scannedQty: number; // Jumlah yang sudah di-scan gudang nanti
  priceAtBuy: number;
  orderId: string;
  productId: string;
  
  // Relasi bawaan dari Prisma (include: { product: true })
  product: Product; 
}