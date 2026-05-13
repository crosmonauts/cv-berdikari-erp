import { Module } from '@nestjs/common';
import { TaxReportsService } from './tax-reports.service';
import { TaxReportsController } from './tax-reports.controller';

@Module({
  controllers: [TaxReportsController],
  providers: [TaxReportsService],
})
export class TaxReportsModule {}
