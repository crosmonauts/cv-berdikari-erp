import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductsService } from '../products/products.service';

@Injectable()
export class OrderItemsService {
  constructor(
    private prisma: PrismaService,
    private productsService: ProductsService,
  ) {}

  async create(createOrderItemDto: any) {
    const product = await this.prisma.product.findUnique({
      where: { id: createOrderItemDto.productId },
    });

    if (!product) {
      throw new NotFoundException('Produk tidak ditemukan di katalog!');
    }

    return this.prisma.orderItem.create({
      data: {
        orderId: createOrderItemDto.orderId,
        productId: createOrderItemDto.productId,
        quantity: Number(createOrderItemDto.quantity),
        priceAtBuy: product.price,
        scannedQty: 0,
      },
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

  remove(id: string) {
    return this.prisma.orderItem.delete({
      where: { id },
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
        throw new Error('Barcode tidak ditemukan di sistem!');
      }

      // 2. Cek pesanan di PO
      const orderItem = await tx.orderItem.findFirst({
        where: {
          orderId: orderId,
          productId: product.id,
        },
      });

      if (!orderItem) {
        throw new Error('Barang ini tidak ada di dalam Purchase Order!');
      }

      // 3. Cek kapasitas scan (Pencegahan Over-Scan)
      if (orderItem.scannedQty >= orderItem.quantity) {
        throw new Error('Barang ini sudah selesai disiapkan (Memenuhi PO).');
      }

      const sisaDibutuhkan = orderItem.quantity - orderItem.scannedQty;
      if (qty > sisaDibutuhkan) {
        throw new Error(
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
      await this.productsService.deductStockFIFO(product.id, qty); // POTONG SEBANYAK QTY

      return updatedItem;
    });
  }
}
