import { IsInt, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class RestockDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  purchasePrice!: number;
}
