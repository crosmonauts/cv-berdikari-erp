import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { PrismaModule } from '../prisma/prisma.module'; // Pastikan folder prisma sudah ada modulnya

@Module({
  imports: [PrismaModule], // Supaya Dashboard bisa pakai database (Prisma)
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}