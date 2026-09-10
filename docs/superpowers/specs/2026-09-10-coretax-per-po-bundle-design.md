# Spec: Coretax Per PO — Bundle Satu Klik (PDF + XML) dengan NSFP 17 Digit & PPN Configurable

**Tanggal:** 2026-09-10
**Status:** Disetujui — simpan saja, jangan eksekusi code (hosting Railway demo sementara)
**Pendekatan:** A — NSFP Pool dari e-Nofa + Autogenerate 17 Digit + PPN Settings DB + PDF Faktur + XML Coretax + ZIP Bundle per PO/Bulan + PO Asli

## Masalah

Per PO saat ini dokumen tersebar: `poDocumentUrl` upload di `./uploads/po` (`orders.controller.ts:26`), `Invoice PDF` & `Kwitansi PDF` generate frontend (`InvoicesPage.tsx` jsPDF), `DO` cetak (lokal) / `AWB proof` upload (`shipments.controller.ts`), `TaxReport` hanya DB (`taxFakturNum, dpp, taxAmount`) tanpa PDF/XML. Untuk Coretax DJP (1 Jan 2025) butuh **Faktur Pajak** resmi 17 digit + file `.xml` import Coretax, dan untuk demo client butuh **satu klik download semua dokumen per PO/bulan** termasuk PO asli. PPN 11% (`PPN_RATE` env, `calculator.util.ts`) perlu bisa berubah tanpa redeploy dengan histori snapshot.

## Keputusan Desain

Tambah **NSFP Pool** (stok nomor resmi dari e-Nofa, Coretax 17 digit), **SystemConfig PPN_RATE** (DB, versioned, SUPERADMIN only), **TaxReport.ppnRateUsed** snapshot. Per PO tambah endpoint **PDF Faktur Pajak** + **XML Coretax Pajak Keluaran**. Tambah **ZIP Bundle satu klik per PO** (PO Asli + Invoice + Kwitansi + DO/AWB + Faktur PDF + Faktur XML) dan **ZIP Bundle per Bulan** (rekap agregat + CSV/XM SPT Masa PPN). Hosting demo tetap ephemeral, tidak migrasi ke volume/S3 sekarang.

## Arsitektur

- **Prisma:** Tambah `SystemConfig { id, key (PPN_RATE), value String, effectiveFrom DateTime, createdBy, createdAt }` + `NsfpPool { id, year Int, prefix String @default("010.009"), startNum String, endNum String, current String, createdAt }`. Alter `TaxReport` tambah `ppnRateUsed Float` (snapshot saat create).
- **Backend:** `SystemConfigModule` (`GET /system-config/ppn`, `PUT /system-config/ppn` SUPERADMIN), `NsfpPoolModule` (`POST /nsfp-pool`, `GET /nsfp-pool`, `PATCH :id` SUPERADMIN), `TaxReportsModule` upgrade: `POST /tax-reports` atomic ambil `NsfpPool.current++` → format `XXX.XXX-YY.NNNNNNNN` 17 digit, hitung `dpp = totalGross/(1+rate)`, `ppn = totalGross - dpp` via `SystemConfig` (fallback `env PPN_RATE`), simpan `ppnRateUsed`; tambah `GET /tax-reports/:id/pdf`, `GET /tax-reports/:id/xml`, `GET /tax-reports/bundle/po/:orderId` (ZIP per PO), `GET /tax-reports/bundle/month?year&month` (ZIP per bulan + rekap CSV/XML).
- **Frontend:** Menu `Pengaturan → Pajak` (SUPERADMIN) untuk ubah PPN & kelola NSFP Pool. `TaxReportsPage.tsx` upgrade: tombol per baris `Download PDF Faktur`, `Download XML`, `Download ZIP PO`; header `Rekap Bulanan` filter `month/year` + `Export CSV SPT`, `Export XML`, `Download ZIP Bulan`. `OrdersPage/WarehousePage/InvoicesPage` tetap, `WarehousePage` preview PO via `${VITE_API_URL}${poDocumentUrl}` tetap.
- **Hosting:** Demo Railway `cv-berdikari-backend` tetap `uploads/po` ephemeral, `Railway Volume` tidak di-mount sekarang; future hosting permanen bisa mount volume atau S3 tanpa ubah API (ganti `diskStorage` destination).

## Komponen

### 1. NSFP Pool (e-Nofa)
- Input admin SUPERADMIN dari https://efaktur.pajak.go.id — range mis `010.009-25.00000001 s/d 00000100` (17 digit, digit ke-5 = 9). Sistem parse `startNum/endNum`, simpan `current=startNum`, atomic `increment` saat create faktur. Jika habis → error `Stok NSFP habis, minta baru di e-Nofa`.
- Format: `formatNsfp(n) = n.slice(0,3)+'.'+n.slice(3,6)+'-'+n.slice(6,8)+'.'+n.slice(8)` atau `XXX.XXX-YY.NNNNNNNN`.

### 2. PPN Settings
- `GET /system-config/ppn` public read, `PUT` SUPERADMIN only, body `{ rate: 0.11 | 0.12 }`, simpan `effectiveFrom = now()`. `TaxReportsService` baca `SystemConfig` terbaru, fallback `env PPN_RATE`. Simpan `ppnRateUsed` per faktur agar histori immutable.

