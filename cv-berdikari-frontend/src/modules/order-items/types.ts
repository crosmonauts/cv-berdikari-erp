import type { Product } from "../products/types";

export interface OrderItem {
  id: string;
  quantity: number;
  scannedQty: number;
  priceAtBuy: number;
  costPriceAtBuy: number;
  clientItemCode?: string;
  orderId: string;
  productId: string;

  // Relasi bawaan dari Prisma (include: { product: true })
  product: Product;
}