import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { config } from 'dotenv';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// Baca file .env secara manual agar DATABASE_URL terbaca saat script dijalankan
config();

// Setup Adapter Neon untuk Prisma 7
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

// Masukkan adapter ke dalam Prisma Client
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Memulai proses seeding database...');

  // ---------------------------------------------------------
  // 1. SEEDING PENGGUNA (USERS)
  // ---------------------------------------------------------
  console.log('⏳ Menyuntikkan data Akun Pengguna...');
  const adminPassword = await bcrypt.hash('admin123', 10);
  const clientPassword = await bcrypt.hash('Berdikari123!', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@berdikari.com' },
    update: {},
    create: {
      email: 'admin@berdikari.com',
      password: adminPassword,
      name: 'Super Admin',
      role: 'SUPERADMIN',
    },
  });

  const client = await prisma.user.upsert({
    where: { email: 'cv.berdikari.berkah.bersama@gmail.com' },
    update: {},
    create: {
      email: 'cv.berdikari.berkah.bersama@gmail.com',
      password: clientPassword,
      name: 'Client Berdikari',
      role: 'ADMIN',
    },
  });

  // ---------------------------------------------------------
  // 2. SEEDING WILAYAH (REGIONS)
  // ---------------------------------------------------------
  console.log('⏳ Menyuntikkan data 12 Wilayah Nusantara...');
  const regions = [
    { code: 'JABODETABEK', name: 'Jabodetabek' },
    { code: 'JATENG', name: 'Jawa Tengah' },
    { code: 'JABAR', name: 'Jawa Barat' },
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

  for (const reg of regions) {
    await prisma.region.upsert({
      where: { code: reg.code },
      update: {},
      create: reg,
    });
  }

  // ---------------------------------------------------------
  // SUMMARY HASIL SEEDING
  // ---------------------------------------------------------
  console.log('✅ 12 Wilayah berhasil ditambahkan ke Database!');
  console.log('✅ Akun Pengguna berhasil disuntikkan!');
  console.log('-------------------------------------------');
  console.log('Akun 1 (Super Admin):');
  console.log(`Email    : ${admin.email}`);
  console.log('Password : admin123');
  console.log('-------------------------------------------');
  console.log('Akun 2 (Client):');
  console.log(`Email    : ${client.email}`);
  console.log('Password : Berdikari123!');
  console.log('-------------------------------------------');
  console.log('🚀 PROSES SEEDING SELESAI DENGAN SUKSES!');
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
