import { IsNumber, IsOptional, IsString, Min, IsArray } from 'class-validator';

export class CreateProductDto {
  @IsString()
  sku!: string;

  @IsString()
  name!: string;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsNumber()
  @Min(0)
  stock!: number;

  @IsNumber()
  @Min(0)
  buyPrice!: number;

  @IsString()
  @IsOptional()
  barcode?: string;

  @IsString()
  @IsOptional()
  defaultClientSku?: string;

  // --- TAMBAHAN WAJIB UNTUK HARGA WILAYAH ---
  @IsOptional()
  @IsArray()
  regionPrices?: any[];
}
