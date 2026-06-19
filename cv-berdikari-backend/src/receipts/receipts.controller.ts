import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ReceiptsService } from './receipts.service';
import { CreateReceiptDto } from './dto/create-receipt.dto';
import { UpdateReceiptDto } from './dto/update-receipt.dto';
import { ReceiptQueryDto } from './dto/receipt-query.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('receipts')
export class ReceiptsController {
  constructor(private readonly receiptsService: ReceiptsService) {}

  @Post()
  @Roles('SUPERADMIN', 'ADMIN')
  create(@Body() dto: CreateReceiptDto) {
    return this.receiptsService.create(dto);
  }

  @Get()
  @Roles('SUPERADMIN', 'ADMIN', 'EKSPEDISI')
  findAll(@Query() query: ReceiptQueryDto) {
    return this.receiptsService.findAll(query);
  }

  @Get(':id')
  @Roles('SUPERADMIN', 'ADMIN', 'EKSPEDISI')
  findOne(@Param('id') id: string) {
    return this.receiptsService.findOne(id);
  }

  @Get('by-invoice/:invoiceId')
  @Roles('SUPERADMIN', 'ADMIN', 'EKSPEDISI')
  findByInvoiceId(@Param('invoiceId') invoiceId: string) {
    return this.receiptsService.findByInvoiceId(invoiceId);
  }

  @Patch(':id')
  @Roles('SUPERADMIN', 'ADMIN')
  update(@Param('id') id: string, @Body() dto: UpdateReceiptDto) {
    return this.receiptsService.update(id, dto);
  }

  @Delete(':id')
  @Roles('SUPERADMIN')
  remove(@Param('id') id: string) {
    return this.receiptsService.remove(id);
  }
}
