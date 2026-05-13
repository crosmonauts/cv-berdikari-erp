export interface Order {
  id: string;
  poNumber: string;
  totalAmount: number;
  status: string;
  branchId: string;
  poDocumentUrl?: string; // <--- TAMBAHKAN INI
}