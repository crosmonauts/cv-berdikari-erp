import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    // Kita pangkas perantaranya! Langsung suruh Prisma membaca link Neon dari Railway.
    // Mesin bawaan Prisma sudah otomatis menangani SSL dan enkripsi jaringan.
    super({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('✅ Berhasil konek ke Database PostgreSQL (Neon)');
    } catch (error) {
      this.logger.error('❌ Gagal konek ke Database!');
      this.logger.error(error);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
