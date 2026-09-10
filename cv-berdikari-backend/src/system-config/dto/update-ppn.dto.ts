import { IsNumber, Min, Max } from 'class-validator';

export class UpdatePpnDto {
  @IsNumber()
  @Min(0)
  @Max(1)
  rate: number;
}
