import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { OrderItemsService } from './order-items.service';

@Controller('order-items')
export class OrderItemsController {
  constructor(private readonly orderItemsService: OrderItemsService) {}

  @Post()
  create(@Body() createOrderItemDto: any) {
    return this.orderItemsService.create(createOrderItemDto);
  }

  @Get('order/:orderId')
  findByOrderId(@Param('orderId') orderId: string) {
    return this.orderItemsService.findByOrderId(orderId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.orderItemsService.remove(id);
  }

  // =======================================================================
  // FITUR BARU: URL untuk menerima tembakan barcode & jumlah dari React
  // =======================================================================
  @Post('scan')
  async scanBarcode(
    @Body() body: { orderId: string; barcode: string; qty?: number },
  ) {
    try {
      // Ambil nilai qty dari frontend, jika kosong set default ke 1
      const qtyToProcess = body.qty ? Number(body.qty) : 1;

      const result = await this.orderItemsService.scanBarcode(
        body.orderId,
        body.barcode,
        qtyToProcess,
      );
      return { success: true, data: result };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }
}
