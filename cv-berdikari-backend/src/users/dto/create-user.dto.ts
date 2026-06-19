import { IsString, IsNotEmpty, IsEmail, MinLength, IsIn } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @IsIn(['ADMIN', 'GUDANG', 'EKSPEDISI', 'SUPERADMIN'])
  role: string;
}
