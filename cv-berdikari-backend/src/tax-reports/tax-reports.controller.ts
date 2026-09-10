import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
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

  @Get('bundle/po/:orderId')
  @Roles('SUPERADMIN', 'ADMIN', 'GUDANG')
  async bundlePo(@Param('orderId') orderId: string, @Res() res: Response) {
    const zip = await this.taxReportsService.generateBundlePo(orderId);
    res.set({ 'Content-Type': 'application/zip', 'Content-Disposition': `attachment; filename=Bundle_PO_${orderId}.zip` });
    res.send(zip);
  }

  @Get('bundle/month')
  @Roles('SUPERADMIN', 'ADMIN', 'GUDANG')
  async bundleMonth(@Query('year') year: string, @Query('month') month: string, @Res() res: Response) {
    const zip = await this.taxReportsService.generateBundleMonth(parseInt(year), parseInt(month));
    res.set({ 'Content-Type': 'application/zip', 'Content-Disposition': `attachment; filename=Bundle_Bulan_${year}${month}.zip` });
    res.send(zip);
  }

  @Get(':id/pdf')
  @Roles('SUPERADMIN', 'ADMIN', 'GUDANG')
  async pdf(@Param('id') id: string, @Res() res: Response) {
    const buf = await this.taxReportsService.generatePdf(id);
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename=Faktur_${id}.pdf` });
    res.send(buf);
  }

  @Get(':id/xml')
  @Roles('SUPERADMIN', 'ADMIN', 'GUDANG')
  async xml(@Param('id') id: string, @Res() res: Response) {
    const xml = await this.taxReportsService.generateXml(id);
    res.set({ 'Content-Type': 'application/xml', 'Content-Disposition': `attachment; filename=Faktur_${id}.xml` });
    res.send(xml);
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
