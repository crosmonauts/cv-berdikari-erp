import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // Ini membuat Prisma otomatis tersedia di semua fitur aplikasi Anda
@Module({
  providers: [PrismaService],
  exports: [PrismaService], // Membuka akses service agar bisa dipakai modul lain
})
export class PrismaModule {}