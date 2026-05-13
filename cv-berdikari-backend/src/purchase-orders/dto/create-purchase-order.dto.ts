export class CreatePurchaseOrderDto {
  poNumber: string;
  totalAmount: number;
  branchId: string; // Ini akan diisi dengan ID panjang dari cabang McD
}