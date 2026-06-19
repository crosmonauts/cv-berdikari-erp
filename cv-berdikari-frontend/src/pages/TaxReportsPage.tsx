import { useState, useEffect } from 'react';
import { getTaxReports } from '@/modules/tax-reports/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2 } from 'lucide-react';

export default function TaxReportsPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await getTaxReports();
      setData(Array.isArray(res) ? res : (res as any).data ?? []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Laporan Pajak (PPN)</h1>
        <p className="text-sm text-muted-foreground mt-1">Rekapitulasi PPN masukan dan keluaran</p>
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.taxFakturNum || '-'}</TableCell>
                    <TableCell>{item.dpp?.toLocaleString() || '-'}</TableCell>
                    <TableCell>{item.taxAmount?.toLocaleString() || '-'}</TableCell>
                    <TableCell>{item.status || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
