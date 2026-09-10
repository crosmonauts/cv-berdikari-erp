# Spec: Redeploy Railway ke Akun Baru (Migrasi Project 2d513f44 + Bawa Data)

**Tanggal:** 2026-09-10
**Status:** Disetujui
**Project lama:** https://railway.com/project/2d513f44-8cf7-4d9d-b815-f05303651f20
**Repo:** git@github.com:crosmonauts/cv-berdikari-erp.git (branch `main`)
**Pendekatan:** B/A — CLI Full Automation, buat project baru di akun baru, bawa data Postgres lama

## Masalah

Akun Railway perlu diganti. Backend NestJS + Postgres saat ini terikat ke project `2d513f44...` di akun lama dengan domain `cv-berdikari-erp-production-45d5.up.railway.app` dan Postgres `thomas.proxy.rlwy.net:57264/railway`. Perlu redeploy clean di akun baru tanpa downtime data, dengan semua fitur tetap bisa digunakan.

## Keputusan Desain

Buat **project baru** di akun Railway baru (project ID baru), provisioning Postgres baru, deploy ulang NestJS dari GitHub yang sama, migrasi data via `pg_dump`/`pg_restore`, update `VITE_API_URL` di Vercel dan `CORS_ORIGIN` di Railway. Project lama tetap hidup sebagai rollback target sampai verifikasi lulus.

## Arsitektur

- **Railway (akun baru):** 1 project → 2 services: `postgres` (Railway Postgres) + `cv-berdikari-backend` (NIXPACKS, Root Directory `cv-berdikari-backend`, Build `npm run build`, Start `node scripts/boot.js`, Node 22, replicas 1, ON_FAILURE retry 3).
- **Vercel (tetap):** `cv-berdikari-frontend` dengan `vercel.json` SPA rewrite, `VITE_API_URL` ganti ke domain Railway baru.
- **DB lama:** `DATABASE_URL=postgresql://postgres:ZNpkWOTdkItyZHlFiyDRIhquNkDeYWZE@thomas.proxy.rlwy.net:57264/railway?sslmode=require&uselibpqcompat=true` sebagai source dump (read-only selama migrasi).
- **Domain:** Railway generate `<new>.up.railway.app` baru; tidak reuse domain lama.

## Komponen & Env Vars

### Backend env (set via `railway variables --set`)
| Var | Nilai | Sumber |
|-----|-------|--------|
| `DATABASE_URL` | auto dari Postgres baru | Railway inject, jangan set manual |
| `JWT_SECRET` | `7EO3x/dcWTxgTqXPTv6tsMCcBzlwVbjL0LOtUg2BHI8=` | reuse lama agar token existing tetap valid |
| `JWT_EXPIRES_IN` | `1d` | reuse |
| `PPN_RATE` | `0.11` | reuse |
| `PORT` | `3000` | default `main.ts` |
| `CORS_ORIGIN` | `https://cv-berdikari-erp-git-main-nanda-adam-s-projects.vercel.app,http://localhost:5173` | tambah domain Vercel baru jika berubah |

Validasi di `src/main.ts` akan exit 1 jika `DATABASE_URL|JWT_SECRET|CORS_ORIGIN` kosong.

### Frontend env (Vercel Dashboard atau `vercel env`)
| Var | Nilai |
|-----|-------|
| `VITE_API_URL` | `https://<new>.up.railway.app` |

`src/lib/api.ts` append `Bearer token` dari localStorage, 401 redirect `/login`.

### Konfigurasi build
- `cv-berdikari-backend/railway.json` tetap NIXPACKS, tidak perlu ubah.
- `scripts/boot.js`: `prisma migrate deploy` → cek `SELECT COUNT(*) FROM "User"` → `prisma db seed` jika kosong → `node dist/src/main`. Behavior ini idempoten; seed tidak akan double jika data sudah di-restore.

## Alur Data & Langkah CLI

