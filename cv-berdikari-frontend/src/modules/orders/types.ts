export interface OrderCounts {
  PENDING: number;
  DIPROSES: number;
  PROSES_KIRIM: number;
  DIKIRIM: number;
  SELESAI: number;
  warehouseQueue: number;
}

export interface Order {
  id: string;
  poNumber: string;
  status: string;
  paymentStatus?: string; // "UNPAID" | "PARTIAL" | "PAID"
  totalAmount: number;
  poDocumentUrl?: string;
  createdAt: string;
  branchId?: string;
  branch?: { id: string; name: string; branchCode: string };
  shipment?: {
    id: string;
    type: string;
    documentNumber: string;
    shippingCost?: number;
    otherFees?: number;
    status: string;
  };
  items?: Array<{
    id: string;
    productId: string;
    quantity: number;
    priceAtBuy: number;
    costPriceAtBuy?: number;
    scannedQty?: number;
    product?: { id: string; name: string; sku: string };
  }>;
  invoice?: {
    id: string;
    invoiceNumber: string;
    receipt?: { id: string; receiptNumber: string };
  };
}
