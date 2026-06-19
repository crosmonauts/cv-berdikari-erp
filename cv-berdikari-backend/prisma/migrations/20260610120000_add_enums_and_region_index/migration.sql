-- Normalisasi data paymentStatus sebelum migrasi
UPDATE "PurchaseOrder" SET "paymentStatus" = 'UNPAID' WHERE "paymentStatus" IS NULL OR "paymentStatus" = 'BELUM';

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'DIPROSES', 'PROSES_KIRIM', 'DIKIRIM', 'SELESAI');
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PAID', 'PARTIAL');

-- AlterTable: PurchaseOrder.status
ALTER TABLE "PurchaseOrder" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "PurchaseOrder" ALTER COLUMN "status" SET DATA TYPE "OrderStatus" USING ("status"::text)::"OrderStatus";
ALTER TABLE "PurchaseOrder" ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- AlterTable: PurchaseOrder.paymentStatus
ALTER TABLE "PurchaseOrder" ALTER COLUMN "paymentStatus" DROP DEFAULT;
ALTER TABLE "PurchaseOrder" ALTER COLUMN "paymentStatus" SET DATA TYPE "PaymentStatus" USING ("paymentStatus"::text)::"PaymentStatus";
ALTER TABLE "PurchaseOrder" ALTER COLUMN "paymentStatus" SET DEFAULT 'UNPAID';
ALTER TABLE "PurchaseOrder" ALTER COLUMN "paymentStatus" SET NOT NULL;

-- CreateIndex: ProductRegionPrice.regionId
CREATE INDEX IF NOT EXISTS "ProductRegionPrice_regionId_idx" ON "ProductRegionPrice" ("regionId");
