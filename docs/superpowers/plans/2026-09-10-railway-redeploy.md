# Railway Redeploy ke Akun Baru Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redeploy backend NestJS + Postgres ke project Railway baru di akun baru via CLI, bawa data lama, update Vercel frontend, verifikasi semua fitur bisa dipakai.

**Architecture:** Project Railway baru (akun baru) dengan 2 services (Postgres + NestJS NIXPACKS via `cv-berdikari-backend/railway.json` + `scripts/boot.js`). Frontend Vercel hanya ganti `VITE_API_URL`. Data dibawa via `pg_dump`/`pg_restore` pipe. Project lama `2d513f44...` tetap hidup sebagai rollback.

**Tech Stack:** Railway CLI, PostgreSQL (pg_dump/psql), NestJS 11 + Prisma 7, Vercel, Node 22

---

## File Structure

| Path | Action | Purpose |
|------|--------|---------|
| `docs/superpowers/specs/2026-09-10-railway-redeploy-design.md` | Read | Spec acuan |
| `cv-berdikari-backend/railway.json` | Read (no change) | Validasi builder NIXPACKS |
| `cv-berdikari-backend/scripts/boot.js` | Read (no change) | Validasi auto-migrate+seed |
| `cv-berdikari-backend/.env` (lokal, gitignored) | Read | Sumber env lama untuk di-copy |
| `cv-berdikari-frontend/.env` (lokal) | Read | Sumber VITE_API_URL lama |
| `docs/superpowers/plans/2026-09-10-railway-redeploy.md` | Create | Plan ini |

No code changes required; all tasks are infra CLI ops + verification.

---

### Task 1: Pre-check & Backup Env Lama

**Files:**
- Read: `cv-berdikari-backend/.env`
- Read: `cv-berdikari-frontend/.env`
- Read: `cv-berdikari-backend/railway.json`

- [ ] **Step 1: Verifikasi tool terinstall**

```bash
railway --version
psql --version
node --version
```

Expected: `railway` >=4.x, `psql` 15+, `node` 22.x. Jika missing: `npm i -g @railway/cli` dan install postgresql-client.

- [ ] **Step 2: Backup env lama ke file aman (jangan commit)**

```bash
cp cv-berdikari-backend/.env /tmp/old-backend.env && cat /tmp/old-backend.env
cp cv-berdikari-frontend/.env /tmp/old-frontend.env && cat /tmp/old-frontend.env
cat cv-berdikari-backend/railway.json
```

Expected: lihat `DATABASE_URL=postgresql://postgres:ZNpkWOTdkItyZHlFiyDRIhquNkDeYWZE@thomas.proxy.rlwy.net:57264/railway...`, `JWT_SECRET=7EO3x...`, `CORS_ORIGIN=...`, `VITE_API_URL=https://cv-berdikari-erp-production-45d5.up.railway.app`.

- [ ] **Step 3: Catat counts DB lama untuk nanti bandingkan**

```bash
psql "postgresql://postgres:ZNpkWOTdkItyZHlFiyDRIhquNkDeYWZE@thomas.proxy.rlwy.net:57264/railway?sslmode=require" -c 'SELECT COUNT(*) FROM "User"; SELECT COUNT(*) FROM "Product"; SELECT COUNT(*) FROM "PurchaseOrder";'
```

Expected: counts >0 (4 users, N products, 8 POs seed). Simpan output.

---

### Task 2: Login Akun Baru & Init Project Railway

**Files:**
- Modify: Railway remote link (`.railway` config via CLI, gitignored)

- [ ] **Step 1: Login ke akun Railway baru**

```bash
railway login
```

Expected: browser open, pilih akun baru, CLI print `Logged in as <new-email>`. Verifikasi: `railway whoami`.

- [ ] **Step 2: Init project baru (atau link jika sudah buat via dashboard)**

```bash
railway init
# pilih: Create new project -> nama: cv-berdikari-erp (atau pilih existing jika sudah dibuat)
railway status
```

Expected: `railway status` show project baru (ID != 2d513f44...), environment `production`. Alternatif link: `railway link` pilih project baru.

- [ ] **Step 3: Set Root Directory di dashboard (jika belum)**

Buka Railway Dashboard → Project baru → Service backend → Settings → Root Directory = `cv-berdikari-backend`. Verifikasi `railway.json` ada di `cv-berdikari-backend/railway.json` (sudah benar).

---

### Task 3: Provision Postgres Baru

**Files:**
- No file change; Railway managed service

- [ ] **Step 1: Tambah Postgres service**

```bash
railway add --database postgres
railway status
```

Expected: service `postgres` muncul, status `Active`. Jika CLI gagal, buat via Dashboard: New → Database → PostgreSQL.

