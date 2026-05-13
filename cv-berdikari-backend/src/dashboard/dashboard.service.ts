import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats() {
    // 1. Ambil data produk & kloter stok untuk Nilai Aset (Inventory Value)
    const products = await this.prisma.product.findMany({
      include: {
        batches: {
          where: { currentQuantity: { gt: 0 } },
        },
      },
    });

    // 2. Ambil PO SELESAI & DIKIRIM (Include: items & shipment untuk hitung biaya riil)
    const completedOrders = await this.prisma.purchaseOrder.findMany({
      where: {
        status: { in: ['SELESAI', 'DIKIRIM'] },
      },
      include: {
        items: true,
        shipment: true, // <-- WAJIB: Agar biaya kirim terhitung di profit global
      },
    });

    // 3. Ambil data pendukung dashboard lainnya
    const allOrders = await this.prisma.purchaseOrder.findMany();
    const branchCount = await this.prisma.branch.count();

    // PERBAIKAN: Include shipment & items agar tabel "5 Aktivitas Terbaru" di UI tampil angkanya
    const recentOrders = await this.prisma.purchaseOrder.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        branch: true,
        shipment: true, // Untuk tampilkan ongkir per baris
        items: true, // Untuk hitung laba per baris
      },
    });

    // --- LOGIKA PERHITUNGAN KEUANGAN PRESISI ---

    let totalNetRevenue = 0; // Total Penjualan Netto (Tanpa PPN)
    let totalCOGS = 0; // Total Modal Kulakan (HPP)
    let totalShippingCosts = 0; // Total Biaya Ekspedisi (Ongkir + Lainnya)

    completedOrders.forEach((order) => {
      // A. Hitung Pendapatan & Modal dari Barang
      order.items.forEach((item) => {
        const revenueNetto = item.priceAtBuy / 1.11;
        const modal = (item as any).costPriceAtBuy || 0;

        totalNetRevenue += revenueNetto * item.quantity;
        totalCOGS += modal * item.quantity;
      });

      // B. Tambahkan Biaya Pengiriman sebagai Beban Operasional
      if (order.shipment) {
        const ongkir = Number(order.shipment.shippingCost || 0);
        const biayaLain = Number(order.shipment.otherFees || 0);
        totalShippingCosts += ongkir + biayaLain;
      }
    });

    // RUMUS LABA BERSIH RIIL:
    // Profit = (Total Jual Netto - Total Modal HPP) - Total Biaya Kirim
    const totalNetProfit = totalNetRevenue - totalCOGS - totalShippingCosts;

    // C. Total Nilai Aset Gudang (Modal stok tersedia)
    const totalInventoryValue = products.reduce((acc, product) => {
      return (
        acc +
        product.batches.reduce(
          (sum, b) => sum + b.currentQuantity * b.purchasePrice,
          0,
        )
      );
    }, 0);

    // D. Statistik Operasional
    const totalItemsInStock = products.reduce(
      (acc, p) => acc + p.batches.reduce((s, b) => s + b.currentQuantity, 0),
      0,
    );
    const totalSalesGross = allOrders.reduce(
      (acc, order) => acc + order.totalAmount,
      0,
    );

    const activeOrdersCount = await this.prisma.purchaseOrder.count({
      where: {
        status: { in: ['PENDING', 'DIPROSES', 'PROSES_KIRIM', 'DIKIRIM'] },
      },
    });

    return {
      totalProfit: totalNetProfit, // Laba Bersih RIIL (Sudah potong PPN, HPP, & Ongkir)
      totalNetRevenue, // Omzet Bersih (Tanpa PPN)
      totalCOGS, // Beban Modal Kulakan
      totalShippingCosts, // Total pengeluaran ekspedisi
      totalInventoryValue, // Nilai stok di rak gudang
      totalItemsInStock,
      totalSales: totalSalesGross, // Omzet Kotor (Include PPN)
      activeOrdersCount,
      productCount: products.length,
      branchCount,
      recentOrders,
    };
  }
}
