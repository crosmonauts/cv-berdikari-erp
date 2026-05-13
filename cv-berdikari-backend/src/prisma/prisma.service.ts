import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const pool = new Pool({
      // PASTIIN INI BENER: postgres:root@localhost:5432/cv_berdikari
      connectionString: 'postgresql://postgres:root@localhost:5432/cv_berdikari?schema=public',
    });
    const adapter = new PrismaPg(pool);
    super({ adapter });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('✅ Berhasil konek ke Database PostgreSQL');
    } catch (error) {
      this.logger.error('❌ Gagal konek ke Database!');
      this.logger.error(error); // Ini yang bakal ngasih tau error sebenernya di terminal
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}