1. **Pre-check lokal:** `railway --version`, `psql --version`, `gh repo view` konek, backup `.env` lama.
2. **Login akun baru:** `railway login` → pilih akun baru → `railway init` (atau `railway link` jika project sudah dibuat via dashboard) di root repo.
3. **Provision Postgres:** `railway add --database postgres` → tunggu service ready → `railway variables` cek `DATABASE_URL` baru ter-inject.
4. **Set vars backend:** `railway variables --set "JWT_SECRET=..." --set "JWT_EXPIRES_IN=1d" --set "PPN_RATE=0.11" --set "CORS_ORIGIN=..."` (dari `.env` lama).
5. **Deploy backend:** `railway up` atau `git push origin main` (trigger NIXPACKS: `npm run build` + `node scripts/boot.js`). Tunggu `railway logs --follow` hingga `[boot] starting app` dan `Nest application successfully started`.
6. **Migrasi data (bawa data lama):** Setelah boot awal sukses (seed sample), dump & restore:
   ```bash
   pg_dump "postgresql://postgres:ZNpkWOTdkItyZHlFiyDRIhquNkDeYWZE@thomas.proxy.rlwy.net:57264/railway?sslmode=require" --no-owner --no-acl -Fc -f dump.pgdump
   # atau pipe: pg_dump "OLD" | psql "NEW"
   pg_restore --clean --if-exists --no-owner --no-acl -d "$NEW_DATABASE_URL" dump.pgdump
   ```
   Alternatif pipe tanpa file: `pg_dump "$OLD" | psql "$NEW"`. Jika `pg_restore` gagal karena extension, fallback `pg_dump --inserts` + `psql`.
7. **Verifikasi DB baru:** `psql "$NEW" -c "SELECT COUNT(*) FROM \"User\"; SELECT COUNT(*) FROM \"Product\"; SELECT COUNT(*) FROM \"PurchaseOrder\";"`
8. **Update frontend:** Set `VITE_API_URL` baru di Vercel → redeploy Vercel → cek `VITE_API_URL` di build logs.
9. **Smoke test full fitur:** login 4 role, CRUD products/categories/regions, orders, invoices, shipments DO/AWB, receipts, taxReports, dashboard charts, PDF cetak.

## Error Handling & Rollback

- **Build gagal:** cek `railway logs`, `railway.json` Root Directory, Node 22. `railway redeploy` atau `railway up` ulang.
- **Vars kosong:** `src/main.ts` exit 1 dengan log `[error] Missing required env`; perbaiki `railway variables`.
- **CORS 401/blocked:** pastikan `CORS_ORIGIN` include domain Vercel baru + localhost; `app.enableCors` split comma.
- **Dump/restore gagal (ECONNRESET, ssl):** gunakan `?sslmode=require&uselibpqcompat=true` untuk old URL; coba `--inserts` dump. Jika tetap gagal, fallback fresh seed (data hilang, user perlu re-input).
- **Domain belum propagate:** tunggu Railway generate domain → `railway domain` cek, baru update Vercel.
- **Rollback:** jangan hapus project lama `2d513f44...` sampai smoke test lulus; jika gagal, revert `VITE_API_URL` ke `https://cv-berdikari-erp-production-45d5.up.railway.app` dan `CORS_ORIGIN` lama.

## Verifikasi (kriteria: semua fitur bisa digunakan)

- Backend: `curl https://<new>.up.railway.app/api` 200, `railway status` healthy, `railway logs` tanpa error Prisma/JWT.
- Frontend: login `admin@berdikari.com/admin123`, `cv.berdikari@gmail.com/Berdikari123!`, `gudang@berdikari.com/gudang123`, `ekspedisi@berdikari.com/ekspedisi123` semua berhasil.
- Fitur: dashboard charts render (Recharts), products CRUD, orders create/update, invoices generate, shipments DO untuk JATENG + AWB luar kota, kwitansi klasik, taxReports.
- DB: row counts `User/Product/PurchaseOrder` di PG baru == PG lama (± seed diff jika fallback).

## Catatan

- `JWT_SECRET` direuse agar token lama tidak invalid; jika ingin rotate, set baru dan paksa logout semua user.
- `railway.json` tidak perlu diubah; Root Directory set di dashboard ke `cv-berdikari-backend`.
- Hapus `dump.pgdump` setelah verifikasi untuk keamanan.
