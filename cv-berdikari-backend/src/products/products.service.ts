import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  // 1. CREATE PRODUCT (DENGAN HARGA PER WILAYAH)
  async create(createProductDto: CreateProductDto) {
    return this.prisma.$transaction(async (tx) => {
      // 1.1 Simpan produk utama
      const product = await tx.product.create({
        data: {
          sku: createProductDto.sku,
          name: createProductDto.name,
          price: createProductDto.price, // Harga default
          barcode: createProductDto.barcode,
          categoryId: (createProductDto as any).categoryId || null,
        },
      });

      // 1.2 Simpan kloter stok pertama
      await tx.stockBatch.create({
        data: {
          productId: product.id,
          purchasePrice: (createProductDto as any).buyPrice,
          initialQuantity: (createProductDto as any).stock,
          currentQuantity: (createProductDto as any).stock,
          receivedAt: new Date(),
        },
      });

      // --- TAMBAHAN: Simpan daftar harga per wilayah ---
      // Mengecek apakah frontend mengirimkan data `regionPrices`
      const regionPricesData = (createProductDto as any).regionPrices;
      if (regionPricesData && Array.isArray(regionPricesData)) {
        for (const rp of regionPricesData) {
          await tx.productRegionPrice.create({
            data: {
              productId: product.id,
              regionId: rp.regionId,
              price: Number(rp.price),
              clientSku: rp.clientSku || null,
            },
          });
        }
      }

      return product;
    });
  }

  // 2. RESTOCK (TETAP SAMA - TIDAK PENGARUH KE HARGA JUAL)
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
        receivedAt: new Date(),
      },
    });
  }

  // 3. FIND ALL (INCLUDE HARGA PER WILAYAH)
  async findAll(query: PaginationQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        skip,
        take: limit,
        include: {
          category: true,
          batches: {
            where: { currentQuantity: { gt: 0 } },
            orderBy: { receivedAt: 'asc' },
          },
          // --- TAMBAHAN: Ambil data harga wilayah saat me-load produk ---
          regionPrices: {
            include: {
              region: true, // Sertakan nama wilayahnya juga
            },
          },
        },
      }),
      this.prisma.product.count(),
    ]);

    const data = products.map((p) => {
      const totalStock = p.batches.reduce(
        (sum, b) => sum + b.currentQuantity,
        0,
      );
      const currentBuyPrice =
        p.batches.length > 0 ? p.batches[0].purchasePrice : 0;

      return {
        ...p,
        stock: totalStock,
        buyPrice: currentBuyPrice,
      };
    });

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        batches: true,
        regionPrices: { include: { region: true } },
      },
    });

    if (!product) throw new NotFoundException('Produk tidak ditemukan!');

    return {
      ...product,
      stock: product.batches.reduce((sum, b) => sum + b.currentQuantity, 0),
    };
  }

  // 4. MESIN FIFO — dipanggil dari luar tanpa tx (auto-wrap transaction)
  async deductStockFIFO(productId: string, quantityToDeduct: number) {
    return this.prisma.$transaction(async (tx) => {
      await this.deductStockFIFOWithTx(tx, productId, quantityToDeduct);
    });
  }

  // Dipanggil dari dalam transaction orang lain (scanBarcode dll)
  async deductStockFIFOWithTx(
    tx: any,
    productId: string,
    quantityToDeduct: number,
  ) {
    let remainingNeed = quantityToDeduct;
    const activeBatches = await tx.stockBatch.findMany({
      where: { productId, currentQuantity: { gt: 0 } },
      orderBy: { receivedAt: 'asc' },
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
      throw new NotFoundException(
        `Stok gudang tidak mencukupi! Kurang ${remainingNeed} unit.`,
      );
    }
  }

  // Reverse FIFO — credit stock back to latest batch
  async creditStockFIFOWithTx(tx: any, productId: string, qty: number) {
    const latestBatch = await tx.stockBatch.findFirst({
      where: { productId },
      orderBy: { receivedAt: 'desc' },
    });

    if (latestBatch) {
      await tx.stockBatch.update({
        where: { id: latestBatch.id },
        data: { currentQuantity: { increment: qty } },
      });
    } else {
      throw new NotFoundException('Tidak ada batch stok untuk dikembalikan!');
    }
  }

  // 5. UPDATE (DENGAN HARGA PER WILAYAH)
  async update(id: string, updateProductDto: UpdateProductDto) {
    return this.prisma.$transaction(async (tx) => {
      // 5.1 Ekstrak data wilayah agar tidak ikut tersimpan di tabel utama
      const { regionPrices, ...mainProductData } = updateProductDto as any;

      // 5.2 Update data produk utama
      const updatedProduct = await tx.product.update({
        where: { id },
        data: mainProductData,
      });

      // 5.3 Update harga wilayah (Hapus yang lama, masukkan yang baru)
      if (regionPrices && Array.isArray(regionPrices)) {
        // Bersihkan dulu harga lama untuk produk ini
        await tx.productRegionPrice.deleteMany({
          where: { productId: id },
        });

        // Masukkan harga baru
        for (const rp of regionPrices) {
          await tx.productRegionPrice.create({
            data: {
              productId: id,
              regionId: rp.regionId,
              price: Number(rp.price),
              clientSku: rp.clientSku || null,
            },
          });
        }
      }

      return updatedProduct;
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Produk tidak ditemukan!');
    return this.prisma.product.delete({
      where: { id },
    });
  }
}
