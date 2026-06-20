import { IsString, IsNumber, IsNotEmpty, IsOptional, IsArray, ValidateNested, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';

class OrderItemInput {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  quantity: number;

  @IsNumber()
  @Type(() => Number)
  price: number;

  @IsOptional()
  @IsString()
  clientItemCode?: string;
}

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  poNumber: string;

  @IsOptional()
  @IsNumber()
  totalAmount?: number;

  @IsOptional()
  @IsString()
  poDocumentUrl?: string;

  @IsString()
  @IsNotEmpty()
  branchId: string;

  @Transform(({ value }) => typeof value === 'string' ? JSON.parse(value) : value)
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemInput)
  items?: OrderItemInput[];
}
