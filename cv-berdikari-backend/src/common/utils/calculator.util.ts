export const getPpnRate = (): number => {
  return parseFloat(process.env.PPN_RATE || '0.11');
};

export function calculateFinancials(hargaJual: number, hargaKulak: number) {
  const ppnRate = getPpnRate();
  const dpp = hargaJual / (1 + ppnRate);
  const ppn = hargaJual - dpp;
  const grossProfit = dpp - hargaKulak;

  return {
    dpp: parseFloat(dpp.toFixed(2)),
    ppn: parseFloat(ppn.toFixed(2)),
    grossProfit: parseFloat(grossProfit.toFixed(2)),
  };
}