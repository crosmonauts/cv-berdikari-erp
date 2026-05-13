export class CreateOrderItemDto {
  quantity: number;
  priceAtBuy: number;
  orderId: string;   // ID dari Kertas PO
  productId: string; // ID dari Barang (Kertas HVS)
}