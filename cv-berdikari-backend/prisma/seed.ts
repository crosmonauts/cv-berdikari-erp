import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { config } from 'dotenv';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as fs from 'fs';

config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

interface RegionPriceEntry {
  regionCode: string;
  clientSku: string;
  price: number;
}

interface ProductSeed {
  sku: string;
  name: string;
  categoryName: string;
  regionPrices: RegionPriceEntry[];
}

const seedData: { products: ProductSeed[] } = JSON.parse(
  fs.readFileSync(__dirname + '/seed-products.json', 'utf-8'),
);

async function main() {
  console.log('Memulai proses seeding database...\n');

  // ─────────────────────────────────────────────────────────
  //  0. CLEAN SLATE
  // ─────────────────────────────────────────────────────────
  console.log('⏳ Membersihkan data transaksional lama...');
  await prisma.receipt.deleteMany();
  await prisma.taxReport.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.stockBatch.deleteMany();
  await prisma.productRegionPrice.deleteMany();
  await prisma.product.deleteMany();
  await prisma.productCategory.deleteMany();
  await prisma.branch.deleteMany();
  await prisma.region.deleteMany();
  console.log('✅ Data transaksional bersih.\n');

  // ─────────────────────────────────────────────────────────
  //  1. USERS
  // ─────────────────────────────────────────────────────────
  console.log('⏳ Menyuntikkan data Pengguna...');
  const adminPassword = await bcrypt.hash('admin123', 10);
  const clientPassword = await bcrypt.hash('Berdikari123!', 10);

  await prisma.user.upsert({
    where: { email: 'admin@berdikari.com' },
    update: {},
    create: {
      email: 'admin@berdikari.com',
      password: adminPassword,
      name: 'Super Admin',
      role: 'SUPERADMIN',
    },
  });
  await prisma.user.upsert({
    where: { email: 'cv.berdikari.berkah.bersama@gmail.com' },
    update: {},
    create: {
      email: 'cv.berdikari.berkah.bersama@gmail.com',
      password: clientPassword,
      name: 'Client Berdikari',
      role: 'ADMIN',
    },
  });
  const gudangPassword = await bcrypt.hash('gudang123', 10);
  await prisma.user.upsert({
    where: { email: 'gudang@berdikari.com' },
    update: {},
    create: {
      email: 'gudang@berdikari.com',
      password: gudangPassword,
      name: 'Operator Gudang',
      role: 'GUDANG',
    },
  });
  const ekspedisiPassword = await bcrypt.hash('ekspedisi123', 10);
  await prisma.user.upsert({
    where: { email: 'ekspedisi@berdikari.com' },
    update: {},
    create: {
      email: 'ekspedisi@berdikari.com',
      password: ekspedisiPassword,
      name: 'Staff Ekspedisi',
      role: 'EKSPEDISI',
    },
  });
  console.log('✅ 4 akun pengguna siap.\n');

  // ─────────────────────────────────────────────────────────
  //  2. PRODUCT CATEGORIES
  // ─────────────────────────────────────────────────────────
  console.log('⏳ Menyuntikkan Kategori Produk...');
  const categories = [
    { name: 'Kertas & Print', description: 'Kertas HVS, CD/DVD, dan perlengkapan print' },
    { name: 'Alat Tulis', description: 'Ballpoint, spidol, pensil, penghapus, buku' },
    { name: 'Amplop & Mapping', description: 'Amplop, map, ordner, dan perlengkapan filling' },
    { name: 'Lakban & Tinta', description: 'Lakban, tinta printer, dan perlengkapan packing' },
    { name: 'Stapler & Aksesoris', description: 'Stapler, isi stapler, paper clip, dan alat kantor lain' },
  ];
  const categoryMap: Record<string, string> = {};
  for (const cat of categories) {
    const created = await prisma.productCategory.create({ data: cat });
    categoryMap[cat.name] = created.id;
  }
  console.log(`✅ ${categories.length} kategori tersimpan.\n`);

  // ─────────────────────────────────────────────────────────
  //  3. REGIONS
  // ─────────────────────────────────────────────────────────
  console.log('⏳ Menyuntikkan data Wilayah...');
  const regionData = [
    { code: 'JABODETABEK', name: 'Jabodetabek' },
    { code: 'JABAR', name: 'Jawa Barat' },
    { code: 'JATENG', name: 'Jawa Tengah' },
    { code: 'JATIM', name: 'Jawa Timur' },
    { code: 'SUMATRA', name: 'Sumatra' },
    { code: 'KALIMANTAN', name: 'Kalimantan' },
    { code: 'SULAWESI', name: 'Sulawesi' },
    { code: 'BALI', name: 'Bali' },
    { code: 'NTT', name: 'Nusa Tenggara Timur (NTT)' },
    { code: 'NTB', name: 'Nusa Tenggara Barat (NTB)' },
    { code: 'TERNATE', name: 'Ternate' },
    { code: 'AMBON', name: 'Ambon' },
  ];
  const regionMap: Record<string, string> = {};
  for (const reg of regionData) {
    const created = await prisma.region.create({ data: reg });
    regionMap[reg.code] = created.id;
  }
  console.log(`✅ ${regionData.length} wilayah tersimpan.\n`);

  // ─────────────────────────────────────────────────────────
  //  4. PRODUCTS + REGION PRICES + STOCK BATCH
  // ─────────────────────────────────────────────────────────
  console.log('⏳ Menyuntikkan Produk dari data Excel...');
  const productMap: Record<string, string> = {};

  for (const p of seedData.products) {
    const product = await prisma.product.create({
      data: {
        sku: p.sku,
        name: p.name,
        price: p.regionPrices[0]?.price || 0,
        barcode: undefined,
        categoryId: categoryMap[p.categoryName],
      },
    });
    productMap[p.sku] = product.id;

    for (const rp of p.regionPrices) {
      const regionId = regionMap[rp.regionCode];
      if (regionId) {
        await prisma.productRegionPrice.create({
          data: {
            productId: product.id,
            regionId,
            price: rp.price,
            clientSku: rp.clientSku,
          },
        });
      }
    }
  }
  console.log(`✅ ${seedData.products.length} produk + harga wilayah tersimpan.\n`);

  // ─────────────────────────────────────────────────────────
  //  5. BRANCHES
  // ─────────────────────────────────────────────────────────
  console.log('⏳ Menyuntikkan data Cabang...');
  const branchSeeds = [
    { branchCode: 'KC', name: "McDonald's Rex (KC)", address: 'Jl. Kramat Raya No. 1, Jakarta Pusat', phone: '021-12345671', npwp: '01.234.567.8-091.000', regionCode: 'JABODETABEK' },
    { branchCode: 'BY', name: "McDonald's Ahmad Yani (BY)", address: 'Jl. Jend. Ahmad Yani No. 1, Bekasi', phone: '021-12345672', npwp: '01.234.567.8-092.000', regionCode: 'JABODETABEK' },
    { branchCode: 'DP', name: "McDonald's Diponegoro (DP)", address: 'Jl. Diponegoro No. 1, Bandung', phone: '022-1234567', npwp: '01.234.567.8-093.000', regionCode: 'JABAR' },
    { branchCode: 'PN', name: "McDonald's Pandanaran (PN)", address: 'Jl. Pandanaran No. 1, Semarang', phone: '024-1234567', npwp: '01.234.567.8-094.000', regionCode: 'JATENG' },
    { branchCode: 'KY', name: "McDonald's Kayoon (KY)", address: 'Jl. Kayoon No. 1, Surabaya', phone: '031-1234567', npwp: '01.234.567.8-095.000', regionCode: 'JATIM' },
    { branchCode: 'MDN', name: "McDonald's Medan (MDN)", address: 'Jl. Balai Kota No. 1, Medan', phone: '061-1234567', npwp: '01.234.567.8-096.000', regionCode: 'SUMATRA' },
    { branchCode: 'MKS', name: "McDonald's Makassar (MKS)", address: 'Jl. Pettarani No. 1, Makassar', phone: '0411-123456', npwp: '01.234.567.8-097.000', regionCode: 'SULAWESI' },
    { branchCode: 'BL', name: "McDonald's Bali (BL)", address: 'Jl. Sunset Road No. 1, Kuta, Bali', phone: '0361-123456', npwp: '01.234.567.8-098.000', regionCode: 'BALI' },
  ];
  const branchMap: Record<string, string> = {};
  for (const b of branchSeeds) {
    const branch = await prisma.branch.create({
      data: {
        branchCode: b.branchCode,
        name: b.name,
        address: b.address,
        phone: b.phone,
        npwp: b.npwp,
        regionId: regionMap[b.regionCode],
      },
    });
    branchMap[b.branchCode] = branch.id;
  }
  console.log(`✅ ${branchSeeds.length} cabang tersimpan.\n`);

  // ─────────────────────────────────────────────────────────
  //  6. SAMPLE PURCHASE ORDERS
  // ─────────────────────────────────────────────────────────
  console.log('⏳ Menyuntikkan data Purchase Order sample...');

  const productSkus = seedData.products.map(p => p.sku);
  const poProducts = productSkus.slice(0, 8);
  const now = new Date();

  const poSeeds = [
    { poNumber: 'PO-2026-001', status: 'SELESAI', paymentStatus: 'PAID', branchCode: 'KC', daysAgo: 14, items: [{ sku: poProducts[0], qty: 3 }, { sku: poProducts[1], qty: 10 }, { sku: poProducts[2], qty: 5 }] },
    { poNumber: 'PO-2026-002', status: 'SELESAI', paymentStatus: 'PAID', branchCode: 'BY', daysAgo: 10, items: [{ sku: poProducts[0], qty: 2 }, { sku: poProducts[3], qty: 8 }, { sku: poProducts[4], qty: 6 }] },
    { poNumber: 'PO-2026-003', status: 'DIKIRIM', paymentStatus: 'PARTIAL', branchCode: 'DP', daysAgo: 5, items: [{ sku: poProducts[0], qty: 5 }, { sku: poProducts[5], qty: 2 }] },
    { poNumber: 'PO-2026-004', status: 'DIPROSES', paymentStatus: 'UNPAID', branchCode: 'PN', daysAgo: 2, items: [{ sku: poProducts[0], qty: 1 }, { sku: poProducts[6], qty: 10 }] },
    { poNumber: 'PO-2026-005', status: 'PENDING', paymentStatus: 'UNPAID', branchCode: 'KY', daysAgo: 1, items: [{ sku: poProducts[0], qty: 3 }, { sku: poProducts[5], qty: 1 }, { sku: poProducts[7], qty: 5 }] },
    { poNumber: 'PO-2026-006', status: 'DIPROSES', paymentStatus: 'UNPAID', branchCode: 'MDN', daysAgo: 3, items: [{ sku: poProducts[0], qty: 2 }, { sku: poProducts[1], qty: 10 }] },
    { poNumber: 'PO-2026-007', status: 'PENDING', paymentStatus: 'UNPAID', branchCode: 'MKS', daysAgo: 0, items: [{ sku: poProducts[0], qty: 4 }, { sku: poProducts[5], qty: 1 }] },
    { poNumber: 'PO-2026-008', status: 'DIKIRIM', paymentStatus: 'UNPAID', branchCode: 'BL', daysAgo: 4, items: [{ sku: poProducts[0], qty: 1 }, { sku: poProducts[1], qty: 10 }] },
  ];

  for (const poSeed of poSeeds) {
    const branchId = branchMap[poSeed.branchCode];
    const branch = await prisma.branch.findUnique({ where: { id: branchId }, select: { regionId: true } });

    const itemsWithPrices = await Promise.all(poSeed.items.map(async (item) => {
      const productId = productMap[item.sku];
      let priceAtBuy = 0;
      let clientItemCode: string | null = null;

      if (branch?.regionId) {
        const regionPrice = await prisma.productRegionPrice.findUnique({
          where: { productId_regionId: { productId, regionId: branch.regionId } },
        });
        if (regionPrice) {
          priceAtBuy = regionPrice.price;
          clientItemCode = regionPrice.clientSku;
        }
      }
      if (priceAtBuy === 0) {
        const product = await prisma.product.findUnique({ where: { id: productId }, select: { price: true } });
        priceAtBuy = product?.price || 0;
      }
      return { productId, quantity: item.qty, priceAtBuy, clientItemCode, scannedQty: 0 };
    }));

    const totalAmount = itemsWithPrices.reduce((sum, i) => sum + i.priceAtBuy * i.quantity, 0);

    await prisma.purchaseOrder.create({
      data: {
        poNumber: poSeed.poNumber,
        status: poSeed.status as any,
        paymentStatus: poSeed.paymentStatus as any,
        totalAmount,
        branchId,
        createdAt: new Date(now.getTime() - poSeed.daysAgo * 24 * 60 * 60 * 1000),
        items: { create: itemsWithPrices },
      },
    });
    console.log(`  ✅ ${poSeed.poNumber} (${poSeed.status}) — ${poSeed.branchCode}`);
  }

  console.log(`✅ ${poSeeds.length} Purchase Order sample tersimpan.\n`);

  // ─────────────────────────────────────────────────────────
  //  SUMMARY
  // ─────────────────────────────────────────────────────────
  const regionPriceCount = await prisma.productRegionPrice.count();
  console.log('===========================================');
  console.log('  SEEDING DATABASE SELESAI!');
  console.log('===========================================');
  console.log('');
  console.log('  Akun Login:');
  console.log('  ──────────────────────────────────');
  console.log('  Super Admin : admin@berdikari.com / admin123');
  console.log('  Client      : cv.berdikari.berkah.bersama@gmail.com / Berdikari123!');
  console.log('  Gudang      : gudang@berdikari.com / gudang123');
  console.log('  Ekspedisi   : ekspedisi@berdikari.com / ekspedisi123');
  console.log('');
  console.log(`  • ${categories.length} Kategori`);
  console.log(`  • ${regionData.length} Wilayah`);
  console.log(`  • ${seedData.products.length} Produk`);
  console.log(`  • ${regionPriceCount} Harga Wilayah + Kode Klien`);
  console.log(`  • ${branchSeeds.length} Cabang`);
  console.log(`  • ${poSeeds.length} Purchase Order sample`);
  console.log('');
  console.log('🚀  PROSES SEEDING SELESAI DENGAN SUKSES!');
}

main()
  .catch((e) => {
    console.error('❌ Gagal melakukan seeding:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
