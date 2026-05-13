import { PartialType } from '@nestjs/mapped-types';
import { CreateTaxReportDto } from './create-tax-report.dto';

export class UpdateTaxReportDto extends PartialType(CreateTaxReportDto) {}
