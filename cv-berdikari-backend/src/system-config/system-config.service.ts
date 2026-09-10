import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SystemConfigService {
  constructor(private prisma: PrismaService) {}

  async getPpnRate(): Promise<number> {
    const cfg = await this.prisma.systemConfig.findFirst({
      where: { key: 'PPN_RATE' },
      orderBy: { effectiveFrom: 'desc' },
    });
    if (cfg) return parseFloat(cfg.value);
    return parseFloat(process.env.PPN_RATE || '0.11');
  }

  async setPpnRate(rate: number, userId: string) {
    return this.prisma.systemConfig.create({
      data: { key: 'PPN_RATE', value: String(rate), createdBy: userId },
    });
  }
}