### 3. Faktur Pajak PDF & XML
- `GET /tax-reports/:id/pdf` — jsPDF (re-use `InvoicesPage` style) header CV Berdikari, `No. Faktur: XXX`, `Tanggal, NPWP Pembeli (PT Rekso Nasional Food)`, tabel items `SKU/Kode, Deskripsi, Qty, Harga, Subtotal`, footer `DPP, PPN, Total, Terbilang`, stempel/TTD. Save `Faktur_${taxFakturNum}.pdf`.
- `GET /tax-reports/:id/xml` — template Coretax `Pajak Keluaran` `.xml` sesuai panduan DJP: `<Faktur><KodeTransaksi>01</KodeTransaksi><Tanggal>...</Tanggal><NPWP>...</NPWP><DetailTransaksi><Baris>...</Baris></DetailTransaksi></Faktur>` (field mapping dari `Order + Invoice + TaxReport`). File `Faktur_${taxFakturNum}.xml` siap `Import Data` di https://coretaxdjp.pajak.go.id.
- Alternatif generate di frontend (jsPDF) atau backend (pdf-lib) — pilih backend agar konsisten.

### 4. ZIP Bundle Satu Klik
- **Per PO:** `GET /tax-reports/bundle/po/:orderId` → ZIP berisi: `01_PO_Asli_<poNumber>.pdf` (dari `/uploads/po`), `02_Invoice_<invoiceNumber>.pdf`, `03_Kwitansi_<invoiceNumber>.pdf`, `04_DO_<poNumber>.pdf` (jika lokal) atau `04_AWB_Proof_<documentNumber>.pdf/jpg` (jika luar kota, dari `/uploads/awb`), `05_Faktur_<taxFakturNum>.pdf`, `06_Faktur_<taxFakturNum>.xml`. Nama ZIP `Bundle_PO_<poNumber>.zip`.
- **Per Bulan:** `GET /tax-reports/bundle/month?year=2026&month=09` → ZIP berisi folder per PO (struktur sama) + `Rekap_SPT_Masa_PPN_YYYYMM.csv` (kolom `No, PO, Invoice, Faktur, DPP, PPN, Total`) + `Rekap_Coretax_YYYYMM.xml` (agregat Pajak Keluaran bulanan). Nama ZIP `Bundle_Bulan_YYYYMM.zip` + cek `branchCode` McD tidak membedakan bundle (semua cabang sama).

## Alur Data

1. PO `PENDING` → upload PO PDF → `SELESAI` → `Create Invoice` (`INV-...`) → `Create TaxReport` (pilih `invoiceId`, sistem auto-ambil `NsfpPool.current`, format 17 digit, hitung `dpp/ppn` via rate saat itu, simpan `ppnRateUsed`, status `REPORTED`).
2. User klik `Download PDF/XML/ZIP PO` → backend stream file, frontend `a[download]`.
3. User pilih `month/year` di `TaxReportsPage` → klik `Export CSV/XML/ZIP Bulan` → backend agregat `sum dpp, sum ppn, count` per bulan dari `TaxReport` + `Invoice`.
4. PPN berubah: SUPERADMIN ubah di `Pengaturan Pajak` → faktur lama tetap `ppnRateUsed` lama, faktur baru pakai rate baru.

## Error Handling & Validasi

- NSFP habis / belum diisi → `400 Stok NSFP habis`.
- `current` increment atomic via `prisma.$transaction` + `update` dengan `where current` lock, hindari duplikat nomor.
- File PO/AWB tidak ada (ephemeral hilang) → ZIP skip file tersebut, sertakan `README.txt` note `PO_Asli tidak ditemukan (ephemeral)`.
- Rate tidak valid (bukan 0-1) → `400`.
- Role guard: `NsfpPool` & `SystemConfig` PUT hanya `SUPERADMIN`, `TaxReport` POST hanya `SUPERADMIN,ADMIN`, GET semua role `SUPERADMIN,ADMIN,GUDANG,EKSPEDISI` sesuai existing.
- PDF/XML generation gagal → `500` dengan log.

## Verifikasi

- Buat 2 faktur berurutan → nomor 17 digit increment `...00000001`, `...00000002`, format `XXX.XXX-YY.NNNNNNNN`.
- Ubah PPN `0.11 → 0.12` via UI → buat faktur baru → `dpp` baru pakai 12%, faktur lama cek `ppnRateUsed` tetap 0.11.
- Download per PO: cek ZIP berisi 6 file, PO PDF bisa dibuka, XML valid (buka di text editor, tag sesuai).
- Rekap bulan: `GET /tax-reports?month=09&year=2026` → `sum DPP` manual cocok dengan CSV.
- `curl -H "Authorization: Bearer <SUPERADMIN>" https://<backend>/tax-reports/bundle/po/<orderId> --output test.zip` → unzip OK.

## Catatan

- Hosting demo Railway tetap ephemeral, `uploads/po` & `uploads/awb` tidak di-mount volume; backup manual sebelum redeploy jika perlu.
- NSFP stok harus diisi manual dari e-Nofa, tidak auto-request ke DJP (scope demo, belum Host-to-Host API).
- Full Host-to-Host integrasi Coretax DJP (sertifikat elektronik, PJAP) di-scope terpisah, tidak termasuk spec ini.
- `PPN_RATE` env tetap sebagai fallback jika `SystemConfig` kosong.
