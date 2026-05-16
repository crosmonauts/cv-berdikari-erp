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
    // Biarkan Prisma bekerja secara otomatis membaca file env sesuai schema.prisma
    super();
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
