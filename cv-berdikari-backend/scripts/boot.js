#!/usr/bin/env node
/* Boot script for Railway.
 * 1. Jalankan migrasi database (prisma migrate deploy)
 * 2. Jalankan seed HANYA jika tabel User masih kosong
 * 3. Start aplikasi NestJS
 */
const { execSync, spawn } = require('child_process');
const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;

function run(cmd) {
  console.log(`[boot] menjalankan: ${cmd}`);
  execSync(cmd, { stdio: 'inherit', env: process.env });
}

async function main() {
  if (!DATABASE_URL) {
    console.error('[boot] DATABASE_URL tidak ditemukan di environment!');
    process.exit(1);
  }

  console.log('[boot] Menjalankan migrasi database...');
  run('npx prisma migrate deploy');

  const pool = new Pool({ connectionString: DATABASE_URL, max: 1 });
  try {
    const res = await pool.query('SELECT COUNT(*)::int AS count FROM "User"');
    const count = res.rows[0].count;
    if (count === 0) {
      console.log('[boot] Database kosong, menjalankan seed...');
      run('npx prisma db seed');
    } else {
      console.log(`[boot] Database sudah berisi ${count} user, seed dilewati.`);
    }
  } catch (err) {
    console.error('[boot] Gagal cek tabel User:', err.message);
  } finally {
    await pool.end();
  }

  console.log('[boot] Menjalankan aplikasi...');
  const child = spawn('node', ['dist/src/main'], {
    stdio: 'inherit',
    env: process.env,
  });
  child.on('exit', (code) => process.exit(code ?? 0));
}

main().catch((err) => {
  console.error('[boot] Error fatal:', err);
  process.exit(1);
});
