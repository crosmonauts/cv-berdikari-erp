export interface TaxReport {
  id: string;
  taxFakturNum: string;
  dpp: number;
  taxAmount: number;
  status: string;
  invoiceId: string;
  invoice?: { invoiceNumber: string };
}
