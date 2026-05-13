import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  // 1. CREATE PRODUCT (KLOTER PERTAMA)
  async create(createProductDto: CreateProductDto) {
    return this.prisma.$transaction(async (tx) => {
      // Simpan produk utama
      const product = await tx.product.create({
        data: {
          sku: createProductDto.sku,
          name: createProductDto.name,
          defaultClientSku: (createProductDto as any).defaultClientSku || null, // <-- TAMBAHAN: Simpan kode klien dari frontend
          price: createProductDto.price,
          barcode: createProductDto.barcode,
        },
      });

      // Simpan kloter stok pertama
      await tx.stockBatch.create({
        data: {
          productId: product.id,
          purchasePrice: (createProductDto as any).buyPrice,
          initialQuantity: (createProductDto as any).stock,
          currentQuantity: (createProductDto as any).stock,
          receivedAt: new Date(),
        },
      });

      return product;
    });
  }

  // 2. RESTOCK (TAMBAH KLOTER BARU UNTUK FIFO)
  // Fungsi ini dipanggil oleh tombol "Restock" di Frontend
  async restock(
    productId: string,
    data: { quantity: number; purchasePrice: number },
  ) {
    return this.prisma.stockBatch.create({
      data: {
        productId: productId,
        initialQuantity: Number(data.quantity),
        currentQuantity: Number(data.quantity),
        purchasePrice: Number(data.purchasePrice),
        receivedAt: new Date(), // Waktu ini menjadi penanda antrean FIFO
      },
    });
  }

  // 3. FIND ALL (HITUNG STOK GABUNGAN DARI SEMUA KLOTER)
  async findAll() {
    const products = await this.prisma.product.findMany({
      include: {
        batches: {
          where: { currentQuantity: { gt: 0 } },
          orderBy: { receivedAt: 'asc' }, // FIFO: Yang paling lama didahulukan
        },
      },
    });

    return products.map((p) => {
      const totalStock = p.batches.reduce(
        (sum, b) => sum + b.currentQuantity,
        0,
      );
      // Harga beli diambil dari kloter tertua (First In)
      const currentBuyPrice =
        p.batches.length > 0 ? p.batches[0].purchasePrice : 0;

      return {
        ...p,
        stock: totalStock,
        buyPrice: currentBuyPrice,
      };
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { batches: true },
    });

    if (!product) throw new NotFoundException('Produk tidak ditemukan!');

    return {
      ...product,
      stock: product.batches.reduce((sum, b) => sum + b.currentQuantity, 0),
    };
  }

  // 4. MESIN FIFO (DIPANGGIL SAAT BARANG DI-SCAN DI GUDANG)
  async deductStockFIFO(productId: string, quantityToDeduct: number) {
    return this.prisma.$transaction(async (tx) => {
      let remainingNeed = quantityToDeduct;

      const activeBatches = await tx.stockBatch.findMany({
        where: { productId: productId, currentQuantity: { gt: 0 } },
        orderBy: { receivedAt: 'asc' }, // Mengambil stok dari kloter paling lama
      });

      for (const batch of activeBatches) {
        if (remainingNeed <= 0) break;

        if (batch.currentQuantity >= remainingNeed) {
          await tx.stockBatch.update({
            where: { id: batch.id },
            data: { currentQuantity: batch.currentQuantity - remainingNeed },
          });
          remainingNeed = 0;
        } else {
          remainingNeed -= batch.currentQuantity;
          await tx.stockBatch.update({
            where: { id: batch.id },
            data: { currentQuantity: 0 },
          });
        }
      }

      if (remainingNeed > 0) {
        throw new Error(
          `Stok gudang tidak mencukupi! Kurang ${remainingNeed} unit.`,
        );
      }
    });
  }

  update(id: string, updateProductDto: UpdateProductDto) {
    return this.prisma.product.update({
      where: { id },
      data: updateProductDto,
    });
  }

  remove(id: string) {
    return this.prisma.product.delete({
      where: { id },
    });
  }
}
