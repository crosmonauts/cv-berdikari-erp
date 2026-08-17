-- Perbaikan data: shipment wilayah lokal (Semarang/JATENG) yang salah
-- tersimpan sebagai AWB diubah menjadi DO, dengan documentNumber
-- diberi prefix "DO-".
UPDATE "Shipment" s
SET
  "type" = 'DO',
  "documentNumber" = CASE
    WHEN s."documentNumber" LIKE 'DO-%' THEN s."documentNumber"
    ELSE 'DO-' || s."documentNumber"
  END
FROM "PurchaseOrder" po
JOIN "Branch" b ON b."id" = po."branchId"
JOIN "Region" r ON r."id" = b."regionId"
WHERE s."orderId" = po."id"
  AND s."type" = 'AWB'
  AND r."code" IN ('JATENG', 'SEMARANG', 'SMG');
