# Master Data Produk — Perbaikan Seed & Normalisasi Data

## Latar Belakang

Seed data produk sebelumnya memiliki 245 entri, di mana 15 produk fisik yang sama
diulang 10× untuk tiap wilayah dengan nama seperti
`"KERTAS HVS A4 ... - ATK WILAYAH JAWA BARAT"`.
Hal ini menyebabkan master data produk terlihat duplikatif.

## Tujuan

1. Master data produk bersih: 1 baris = 1 produk unik
2. Setiap produk memiliki harga + kode klien per wilayah di dalamnya
3. Flow PO: pilih cabang → pilih produk → auto-fill harga & kode klien

## Transformasi Data

| Metrik | Sebelum | Sesudah |
|--------|---------|---------|
| Total entri produk | 245 | 155 |
| Produk dengan nama duplikat wilayah | 150 (dari 15 grup × ~10 wilayah) | 0 |
| Produk unik (1 entri, 12 regionPrices) | 95 | 155 |
| Nama mengandung "ATK WILAYAH" | 150 entri | 0 |

### Algoritma Transformasi
1. Deteksi suffix `- ATK WILAYAH <region>` di nama produk
2. Grouping berdasarkan nama dasar (tanpa suffix)
3. Gabung `regionPrices` dari semua varian dalam grup
4. Jika ada region yang sama, pakai data dari varian yang sesuai
5. Hapus suffix dari nama produk
6. SKU: pertahankan SKU existing dari Excel (nanti diisi manual)

## Struktur Data (Tidak Berubah)

```
Product
  ├── sku: String @unique          ← kode existing (sementara), nanti edit manual
  ├── name: String                 ← nama bersih tanpa embel wilayah
  ├── price: Float                 ← harga jual default (fallback)
  ├── categoryId: String?
  ├── regionPrices[] → ProductRegionPrice
  │     ├── regionId: String
  │     ├── price: Float
  │     └── clientSku: String?     ← kode paten McDonald (O160...)
  └── batches[] → StockBatch
```

## Flow UI (Tidak Ada Perubahan)

### Halaman Katalog Produk
- Tabel: 1 baris per produk (155 produk, tidak ada duplikat)
- Dialog Edit → tab **Wilayah**:
  - 12 region dengan input **Harga (Rp)** + **Kode Klien** per region
- Tombol **Tambah Produk**: untuk input manual katalog baru

### Halaman Buat PO
- Pilih Cabang → otomatis tentukan region
- Pilih Produk → auto-fill harga + kode klien dari region
- Input qty → tambah ke keranjang

## Lingkup Implementasi

1. Script transformasi `seed-products.json` (merge 15 grup duplikat)
2. Update `seed.ts` — pakai data baru (155 produk)
3. Re-seed database
4. Verifikasi & test

## Non-Lingkup (Tidak Berubah)

- Prisma schema
- Backend service (products.service, orders.service, order-items.service)
- Frontend pages (ProductsPage, OrdersPage)
- Flow PO (sudah auto-resolve clientSku dari region)
