import { useState, useEffect } from 'react';
import { getTaxReports } from '@/modules/tax-reports/api';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, FileDown } from 'lucide-react';

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function TaxReportsPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(String(new Date().getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));

  const fetchData = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await getTaxReports();
      setData(res);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleDownloadPdf = async (id: string) => {
    const res = await api.get(`/tax-reports/${id}/pdf`, { responseType: 'blob' });
    downloadBlob(res.data, `Faktur_${id}.pdf`);
  };

  const handleDownloadXml = async (id: string) => {
    const res = await api.get(`/tax-reports/${id}/xml`, { responseType: 'blob' });
    downloadBlob(res.data, `Faktur_${id}.xml`);
  };

  const handleBundlePo = async (orderId: string) => {
    const res = await api.get(`/tax-reports/bundle/po/${orderId}`, { responseType: 'blob' });
    downloadBlob(res.data, `Bundle_PO_${orderId}.zip`);
  };

  const handleBundleMonth = async () => {
    const res = await api.get(`/tax-reports/bundle/month?year=${selectedYear}&month=${selectedMonth}`, { responseType: 'blob' });
    downloadBlob(res.data, `Bundle_Bulan_${selectedYear}${String(selectedMonth).padStart(2, '0')}.zip`);
  };

  const handleExportCsv = async () => {
    const res = await api.get(`/tax-reports/bundle/month?year=${selectedYear}&month=${selectedMonth}`, { responseType: 'blob', params: { format: 'csv' } });
    const blob = res.data instanceof Blob ? res.data : new Blob([res.data], { type: 'text/csv' });
    downloadBlob(blob, `Rekap_${selectedYear}${String(selectedMonth).padStart(2, '0')}.csv`);
  };

  const handleExportXml = async () => {
    const res = await api.get(`/tax-reports/bundle/month?year=${selectedYear}&month=${selectedMonth}`, { responseType: 'blob', params: { format: 'xml' } });
    const blob = res.data instanceof Blob ? res.data : new Blob([res.data], { type: 'application/xml' });
    downloadBlob(blob, `Rekap_${selectedYear}${String(selectedMonth).padStart(2, '0')}.xml`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-sm text-muted-foreground">Gagal memuat laporan pajak</p>
        <button onClick={fetchData} className="text-sm text-primary hover:underline">Coba Lagi</button>
      </div>
    );
  }

  const months = [
    { val: '1', label: 'Januari' }, { val: '2', label: 'Februari' }, { val: '3', label: 'Maret' }, { val: '4', label: 'April' },
    { val: '5', label: 'Mei' }, { val: '6', label: 'Juni' }, { val: '7', label: 'Juli' }, { val: '8', label: 'Agustus' },
    { val: '9', label: 'September' }, { val: '10', label: 'Oktober' }, { val: '11', label: 'November' }, { val: '12', label: 'Desember' },
  ];
  const currentYear = new Date().getFullYear();
  const years = [String(currentYear), String(currentYear - 1), String(currentYear - 2)];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Laporan Pajak (PPN)</h1>
          <p className="text-sm text-muted-foreground mt-1">Rekapitulasi PPN masukan dan keluaran</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[140px] h-8"><SelectValue placeholder="Bulan" /></SelectTrigger>
            <SelectContent>{months.map((m) => (<SelectItem key={m.val} value={m.val}>{m.label}</SelectItem>))}</SelectContent>
          </Select>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[100px] h-8"><SelectValue placeholder="Tahun" /></SelectTrigger>
            <SelectContent>{years.map((y) => (<SelectItem key={y} value={y}>{y}</SelectItem>))}</SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleExportCsv}><FileDown className="h-4 w-4" />Export CSV</Button>
          <Button variant="outline" size="sm" onClick={handleExportXml}><FileDown className="h-4 w-4" />Export XML</Button>
          <Button variant="default" size="sm" onClick={handleBundleMonth}><FileDown className="h-4 w-4" />ZIP Bulan</Button>
        </div>
      </div>
      <Card>
        <CardHeader><CardTitle>Data Pajak</CardTitle></CardHeader>
        <CardContent>
          {data.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada data pajak</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No. Faktur</TableHead>
                  <TableHead>DPP</TableHead>
                  <TableHead>PPN</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item: any) => {
                  const orderId = item.invoice?.order?.id ?? item.invoice?.orderId ?? item.orderId ?? item.invoiceId;
                  return (
                    <TableRow key={item.id}>
                      <TableCell>{item.taxFakturNum || '-'}</TableCell>
                      <TableCell>{item.dpp?.toLocaleString() || '-'}</TableCell>
                      <TableCell>{item.taxAmount?.toLocaleString() || '-'}</TableCell>
                      <TableCell>{item.status || '-'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="outline" size="xs" onClick={() => handleDownloadPdf(item.id)}><FileDown className="h-3 w-3" />PDF</Button>
                          <Button variant="outline" size="xs" onClick={() => handleDownloadXml(item.id)}><FileDown className="h-3 w-3" />XML</Button>
                          <Button variant="outline" size="xs" onClick={() => handleBundlePo(orderId)} disabled={!orderId}><FileDown className="h-3 w-3" />ZIP PO</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
