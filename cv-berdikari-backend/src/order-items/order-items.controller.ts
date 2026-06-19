import { Controller, Get, Post, Body, Param, Delete, UseGuards, HttpException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { OrderItemsService } from './order-items.service';
import { CreateOrderItemDto } from './dto/create-order-item.dto';
import { RevertScanDto } from './dto/revert-scan.dto';
import { ScanBarcodeDto } from './dto/scan-barcode.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('order-items')
export class OrderItemsController {
  constructor(private readonly orderItemsService: OrderItemsService) {}

  @Post()
  @Roles('SUPERADMIN', 'ADMIN')
  create(@Body() createOrderItemDto: CreateOrderItemDto) {
    return this.orderItemsService.create(createOrderItemDto);
  }

  @Get('order/:orderId')
  @Roles('SUPERADMIN', 'ADMIN', 'GUDANG')
  findByOrderId(@Param('orderId') orderId: string) {
    return this.orderItemsService.findByOrderId(orderId);
  }

  @Delete(':id')
  @Roles('SUPERADMIN', 'ADMIN')
  remove(@Param('id') id: string) {
    return this.orderItemsService.remove(id);
  }

  @Post('scan/revert')
  @Roles('SUPERADMIN', 'ADMIN', 'GUDANG')
  async revertScan(@Body() dto: RevertScanDto) {
    return this.orderItemsService.revertScan(
      dto.orderId,
      dto.productId,
      dto.qty || 1,
    );
  }

  @Post('scan')
  @Roles('SUPERADMIN', 'ADMIN', 'GUDANG')
  async scanBarcode(@Body() dto: ScanBarcodeDto) {
    const qtyToProcess = dto.qty ? Number(dto.qty) : 1;

    const result = await this.orderItemsService.scanBarcode(
      dto.orderId,
      dto.barcode,
      qtyToProcess,
    );
    return result;
  }
}
