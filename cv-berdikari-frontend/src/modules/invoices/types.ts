export interface Invoice {
  id: string;
  invoiceNumber: string;
  issuedDate?: string;
  dueDate: string;
  orderId: string;
  order?: {
    poNumber: string;
    totalAmount: number;
    branch?: { name: string };
  };
}
