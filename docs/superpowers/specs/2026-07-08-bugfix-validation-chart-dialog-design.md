# Bugfix: Validation, Chart, dan Dialog Warnings

Date: 2026-07-08

## Overview

Memperbaiki 3 error yang muncul di aplikasi:
1. **400 Bad Request** — `property status should not exist` saat update PO
2. **Recharts dimension error** — Chart dashboard gagal render karena width/height -1
3. **Radix UI a11y warning** — Missing `Description`/`aria-describedby` di semua dialog

---

## Fix 1: UpdateOrderDto Field Validation

**Problem:** `PATCH /orders/:id` menggunakan `UpdateOrderDto` yang extends `PartialType(CreateOrderDto)`. `CreateOrderDto` hanya punya `poNumber`, `branchId`, `items`, `totalAmount`, `poDocumentUrl`. Field `status` dan `paymentStatus` tidak terdefinisi di DTO. Global ValidationPipe dengan `forbidNonWhitelisted: true` langsung me-reject request.

Padahal `orders.service.ts:update()` sudah handle kedua field tersebut secara manual.

**Fix:** Tulis ulang `UpdateOrderDto` sebagai class mandiri (tidak extends PartialType) dengan deklarasi eksplisit semua field yang diizinkan — termasuk `status` dan `paymentStatus` sebagai `@IsOptional()`. Tidak perlu enum validator ketat karena service melakukan validasi state transition sendiri.

## Fix 2: Recharts ResponsiveContainer Dimensions

**Problem:** `ResponsiveContainer` di `DashboardPage.tsx` wrapped dalam `div` dengan `h-[280px] w-full`. Saat mounting, element mungkin belum memiliki layout final, menyebabkan Recharts mendapat width=-1/height=-1.

**Fix:** Tambah `minWidth={0} minHeight={0}` pada `ResponsiveContainer` dan `min-w-0 min-h-0` pada wrapper `div`. Ini memastikan container memiliki dimensi minimum yang valid.

## Fix 3: Radix UI Dialog aria-describedby

**Problem:** Radix UI `DialogPrimitive.Content` mewajibkan `aria-describedby` atau `DialogDescription` untuk aksesibilitas. Sebagian besar dialog di app ini tidak memiliki deskripsi — hanya title — sehingga muncul 4x warnings.

**Fix:** Set `aria-describedby={undefined}` secara default di komponen `DialogContent` untuk menonaktifkan peringatan. Ini adalah pattern yang didokumentasikan Radix UI untuk dialog sederhana yang tidak memerlukan deskripsi.

---

## Files Changed

| File | Change Type |
|------|-------------|
| `backend/src/orders/dto/update-order.dto.ts` | Rewrite DTO |
| `frontend/src/pages/DashboardPage.tsx` | Add min dimensions |
| `frontend/src/components/ui/dialog.tsx` | Add aria-describedby default |

## Testing Notes

- Fix 1: Test via browser — buka Orders, edit PO, simpan perubahan, pastikan 200 OK
- Fix 2: Buka Dashboard, pastikan chart muncul tanpa console error
- Fix 3: Buka dialog mana pun, pastikan tidak ada warning `Missing Description` di console
