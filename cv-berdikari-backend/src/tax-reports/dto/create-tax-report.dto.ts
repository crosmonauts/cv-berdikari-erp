import { IsString, IsNumber, IsNotEmpty, Min } from 'class-validator';

export class CreateTaxReportDto {
  @IsString()
  @IsNotEmpty()
  taxFakturNum: string;

  @IsNumber()
  @Min(0)
  dpp: number;

  @IsNumber()
  @Min(0)
  taxAmount: number;

  @IsString()
  @IsNotEmpty()
  invoiceId: string;
}
