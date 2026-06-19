import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateRegionDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;
}
