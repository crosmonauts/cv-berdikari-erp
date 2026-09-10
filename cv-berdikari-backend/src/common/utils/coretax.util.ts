export function formatNsfp(raw: string): string {
  const d = raw.replace(/\D/g, '').padStart(16, '0');
  if (d.length === 16) {
    return `${d.slice(0, 3)}.${d.slice(3, 6)}-${d.slice(6, 8)}.${d.slice(8)}`;
  }
  const with9 = d.slice(0, 4) + '9' + d.slice(4);
  return `${with9.slice(0, 3)}.${with9.slice(3, 6)}-${with9.slice(6, 8)}.${with9.slice(8)}`;
}

export function nextRaw(current: string): string {
  return String(BigInt(current.replace(/\D/g, '')) + 1n).padStart(16, '0');
}

export function calculateDppPpn(totalGross: number, rate: number) {
  const dpp = totalGross / (1 + rate);
  const ppn = totalGross - dpp;
  return { dpp: parseFloat(dpp.toFixed(2)), ppn: parseFloat(ppn.toFixed(2)) };
}

export function generateFakturXml(data: { taxFakturNum: string; issuedDate: Date | string; npwp: string; dpp: number; ppn: number }): string {
  const tanggal = data.issuedDate instanceof Date ? data.issuedDate.toISOString() : new Date(data.issuedDate).toISOString();
  return `<Faktur><Nomor>${data.taxFakturNum}</Nomor><Tanggal>${tanggal}</Tanggal><NPWP>${data.npwp ?? ''}</NPWP><DPP>${data.dpp}</DPP><PPN>${data.ppn}</PPN></Faktur>`;
}
