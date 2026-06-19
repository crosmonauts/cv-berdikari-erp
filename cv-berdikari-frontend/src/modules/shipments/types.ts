import type { Order } from "../orders/types";

export interface Shipment {
  id: string;
  type: "DO" | "AWB";
  documentNumber: string;
  status: string;
  shippingCost: number | null;
  otherFees: number | null;
  proofUrl: string | null;
  orderId: string;
  shippedAt: string;

  order?: Order;
}