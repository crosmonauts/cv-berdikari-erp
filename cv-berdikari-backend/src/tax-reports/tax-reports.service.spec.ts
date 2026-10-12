import { Test, TestingModule } from '@nestjs/testing';
import { TaxReportsService } from './tax-reports.service';
import { PrismaService } from '../prisma/prisma.service';
import { SystemConfigService } from '../system-config/system-config.service';
import { NsfpPoolService } from '../nsfp-pool/nsfp-pool.service';

describe('TaxReportsService', () => {
  let service: TaxReportsService;
  let prisma: any;
  let systemConfigService: any;

  beforeEach(async () => {
    prisma = {
      invoice: { findUnique: jest.fn() },
      taxReport: { create: jest.fn(), findUnique: jest.fn(), findMany: jest.fn(), count: jest.fn() },
    };
    systemConfigService = { getPpnRate: jest.fn().mockResolvedValue(0.11) };
    const nsfpPoolService = { nextNsfp: jest.fn().mockResolvedValue('010.009-25.00000001') };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaxReportsService,
        { provide: PrismaService, useValue: prisma },
        { provide: SystemConfigService, useValue: systemConfigService },
        { provide: NsfpPoolService, useValue: nsfpPoolService },
      ],
    }).compile();
    service = module.get<TaxReportsService>(TaxReportsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should save ppnRateUsed snapshot', async () => {
    jest.spyOn(systemConfigService, 'getPpnRate').mockResolvedValue(0.12);
    prisma.invoice.findUnique.mockResolvedValue({ id: 'inv1', order: { totalAmount: 100000 } });
    prisma.taxReport.create.mockImplementation(async ({ data }: any) => ({ id: '1', ...data }));
    const report: any = await service.create({ invoiceId: 'inv1', taxFakturNum: '010.009-25.00000001' } as any);
    expect(report.ppnRateUsed).toBe(0.12);
    expect(report.dpp).toBeCloseTo(100000 / 1.12);
  });
});
