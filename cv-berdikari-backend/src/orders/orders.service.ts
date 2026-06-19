import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  private async resolveRegionProduct(
    tx: any,
    productId: string,
    regionId: string | null | undefined,
  ): Promise<{ price: number; clientSku: string | null }> {
    if (regionId) {
      const regionPrice = await tx.productRegionPrice.findUnique({
        where: {
          productId_regionId: {
            productId,
            regionId,
          },
        },
      });
      if (regionPrice) {
        return { price: regionPrice.price, clientSku: regionPrice.clientSku ?? null };
      }
    }

    const product = await tx.product.findUnique({
      where: { id: productId },
      select: { price: true },
    });
    if (!product) throw new NotFoundException(`Product ${productId} tidak ditemukan`);
    return { price: product.price, clientSku: null };
  }

  private async resolveItemsWithPrices(
    tx: any,
    parsedItems: any[],
    regionId: string | null | undefined,
  ) {
    return Promise.all(
      parsedItems.map(async (item) => {
        const activeBatches = await tx.stockBatch.findMany({
          where: { productId: item.productId, currentQuantity: { gt: 0 } },
          orderBy: { receivedAt: 'asc' },
        });
        const modalSaatIni =
          activeBatches.length > 0 ? activeBatches[0].purchasePrice : 0;

        const regionProduct = await this.resolveRegionProduct(
          tx,
          item.productId,
          regionId,
        );

        return {
          productId: item.productId,
          quantity: Number(item.quantity),
          priceAtBuy: regionProduct.price,
          costPriceAtBuy: modalSaatIni,
          clientItemCode: regionProduct.clientSku,
        };
      }),
    );
  }

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

      const branch = await tx.branch.findUnique({
        where: { id: createOrderDto.branchId },
        select: { regionId: true },
      });
      if (!branch) {
        throw new BadRequestException('Cabang tidak ditemukan');
      }

      const itemsWithCost = await this.resolveItemsWithPrices(
        tx,
        parsedItems,
        branch.regionId,
      );

      const computedTotal = itemsWithCost.reduce(
        (sum, i) => sum + i.priceAtBuy * i.quantity,
        0,
      );

      const newOrder = await tx.purchaseOrder.create({
        data: {
          poNumber: createOrderDto.poNumber,
          totalAmount: computedTotal,
          branchId: createOrderDto.branchId,
          status: 'PENDING',
          paymentStatus: 'UNPAID',
          poDocumentUrl: createOrderDto.poDocumentUrl || null,
          items: {
            create: itemsWithCost,
          },
        },
      });

      return newOrder;
    });
  }

  async findAll(query: PaginationQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.purchaseOrder.findMany({
        skip,
        take: limit,
        include: {
          branch: true,
          invoice: { include: { receipt: true } },
          shipment: true,
          items: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.purchaseOrder.count(),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
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

      // Update non-item fields (status, paymentStatus, dll) jika ada
      const mainFields: Record<string, any> = {};
      for (const key of ['status', 'paymentStatus', 'poNumber', 'branchId']) {
        if (updateOrderDto[key] !== undefined) {
          mainFields[key] = updateOrderDto[key];
        }
      }

      if (updateOrderDto.items) {
        const parsedItems =
          typeof updateOrderDto.items === 'string'
            ? JSON.parse(updateOrderDto.items)
            : updateOrderDto.items;

        const branch = await tx.branch.findUnique({
          where: { id: updateOrderDto.branchId || oldOrder.branchId },
          select: { regionId: true },
        });

        const itemsWithCost = await this.resolveItemsWithPrices(
          tx,
          parsedItems,
          branch?.regionId,
        );

        await tx.orderItem.deleteMany({ where: { orderId: id } });
        await tx.orderItem.createMany({
          data: itemsWithCost.map((i) => ({ ...i, orderId: id })),
        });

        const computedTotal = itemsWithCost.reduce(
          (sum, i) => sum + i.priceAtBuy * i.quantity,
          0,
        );
        mainFields.totalAmount = computedTotal;
      }

      if (Object.keys(mainFields).length > 0) {
        await tx.purchaseOrder.update({
          where: { id },
          data: mainFields,
        });
      }

      const updatedOrder = await tx.purchaseOrder.findUnique({
        where: { id },
        include: { items: true },
      });

      return updatedOrder;
    });
  }

  async updateStatus(id: string, status: string) {
    const order = await this.prisma.purchaseOrder.findUnique({
      where: { id },
    });
    if (!order) throw new NotFoundException('Pesanan tidak ditemukan!');

    const validTransitions: Record<string, string[]> = {
      PENDING: ['DIPROSES', 'BATAL'],
      DIPROSES: ['PROSES_KIRIM', 'SELESAI', 'BATAL'],
      PROSES_KIRIM: ['DIKIRIM', 'BATAL'],
      DIKIRIM: ['SELESAI'],
      SELESAI: [],
      BATAL: [],
    };

    const allowed = validTransitions[order.status] || [];
    if (!allowed.includes(status)) {
      throw new BadRequestException(
        `Tidak bisa mengubah status dari ${order.status} ke ${status}`,
      );
    }

    return this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: status as any },
    });
  }

  async getCounts() {
    const groups = await this.prisma.purchaseOrder.groupBy({
      by: ['status'],
      _count: { id: true },
    });
    const counts: Record<string, number> = {};
    for (const g of groups) {
      counts[g.status] = g._count.id;
    }
    return {
      PENDING: counts['PENDING'] || 0,
      DIPROSES: counts['DIPROSES'] || 0,
      PROSES_KIRIM: counts['PROSES_KIRIM'] || 0,
      DIKIRIM: counts['DIKIRIM'] || 0,
      SELESAI: counts['SELESAI'] || 0,
      warehouseQueue: (counts['PENDING'] || 0) + (counts['DIPROSES'] || 0),
    };
  }

  async remove(id: string) {
    const existing = await this.prisma.purchaseOrder.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('PO tidak ditemukan');
    return this.prisma.purchaseOrder.delete({ where: { id } });
  }
}
