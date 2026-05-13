import { Test, TestingModule } from '@nestjs/testing';
import { TaxReportsService } from './tax-reports.service';

describe('TaxReportsService', () => {
  let service: TaxReportsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TaxReportsService],
    }).compile();

    service = module.get<TaxReportsService>(TaxReportsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
