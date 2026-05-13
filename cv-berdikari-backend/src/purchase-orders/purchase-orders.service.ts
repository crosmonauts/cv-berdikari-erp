import { Injectable } from '@nestjs/common';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PurchaseOrdersService {
  constructor(private prisma: PrismaService) {}

  create(createPurchaseOrderDto: any) {
    return this.prisma.purchaseOrder.create({
      data: createPurchaseOrderDto,
    });
  }

  findAll() {
    return this.prisma.purchaseOrder.findMany({
      include: { branch: true } // Bonus: Langsung menampilkan data cabang pelanggannya!
    });
  }

  findOne(id: string) { // <--- Mengubah ke string
    return this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: { branch: true }
    });
  }

  update(id: string, updatePurchaseOrderDto: any) {
    return this.prisma.purchaseOrder.update({
      where: { id },
      data: updatePurchaseOrderDto,
    });
  }

  remove(id: string) {
    return this.prisma.purchaseOrder.delete({
      where: { id },
    });
  }
}