- [ ] **Step 2: Tunggu DATABASE_URL ter-inject dan cek**

```bash
railway variables --kv | grep DATABASE_URL
# atau
railway variables
```

Expected: `DATABASE_URL=postgresql://postgres:...@postgres.railway.internal/railway` (internal URL). Jangan set manual; biarkan Railway inject. Catat sebagai `$NEW_DATABASE_URL` via `railway run env | grep DATABASE_URL` jika perlu untuk psql eksternal, atau pakai `railway connect postgres`.

---

### Task 4: Set Environment Variables Backend

**Files:**
- No file change; vars di Railway dashboard/CLI

- [ ] **Step 1: Set vars dari backup (reuse nilai lama kecuali DATABASE_URL)**

```bash
railway variables --set "JWT_SECRET=7EO3x/dcWTxgTqXPTv6tsMCcBzlwVbjL0LOtUg2BHI8=" --set "JWT_EXPIRES_IN=1d" --set "PPN_RATE=0.11" --set "CORS_ORIGIN=https://cv-berdikari-erp-git-main-nanda-adam-s-projects.vercel.app,http://localhost:5173" --set "PORT=3000"
railway variables
```

Expected: semua vars listed, `DATABASE_URL` tetap auto (jangan overwrite). Jika `CORS_ORIGIN` perlu tambah domain Vercel baru, append dengan koma.

- [ ] **Step 2: Verifikasi validasi boot tidak akan fail**

```bash
railway variables --kv | grep -E "JWT_SECRET|CORS_ORIGIN|DATABASE_URL"
```

Expected: ketiganya non-empty, sesuai `src/main.ts` required check.

---

### Task 5: Deploy Backend (NIXPACKS Build)

**Files:**
- Read: `cv-berdikari-backend/scripts/boot.js`
- Read: `cv-berdikari-backend/railway.json`

- [ ] **Step 1: Trigger deploy**

Opsi A (via CLI):

```bash
railway up --service cv-berdikari-backend
# atau dari root:
railway up
```

Opsi B (via git):

```bash
git push origin main
```

Expected: Railway build log muncul `NIXPACKS`, `npm run build` → `prisma generate && nest build`.

- [ ] **Step 2: Monitor logs sampai ready**

```bash
railway logs --follow
```

Expected: urutan `[boot] menjalankan prisma migrate deploy` → `[boot] mengecek apakah database kosong` → `[boot] starting app` → `Nest application successfully started` listening on `$PORT`.

- [ ] **Step 3: Dapatkan domain baru**

```bash
railway domain
# atau di Dashboard → Service → Domains → Generate Domain
```

Expected: domain `https://<new>-production.up.railway.app` (catat sebagai `$NEW_DOMAIN`). Test:

```bash
curl -s https://<new>.up.railway.app/health 2>&1 | head -20
# atau
curl -s https://<new>.up.railway.app/api -v 2>&1 | head -20
```

Expected: HTTP 200/404 (bukan 502). Jika 502, cek logs.

---

### Task 6: Migrasi Data (Bawa Data Lama)

**Files:**
- No file change; data layer only

- [ ] **Step 1: Dump dari DB lama (gunakan OLD_DATABASE_URL dari /tmp/old-backend.env)**

```bash
OLD="postgresql://postgres:ZNpkWOTdkItyZHlFiyDRIhquNkDeYWZE@thomas.proxy.rlwy.net:57264/railway?sslmode=require&uselibpqcompat=true"
pg_dump "$OLD" --no-owner --no-acl -Fc -f /tmp/dump.pgdump && ls -lh /tmp/dump.pgdump
```

Expected: file `/tmp/dump.pgdump` >0 bytes. Jika `pg_dump` butuh `uselibpqcompat`, keep param `&uselibpqcompat=true`.

- [ ] **Step 2: Dapatkan NEW_DATABASE_URL eksternal untuk restore**

```bash
railway variables --kv | grep DATABASE_URL
# Jika internal URL (postgres.railway.internal) tidak reachable dari lokal, pakai:
railway connect postgres --help
# atau gunakan Railway TCP proxy: Dashboard → Postgres → Connect → Public URL
```

Jika public URL tersedia, set `NEW="postgresql://postgres:...@<proxy>.rlwy.net:PORT/railway?sslmode=require"`.

- [ ] **Step 3: Restore ke DB baru**

```bash
NEW="<paste NEW_DATABASE_URL public>"
pg_restore --clean --if-exists --no-owner --no-acl -d "$NEW" /tmp/dump.pgdump
# Jika pg_restore error extension, fallback:
# pg_dump "$OLD" --no-owner --no-acl --inserts -f /tmp/dump.sql && psql "$NEW" -f /tmp/dump.sql
```

