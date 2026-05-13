export class CreateTaxReportDto {
  taxFakturNum: string;
  dpp: number;       // Dasar Pengenaan Pajak
  taxAmount: number; // Jumlah Pajak (misal 11% atau 12%)
  invoiceId: string; // ID Tagihan yang dipajakkan
}