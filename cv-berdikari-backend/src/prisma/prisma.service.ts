import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    // Membaca URL dari Railway / .env lokal
    const connectionString = process.env.DATABASE_URL;

    // Memasang mesin Adapter PostgreSQL (Wajib untuk versi Prisma Anda)
    const pool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30000,
    });
    const adapter = new PrismaPg(pool);

    // Memberikan adapter ke Prisma
    super({ adapter });
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
