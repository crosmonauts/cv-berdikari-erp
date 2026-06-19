import { IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateReceiptDto {
  @IsString()
  receiptNumber!: string;

  @IsOptional()
  @IsDateString()
  issuedDate?: string;

  @IsString()
  invoiceId!: string;
}
