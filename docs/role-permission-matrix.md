# Role Permission Matrix — Berdikari ERP

> **Tanggal:** 18 Juni 2026
> **Proyek:** CV Berdikari ERP v2
> **Status:** ✅ Terimplementasi

---

## 1. Roles

| Role | Label | Deskripsi |
|------|-------|-----------|
| `SUPERADMIN` | Super Administrator | Akses penuh ke seluruh sistem |
| `ADMIN` | Administrator | Kelola operasional, kecuali manajemen user |
| `GUDANG` | Operator Gudang | Scanning barcode, picking, dan pengemasan |
| `EKSPEDISI` | Ekspedisi / Pengiriman | Kelola pengiriman dan AWB |

### 1.1. Credentials / Akun Login

| Role | Email | Password | Nama |
|------|-------|----------|------|
| `SUPERADMIN` | `admin@berdikari.com` | `admin123` | Super Admin |
| `ADMIN` | `cv.berdikari.berkah.bersama@gmail.com` | `Berdikari123!` | Client Berdikari |
| `GUDANG` | `gudang@berdikari.com` | `gudang123` | Operator Gudang |
| `EKSPEDISI` | `ekspedisi@berdikari.com` | `ekspedisi123` | Staff Ekspedisi |

---

## 2. Permission Matrix

| Fitur / Module | SUPERADMIN | ADMIN | GUDANG | EKSPEDISI |
|---|---|---|---|---|
| **Dashboard** | ✅ | ✅ | ✅ | ✅ |
| | | | | |
| **Produk** — Lihat | ✅ | ✅ | ✅ | ✅ |
| **Produk** — Buat / Edit / Hapus / Restok | ✅ | ✅ | ❌ | ❌ |
| **Cabang** — CRUD | ✅ | ✅ | ❌ | ❌ |
| **Wilayah** — CRUD | ✅ | ✅ | ❌ | ❌ |
| **Kategori Produk** — CRUD | ✅ | ✅ | ❌ | ❌ |
| **Users / Pengguna** — CRUD | ✅ | ❌ | ❌ | ❌ |
| | | | | |
| **Pesanan (PO)** — Lihat | ✅ | ✅ | ✅ | ✅ |
| **Pesanan (PO)** — Buat / Edit | ✅ | ✅ | ❌ | ❌ |
| | | | | |
| **Tagihan** — Lihat | ✅ | ✅ | ❌ | ✅ |
| **Tagihan** — Buat | ✅ | ✅ | ❌ | ❌ |
| | | | | |
| **Gudang / Scan Barcode** | ✅ | ✅ | ✅ | ❌ |
| | | | | |
| **Pengiriman** — Lihat & AWB | ✅ | ✅ | ❌ | ✅ |
| | | | | |
| **Laporan Pajak** — CRUD | ✅ | ✅ | ❌ | ❌ |
| | | | | |
| **Profile sendiri** | ✅ | ✅ | ✅ | ✅ |

---

## 3. Frontend Route Protection

| Route | Halaman | Allowed Roles |
|---|---|---|
| `/dashboard` | Dashboard | Semua role |
| `/products` | Produk | Semua role (aksi dibatasi) |
| `/branches` | Cabang | SUPERADMIN, ADMIN |
| `/regions` | Wilayah | SUPERADMIN, ADMIN |
| `/product-categories` | Kategori Produk | SUPERADMIN, ADMIN |
| `/users` | Pengguna | SUPERADMIN |
| `/orders` | Pesanan (PO) | Semua role (aksi dibatasi) |
| `/invoices` | Tagihan | SUPERADMIN, ADMIN, EKSPEDISI |
| `/warehouse` | Gudang / Scan | SUPERADMIN, ADMIN, GUDANG |
| `/shipments` | Pengiriman | SUPERADMIN, ADMIN, EKSPEDISI |
| `/profile` | Profile | Semua role |

---

## 4. Sidebar Navigation Visibility

| Role | Menu yang Terlihat |
|---|---|
| **SUPERADMIN** | Beranda, Master Data (Produk, Cabang, Wilayah, Kategori, Pengguna), Pesanan (PO), Tagihan, Gudang, Pengiriman |
| **ADMIN** | Beranda, Master Data (Produk, Cabang, Wilayah, Kategori), Pesanan (PO), Tagihan, Gudang, Pengiriman |
| **GUDANG** | Beranda, Master Data (Produk), Pesanan (PO), Gudang |
| **EKSPEDISI** | Beranda, Pesanan (PO), Tagihan, Pengiriman |

---

## 5. Backend API Protection

| Controller | Endpoint Role (`@Roles(...)`) |
|---|---|
| `UsersController` | All endpoints: `SUPERADMIN` |
| `ProductsController` | POST, PATCH, DELETE, restock: `SUPERADMIN, ADMIN` GET: semua role |
| `BranchesController` | All endpoints: `SUPERADMIN, ADMIN` |
| `RegionsController` | All endpoints: `SUPERADMIN, ADMIN` |
| `ProductCategoriesController` | All endpoints: `SUPERADMIN, ADMIN` |
| `OrdersController` | POST, PATCH, DELETE: `SUPERADMIN, ADMIN` GET: semua role |
| `OrderItemsController` | POST create, DELETE: `SUPERADMIN, ADMIN` POST scan: `SUPERADMIN, ADMIN, GUDANG` GET: semua role |
| `InvoicesController` | POST, PATCH, DELETE: `SUPERADMIN, ADMIN` GET: `SUPERADMIN, ADMIN, EKSPEDISI` |
| `ShipmentsController` | All endpoints: `SUPERADMIN, ADMIN, EKSPEDISI` |
| `TaxReportsController` | All endpoints: `SUPERADMIN, ADMIN` |
| `DashboardController` | Semua role |

---

## 6. Teknis Implementasi

### Backend
- **Guard:** `RolesGuard` — global guard via `APP_GUARD`
- **Decorator:** `@Roles('SUPERADMIN', 'ADMIN')` per endpoint
- **File baru:** `src/auth/roles.decorator.ts`, `src/auth/roles.guard.ts`
- **File diubah:** `src/auth/auth.module.ts`, 11 controller files

### Frontend
- **Hook:** `useUserRole()` — baca role dari localStorage
- **Route guard:** `RouteRoleGuard` — wrapper per route di `App.tsx`
- **Sidebar:** `filterNavByRole()` — filter menu berdasarkan role
- **Conditional UI:** `canManage` — sembunyikan tombol create/edit/delete
- **File baru:** `src/hooks/useUserRole.ts`, `src/components/layout/RouteRoleGuard.tsx`
- **File diubah:** `src/App.tsx`, `src/components/layout/MainLayout.tsx`, `src/pages/ProductsPage.tsx`, `src/pages/OrdersPage.tsx`, `src/pages/InvoicesPage.tsx`
