import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service'; // Memanggil Prisma
import * as bcrypt from 'bcrypt'; // Memanggil library hash password

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService, // Menambahkan Prisma ke dalam constructor
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // ENDPOINT SEMENTARA UNTUK BIKIN ADMIN
  @Get('setup-admin')
  async setupAdmin() {
    // 1. Enkripsi (Hash) password 'Berdikari123!'
    const hashedPassword = await bcrypt.hash('Berdikari123!', 10);

    // 2. Simpan user ke database
    const newUser = await this.prisma.user.create({
      data: {
        email: 'cv.berdikari.berkah.bersama@gmail.com',
        name: 'Admin Berdikari',
        password: hashedPassword,
        role: 'ADMIN', // Sesuaikan jika role di Prisma menggunakan huruf kecil atau lainnya
      },
    });

    return {
      message: 'Akun Admin berhasil dibuat! Silakan coba Login di Frontend.',
      user: newUser,
    };
  }
}
