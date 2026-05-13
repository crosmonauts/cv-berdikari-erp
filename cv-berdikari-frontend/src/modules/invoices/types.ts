export interface Invoice {
  id: string;
  invoiceNumber: string;
  orderId: string;
  dueDate: string;
  createdAt?: string; // <--- Ini penawarnya!
  updatedAt?: string;
}