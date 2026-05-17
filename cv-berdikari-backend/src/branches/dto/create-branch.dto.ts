import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateBranchDto {
  @IsString()
  @IsNotEmpty()
  branchCode!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  // Saya ubah menjadi IsOptional agar lebih aman jika kasir lupa mengisi alamat
  @IsOptional()
  @IsString()
  address?: string;

  // Saya ubah menjadi IsOptional agar aman jika nomor telepon dikosongkan
  @IsOptional()
  @IsString()
  phone?: string;

  // --- INI KUNCI UTAMANYA: Kita ubah menjadi regionId ---
  @IsString()
  @IsNotEmpty()
  regionId!: string;
}
