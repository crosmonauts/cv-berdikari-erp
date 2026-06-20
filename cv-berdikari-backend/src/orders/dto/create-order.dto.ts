import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  poNumber: string;

  @IsOptional()
  totalAmount?: number;

  @IsOptional()
  @IsString()
  poDocumentUrl?: string;

  @IsString()
  @IsNotEmpty()
  branchId: string;

  @IsOptional()
  items?: any;
}
