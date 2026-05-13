import { Test, TestingModule } from '@nestjs/testing';
import { TaxReportsController } from './tax-reports.controller';
import { TaxReportsService } from './tax-reports.service';

describe('TaxReportsController', () => {
  let controller: TaxReportsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaxReportsController],
      providers: [TaxReportsService],
    }).compile();

    controller = module.get<TaxReportsController>(TaxReportsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
