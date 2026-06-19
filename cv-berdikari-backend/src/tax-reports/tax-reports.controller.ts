import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { TaxReportsService } from './tax-reports.service';
import { CreateTaxReportDto } from './dto/create-tax-report.dto';
import { UpdateTaxReportDto } from './dto/update-tax-report.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tax-reports')
export class TaxReportsController {
  constructor(private readonly taxReportsService: TaxReportsService) {}

  @Post()
  @Roles('SUPERADMIN', 'ADMIN')
  create(@Body() createTaxReportDto: CreateTaxReportDto) {
    return this.taxReportsService.create(createTaxReportDto);
  }

  @Get()
  @Roles('SUPERADMIN', 'ADMIN')
  findAll(@Query() query: PaginationQueryDto) {
    return this.taxReportsService.findAll(query);
  }

  @Get(':id')
  @Roles('SUPERADMIN', 'ADMIN')
  findOne(@Param('id') id: string) {
    return this.taxReportsService.findOne(id);
  }

  @Patch(':id')
  @Roles('SUPERADMIN', 'ADMIN')
  update(@Param('id') id: string, @Body() updateTaxReportDto: UpdateTaxReportDto) {
    return this.taxReportsService.update(id, updateTaxReportDto);
  }

  @Delete(':id')
  @Roles('SUPERADMIN', 'ADMIN')
  remove(@Param('id') id: string) {
    return this.taxReportsService.remove(id);
  }
}