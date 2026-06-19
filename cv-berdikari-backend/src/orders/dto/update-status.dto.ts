import { IsString, IsIn } from 'class-validator';

export class UpdateStatusDto {
  @IsString()
  @IsIn(['PENDING', 'DIPROSES', 'PROSES_KIRIM', 'DIKIRIM', 'SELESAI', 'BATAL'])
  status!: string;
}
