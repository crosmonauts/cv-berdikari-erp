import type { Order } from "../orders/types";

export interface Shipment {
  id: string;
  type: "DO" | "AWB"; // Hanya boleh diisi "DO" (Surat Jalan) atau "AWB" (Resi Udara)
  documentNumber: string;
  status: string;
  shippingCost: number | null;
  otherFees: number | null;
  proofUrl: string | null;
  orderId: string;
  createdAt: string;
  updatedAt: string;
  
  // Relasi bawaan jika kita memanggil data pesanan sekaligus
  order?: Order;
}