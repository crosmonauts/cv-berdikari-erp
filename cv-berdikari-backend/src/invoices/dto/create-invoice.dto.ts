export class CreateInvoiceDto {
  invoiceNumber: string;
  dueDate: string; // Tanggal jatuh tempo
  orderId: string; // ID dari Kertas PO yang ditagihkan
}