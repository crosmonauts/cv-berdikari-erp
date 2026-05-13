import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async create(createOrderDto: any) {
    return this.prisma.$transaction(async (tx) => {
      let parsedItems: any[] = [];
      try {
        if (createOrderDto.items) {
          parsedItems =
            typeof createOrderDto.items === 'string'
              ? JSON.parse(createOrderDto.items)
              : createOrderDto.items;
        }
      } catch (error) {
        throw new BadRequestException('Format daftar barang gagal diproses');
      }

      const itemsWithCost = await Promise.all(
        parsedItems.map(async (item) => {
          const activeBatches = await tx.stockBatch.findMany({
            where: { productId: item.productId, currentQuantity: { gt: 0 } },
            orderBy: { receivedAt: 'asc' },
          });
          const modalSaatIni =
            activeBatches.length > 0 ? activeBatches[0].purchasePrice : 0;

          return {
            productId: item.productId,
            quantity: Number(item.quantity),
            priceAtBuy: Number(item.price),
            costPriceAtBuy: modalSaatIni,
            clientItemCode: item.clientItemCode || null,
          };
        }),
      );

      const newOrder = await tx.purchaseOrder.create({
        data: {
          poNumber: createOrderDto.poNumber,
          totalAmount: Number(createOrderDto.totalAmount),
          branchId: createOrderDto.branchId,
          status: 'PENDING',
          // Memberi nilai default saat PO baru dibuat
          paymentStatus: 'BELUM',
          poDocumentUrl: createOrderDto.poDocumentUrl || null,
          items: {
            create: itemsWithCost,
          },
        },
      });

      return newOrder;
    });
  }

  findAll() {
    return this.prisma.purchaseOrder.findMany({
      include: {
        branch: true,
        invoice: { include: { receipt: true } },
        shipment: true,
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(id: string) {
    return this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: { items: { include: { product: true } }, branch: true },
    });
  }

  async update(id: string, updateOrderDto: any) {
    return this.prisma.$transaction(async (tx) => {
      const oldOrder = await tx.purchaseOrder.findUnique({
        where: { id },
        include: { items: true },
      });

      if (!oldOrder) throw new NotFoundException('PO tidak ditemukan');

      if (updateOrderDto.items) {
        const parsedItems =
          typeof updateOrderDto.items === 'string'
            ? JSON.parse(updateOrderDto.items)
            : updateOrderDto.items;

        const itemsWithCost = await Promise.all(
          parsedItems.map(async (item) => {
            const activeBatches = await tx.stockBatch.findMany({
              where: { productId: item.productId, currentQuantity: { gt: 0 } },
              orderBy: { receivedAt: 'asc' },
            });
            return {
              productId: item.productId,
              quantity: Number(item.quantity),
              priceAtBuy: Number(item.price),
              costPriceAtBuy:
                activeBatches.length > 0 ? activeBatches[0].purchasePrice : 0,
              clientItemCode: item.clientItemCode || null,
            };
          }),
        );

        await tx.orderItem.deleteMany({ where: { orderId: id } });
        await tx.orderItem.createMany({
          data: itemsWithCost.map((i) => ({ ...i, orderId: id })),
        });
      }

      const updatedOrder = await tx.purchaseOrder.update({
        where: { id },
        data: {
          status: updateOrderDto.status || oldOrder.status,
          // 👇 INI DIA KUNCI JAWABANNYA! KITA TAMBAHKAN PENYIMPANAN PAYMENT STATUS
          paymentStatus:
            updateOrderDto.paymentStatus || (oldOrder as any).paymentStatus,
          totalAmount: updateOrderDto.totalAmount
            ? Number(updateOrderDto.totalAmount)
            : oldOrder.totalAmount,
        },
        include: { items: true },
      });

      return updatedOrder;
    });
  }

  remove(id: string) {
    return this.prisma.purchaseOrder.delete({ where: { id } });
  }
}
