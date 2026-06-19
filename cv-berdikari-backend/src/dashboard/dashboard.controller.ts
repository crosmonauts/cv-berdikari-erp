import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { DashboardService } from './dashboard.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dashboard')
export class DashboardController {
  // Panggil service lewat constructor (Dependency Injection)
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @Roles('SUPERADMIN', 'ADMIN', 'GUDANG', 'EKSPEDISI')
  async getStats() {
    return this.dashboardService.getDashboardStats();
  }
}