Expected: `pg_restore: ... completed` tanpa fatal error. Warning `role does not exist` aman di-ignore.

- [ ] **Step 4: Verifikasi counts sama dengan lama**

```bash
psql "$NEW" -c 'SELECT COUNT(*) FROM "User"; SELECT COUNT(*) FROM "Product"; SELECT COUNT(*) FROM "PurchaseOrder"; SELECT COUNT(*) FROM "Branch";'
```

Expected: counts == output Task 1 Step 3 (4 users, dst). Jika 0, seed tidak ter-restore — cek dump.

- [ ] **Step 5: Hapus dump file**

```bash
rm /tmp/dump.pgdump /tmp/dump.sql 2>/dev/null; echo "cleaned"
```

---

### Task 7: Update Frontend Vercel

**Files:**
- Modify: Vercel env `VITE_API_URL` (dashboard atau `vercel env`)

- [ ] **Step 1: Update VITE_API_URL di Vercel**

Via Dashboard: Vercel → Project `cv-berdikari-frontend` → Settings → Environment Variables → `VITE_API_URL` = `https://<new>.up.railway.app` → Save.

Via CLI:

```bash
vercel env rm VITE_API_URL production --yes 2>&1 || true
echo "https://<new>.up.railway.app" | vercel env add VITE_API_URL production
```

Expected: env updated.

- [ ] **Step 2: Redeploy Vercel**

```bash
vercel --prod
# atau di Dashboard: Deployments → Redeploy latest
```

Expected: build `tsc -b && vite build` sukses, domain Vercel sama.

- [ ] **Step 3: (Opsional) Update CORS_ORIGIN jika domain Vercel berubah**

Jika Vercel domain baru, append ke Railway:

```bash
railway variables --set "CORS_ORIGIN=https://cv-berdikari-erp-git-main-nanda-adam-s-projects.vercel.app,https://<new-vercel>.vercel.app,http://localhost:5173"
railway redeploy
```

---

### Task 8: Smoke Test Full Fitur & Finalize

**Files:**
- No file change; manual QA

- [ ] **Step 1: Health & auth**

```bash
curl -s https://<new>.up.railway.app/api | head -c 200
# Manual browser:
# buka https://<vercel>.vercel.app/login
# login admin@berdikari.com/admin123 → expect dashboard
# login cv.berdikari@gmail.com/Berdikari123! → SUPERADMIN
# login gudang@berdikari.com/gudang123
# login ekspedisi@berdikari.com/ekspedisi123
```

Expected: semua login sukses, tidak 401/CORS error.

- [ ] **Step 2: Test semua fitur (checklist)**

- [ ] Dashboard charts render (tanpa Recharts width -1 error)
- [ ] Products CRUD + categories + region prices
- [ ] Orders create/update (PATCH tidak 400)
- [ ] Invoices generate + PDF
- [ ] Shipments: JATENG/SEMARANG → CETAK DO / PROSES DO, luar kota → PROSES AWB
- [ ] Receipts kwitansi klasik
- [ ] Tax reports
- [ ] Branches & Regions

Expected: semua 200 OK, PDF ter-download.

- [ ] **Step 3: Tandai migrasi sukses & rollback plan**

Jangan hapus project lama `2d513f44...` selama 7 hari. Jika smoke gagal, revert:

```bash
# Vercel: set VITE_API_URL balik ke https://cv-berdikari-erp-production-45d5.up.railway.app && vercel --prod
# Railway lama tetap jalan, tidak perlu restore
```

Setelah sukses, update `cv-berdikari-backend/.env` lokal `DATABASE_URL` ke NEW jika mau dev pointing ke baru, dan commit docs jika ada perubahan env example.

- [ ] **Step 4: Commit final (jika ada perubahan .env.example)**

```bash
git status
git log --oneline -3
```

Expected: no uncommitted code changes (infra only). Jika ada, `git add ... && git commit -m "chore: update env for new Railway project"`.

---

## Self-Review

**Spec coverage:** ✅ Semua seksi spec ter-cover: Arsitektur (Task 2-3), Env (Task 4,7), Data flow (Task 6), Error handling (tiap task Expected + Task 8 rollback), Verifikasi (Task 8).

**Placeholder scan:** No TBD/TODO; semua command konkret dengan URL lama (`thomas.proxy.rlwy.net:57264`) dan `JWT_SECRET` real.

**Type consistency:** `railway variables --set`, `railway add --database postgres`, `railway up`, `pg_dump`/`pg_restore` konsisten di semua task.

