import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ProductsModule } from './products/products.module';
import { BranchesModule } from './branches/branches.module';
import { PurchaseOrdersModule } from './purchase-orders/purchase-orders.module';
import { OrderItemsModule } from './order-items/order-items.module';
import { InvoicesModule } from './invoices/invoices.module';
import { TaxReportsModule } from './tax-reports/tax-reports.module';
import { OrdersModule } from './orders/orders.module';
import { ShipmentsModule } from './shipments/shipments.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AuthModule } from './auth/auth.module';
import { RegionsModule } from './regions/regions.module'; // <-- IMPORT BARU

@Module({
  imports: [
    PrismaModule,
    ProductsModule,
    BranchesModule,
    PurchaseOrdersModule,
    OrderItemsModule,
    InvoicesModule,
    TaxReportsModule,
    OrdersModule,
    ShipmentsModule,
    DashboardModule,
    AuthModule,
    RegionsModule, // <-- DIDAFTARKAN DI SINI
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
