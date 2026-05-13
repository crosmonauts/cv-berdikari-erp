// src/common/utils/calculator.util.ts

export const hitungKeuangan = (hargaJual: number, hargaKulak: number) => {
  // Pastikan harga tidak negatif
  const jual = hargaJual || 0;
  const kulak = hargaKulak || 0;

  const dpp = jual / 1.11;
  const ppn = jual - dpp;
  const laba = dpp - kulak;

  return {
    dpp: parseFloat(dpp.toFixed(2)),
    ppn: parseFloat(ppn.toFixed(2)),
    laba: parseFloat(laba.toFixed(2))
  };
};