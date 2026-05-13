import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TaxReportsService } from './tax-reports.service';
import { CreateTaxReportDto } from './dto/create-tax-report.dto';
import { UpdateTaxReportDto } from './dto/update-tax-report.dto';

@Controller('tax-reports')
export class TaxReportsController {
  constructor(private readonly taxReportsService: TaxReportsService) {}

  @Post()
  create(@Body() createTaxReportDto: CreateTaxReportDto) {
    return this.taxReportsService.create(createTaxReportDto);
  }

  @Get()
  findAll() {
    return this.taxReportsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.taxReportsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTaxReportDto: UpdateTaxReportDto) {
    return this.taxReportsService.update(id, updateTaxReportDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.taxReportsService.remove(id);
  }
}