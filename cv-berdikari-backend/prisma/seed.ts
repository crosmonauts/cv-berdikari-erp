import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { config } from 'dotenv';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// 1. Baca file .env secara manual agar DATABASE_URL terbaca
config();

// 2. Siapkan mesin Adapter PostgreSQL untuk Neon
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

// 3. Masukkan mesinnya ke dalam Prisma Client (Ini yang diminta oleh Error tadi!)
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Memulai proses seeding database...');

  // Enkripsi Password untuk Super Admin
  const adminPassword = await bcrypt.hash('admin123', 10);

  // Enkripsi Password untuk Client
  const clientPassword = await bcrypt.hash('Berdikari123!', 10);

  // Menyuntikkan data Akun Pertama (Admin)
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

  // Menyuntikkan data Akun Kedua (Client)
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

  console.log('✅ SEEDING SUKSES!');
  console.log('-------------------------------------------');
  console.log('Akun 1 (Super Admin):');
  console.log(`Email    : ${admin.email}`);
  console.log('Password : admin123');
  console.log('-------------------------------------------');
  console.log('Akun 2 (Client):');
  console.log(`Email    : ${client.email}`);
  console.log('Password : Berdikari123!');
  console.log('-------------------------------------------');
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
