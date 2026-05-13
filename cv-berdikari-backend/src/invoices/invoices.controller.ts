import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { InvoicesService } from './invoices.service';

@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  create(@Body() createInvoiceDto: any) {
    return this.invoicesService.create(createInvoiceDto);
  }

  @Get()
  findAll() {
    return this.invoicesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.invoicesService.findOne(id); // <--- Tanda + sudah dihapus
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateInvoiceDto: any) {
    return this.invoicesService.update(id, updateInvoiceDto); // <--- Tanda + sudah dihapus
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.invoicesService.remove(id); // <--- Tanda + sudah dihapus
  }
}