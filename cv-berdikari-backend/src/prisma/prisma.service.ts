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
    // KUNCI JAWABANNYA DI SINI: Kita suruh dia baca dari Environment Variable Railway!
    const connectionString = process.env.DATABASE_URL;

    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    super({ adapter });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('✅ Berhasil konek ke Database PostgreSQL');
    } catch (error) {
      this.logger.error('❌ Gagal konek ke Database!');
      this.logger.error(error);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
