import { Module } from '@nestjs/common';
import { OrderItemsService } from './order-items.service';
import { OrderItemsController } from './order-items.controller';
import { ProductsModule } from '../products/products.module'; // Import Modulnya
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, ProductsModule], // <--- WAJIB ADA ProductsModule DI SINI
  controllers: [OrderItemsController],
  providers: [OrderItemsService],
})
export class OrderItemsModule {}