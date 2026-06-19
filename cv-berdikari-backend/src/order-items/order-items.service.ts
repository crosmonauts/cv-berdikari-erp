import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductsService } from '../products/products.service';
import { CreateOrderItemDto } from './dto/create-order-item.dto';

@Injectable()
export class OrderItemsService {
  constructor(
    private prisma: PrismaService,
    private productsService: ProductsService,
  ) {}

  async create(createOrderItemDto: CreateOrderItemDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: createOrderItemDto.productId },
    });

    if (!product) {
      throw new NotFoundException('Produk tidak ditemukan di katalog!');
    }

    // Resolve harga & clientSku berdasarkan region branch dari order
    const order = await this.prisma.purchaseOrder.findUnique({
      where: { id: createOrderItemDto.orderId },
      include: { branch: { select: { regionId: true } } },
    });
    if (!order) {
      throw new NotFoundException('Purchase Order tidak ditemukan');
    }

    let finalPrice = product.price;
    let clientSku: string | null = null;
    if (order.branch?.regionId) {
      const regionPrice = await this.prisma.productRegionPrice.findUnique({
        where: {
          productId_regionId: {
            productId: createOrderItemDto.productId,
            regionId: order.branch.regionId,
          },
        },
      });
      if (regionPrice) {
        finalPrice = regionPrice.price;
        clientSku = regionPrice.clientSku ?? null;
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const newItem = await tx.orderItem.create({
        data: {
          orderId: createOrderItemDto.orderId,
          productId: createOrderItemDto.productId,
          quantity: Number(createOrderItemDto.quantity),
          priceAtBuy: finalPrice,
          scannedQty: 0,
          clientItemCode: clientSku,
        },
      });

      // Rekalkulasi totalAmount PO
      const allItems = await tx.orderItem.findMany({
        where: { orderId: createOrderItemDto.orderId },
      });
      const newTotal = allItems.reduce(
        (sum, i) => sum + i.priceAtBuy * i.quantity,
        0,
      );
      await tx.purchaseOrder.update({
        where: { id: createOrderItemDto.orderId },
        data: { totalAmount: newTotal },
      });

      return newItem;
    });
  }

  findByOrderId(orderId: string) {
    return this.prisma.orderItem.findMany({
      where: { orderId: orderId },
      include: {
        product: true,
      },
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.orderItem.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Order item tidak ditemukan!');
    return this.prisma.orderItem.delete({
      where: { id },
    });
  }

  async revertScan(orderId: string, productId: string, qty: number = 1) {
    return this.prisma.$transaction(async (tx) => {
      const orderItem = await tx.orderItem.findFirst({
        where: { orderId, productId },
      });

      if (!orderItem) {
        throw new NotFoundException('Order item tidak ditemukan!');
      }

      if (orderItem.scannedQty < qty) {
        throw new BadRequestException(
          'Jumlah yang di-revert melebihi scanned quantity!',
        );
      }

      const updatedItem = await tx.orderItem.update({
        where: { id: orderItem.id },
        data: { scannedQty: { decrement: qty } },
        include: { product: true },
      });

      await this.productsService.creditStockFIFOWithTx(tx, productId, qty);

      return updatedItem;
    });
  }

  // =======================================================================
  // FITUR SCAN BARCODE (MENDUKUNG MULTIPLIER & FIFO)
  // =======================================================================
  async scanBarcode(orderId: string, barcode: string, qty: number = 1) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Cari produk berdasarkan barcode
      const product = await tx.product.findUnique({
        where: { barcode: barcode },
      });

      if (!product) {
        throw new NotFoundException('Barcode tidak ditemukan di sistem!');
      }

      // 2. Cek pesanan di PO
      const orderItem = await tx.orderItem.findFirst({
        where: {
          orderId: orderId,
          productId: product.id,
        },
      });

      if (!orderItem) {
        throw new BadRequestException('Barang ini tidak ada di dalam Purchase Order!');
      }

      // 3. Cek kapasitas scan (Pencegahan Over-Scan)
      if (orderItem.scannedQty >= orderItem.quantity) {
        throw new BadRequestException('Barang ini sudah selesai disiapkan (Memenuhi PO).');
      }

      const sisaDibutuhkan = orderItem.quantity - orderItem.scannedQty;
      if (qty > sisaDibutuhkan) {
        throw new BadRequestException(
          `Kelebihan jumlah! Anda memasukkan ${qty}, tapi sisa yang dibutuhkan hanya ${sisaDibutuhkan} barang lagi.`,
        );
      }

      // 4. Update jumlah yang sudah di-scan secara massal
      const updatedItem = await tx.orderItem.update({
        where: { id: orderItem.id },
        data: { scannedQty: { increment: qty } }, // INCREMENT OTOMATIS SEBANYAK QTY
        include: { product: true },
      });

      // 5. KURANGI STOK MENGGUNAKAN FIFO SECARA MASSAL
      await this.productsService.deductStockFIFOWithTx(tx, product.id, qty); // POTONG SEBANYAK QTY

      return updatedItem;
    });
  }
}
