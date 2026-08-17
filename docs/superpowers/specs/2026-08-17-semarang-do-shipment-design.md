# Spec: Semarang (Wilayah Lokal) Harus Pakai DO, Bukan AWB

**Tanggal:** 2026-08-17
**Status:** Disetujui & diimplementasikan

## Masalah

Pada halaman Ekspedisi & Logistik (`ShipmentsPage.tsx`), pengiriman untuk wilayah
Semarang (cabang `regionCode: 'JATENG'`, nama "Jawa Tengah") salah diarahkan ke alur
**AWB** (Air Waybill), padahal seharunya menggunakan **DO** (Delivery Order / kurir
internal).

### Akar Masalah

- `LOCAL_REGIONS` default bernilai `'SEMARANG,SMG'`
  (`ShipmentsPage.tsx:62`) dan klasifikasi membandingkan **nama** wilayah
  (`branch.region.name.toUpperCase()`).
- Cabang Semarang di seed (`prisma/seed.ts:130,190`) menggunakan
  `regionCode: 'JATENG'` dengan `Region.name = 'Jawa Tengah'`.
- Karena `'JAWA TENGAH'` tidak ada di `LOCAL_REGIONS`, maka `isLuarKota = true`
  sehingga UI menampilkan **PROSES AWB / EDIT AWB** dan menyimpan `type: 'AWB'`
  (`ShipmentsPage.tsx`, handler `handleSaveAwb` hardcode `type: 'AWB'`).

## Keputusan Desain

Untuk wilayah lokal (Semarang/JATENG): **keduanya** — simpan record shipment
`type: 'DO'` **dan** tetap bisa mencetak PDF DO.

## Perubahan

### 1. Deteksi wilayah lokal (`cv-berdikari-frontend/src/pages/ShipmentsPage.tsx`)

- `LOCAL_REGIONS = (import.meta.env.VITE_LOCAL_REGIONS || 'JATENG,SEMARANG,SMG').split(',')`
- Klasifikasi pakai `branch.region.code.toUpperCase()` (stabil), bukan nama:
  - `isLocal = regionCode !== '' && LOCAL_REGIONS.includes(regionCode)`
  - `isLuarKota = !isLocal && regionName !== 'BELUM DIATUR'`
- Nama wilayah tetap ditampilkan di badge (variabel `regionName`).

### 2. Alur shipment DO (frontend)

- Tambah state `shipmentType: 'AWB' | 'DO'`.
- `handleOpenAwb` → `handleOpenShipment(order, type, existing?)`;
  `handleSaveAwb` → `handleSaveShipment(e)` yang mengirim
  `formData.append('type', shipmentType)`.
- Untuk DO, `documentNumber` otomatis terisi `DO-${poNumber}` (bisa diedit).
- Kolom aksi:
  - Luar kota → **PROSES AWB / EDIT AWB** (tetap).
  - Lokal → **CETAK DO** (cetak PDF, tetap) **+ PROSES DO / EDIT DO**
    (buat/edit `Shipment` `type: 'DO'`, biaya kirim/lainnya, upload resi opsional).
- Dialog menyesuaikan judul, ikon, dan label (Nomor Resi ↔ Nomor DO; Upload Resi ↔ Upload DO).

### 3. Backend (`cv-berdikari-backend`)

Tidak ada perubahan schema/DTO. `ShipmentsService.createShipment` sudah menerima
`type` (DTO mewajibkannya), sehingga DO/AWB dikirim benar dari frontend.

### 4. Perbaikan data lokal (AWB → DO)

- Script sekali-pakai: `prisma/fix-semarang-shipments.ts` (mengubah `type` → `'DO'`
  dan `documentNumber` → prefix `DO-` untuk shipment `type='AWB'` milik wilayah
  lokal). Tidak dapat dijalankan dari environment lokal karena DB produksi
  (Railway) tidak reachable (ECONNRESET).
- Agar otomatis berjalan di produksi, ditambahkan migrasi data:
  `prisma/migrations/20260817000000_fix_semarang_awb_to_do/migration.sql`
  (dijalankan otomatis saat `prisma migrate deploy` pada boot Railway berikutnya,
  di mana DB reachable).

## Verifikasi

- `npx tsc --noEmit` frontend: lolos.
- Manual: halaman Ekspedisi → cabang PN (Semarang/JATENG) menampilkan CETAK DO +
  PROSES DO; cabang luar kota tetap PROSES AWB.
- DB produksi (setelah deploy): shipment Semarang `type='DO'`, `documentNumber`
  ber-prefix `DO-`.

## Catatan

- `VITE_LOCAL_REGIONS` dapat di-override via env bila ada wilayah lokal lain.
- Migrasi data idempoten terhadap prefix `DO-` (sudah ter-prefix tidak diubah).
