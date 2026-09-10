import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getPpnRate, setPpnRate } from '@/modules/system-config/api';
import { getNsfpPool, createNsfpPool } from '@/modules/nsfp-pool/api';
import { toast } from 'sonner';
import { Loader2, Settings, Hash, Save, Plus } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';

export default function SystemConfigPage() {
  const { role } = useUserRole();
  const isSuperAdmin = role === 'SUPERADMIN';

  const [rate, setRate] = useState<number>(0.11);
  const [rateInput, setRateInput] = useState<string>('0.11');
  const [loadingRate, setLoadingRate] = useState(true);
  const [savingRate, setSavingRate] = useState(false);

  const [pools, setPools] = useState<any[]>([]);
  const [loadingPool, setLoadingPool] = useState(true);
  const [creatingPool, setCreatingPool] = useState(false);
  const [nsfpForm, setNsfpForm] = useState({ startNum: '', endNum: '', year: new Date().getFullYear(), prefix: '010.009' });

  const fetchPpn = async () => {
    setLoadingRate(true);
    try {
      const res = await getPpnRate();
      const val = res.data?.rate ?? res.data?.data?.rate ?? res.data?.value ?? 0.11;
      const num = typeof val === 'string' ? parseFloat(val) : Number(val);
      setRate(num);
      setRateInput(String(num));
    } catch {
      toast.error('Gagal memuat PPN rate');
    } finally {
      setLoadingRate(false);
    }
  };

  const fetchPools = async () => {
    setLoadingPool(true);
    try {
      const res = await getNsfpPool();
      const data = res.data?.data ?? res.data ?? [];
      setPools(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Gagal memuat NSFP pool');
    } finally {
      setLoadingPool(false);
    }
  };

  useEffect(() => {
    fetchPpn();
    fetchPools();
  }, []);

  const handleSavePpn = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(rateInput);
    if (isNaN(parsed) || parsed < 0 || parsed > 1) {
      toast.error('Rate harus antara 0 dan 1 (contoh: 0.11 untuk 11%)');
      return;
    }
    setSavingRate(true);
    try {
      await setPpnRate(parsed);
      setRate(parsed);
      toast.success('PPN rate berhasil disimpan');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menyimpan PPN rate');
    } finally {
      setSavingRate(false);
    }
  };

  const handleCreatePool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nsfpForm.startNum || !nsfpForm.endNum || !nsfpForm.year) {
      toast.error('Lengkapi startNum, endNum, dan tahun');
      return;
    }
    setCreatingPool(true);
    try {
      await createNsfpPool({
        startNum: nsfpForm.startNum.replace(/\D/g, ''),
        endNum: nsfpForm.endNum.replace(/\D/g, ''),
        year: Number(nsfpForm.year),
        prefix: nsfpForm.prefix,
      });
      toast.success('NSFP pool berhasil dibuat');
      setNsfpForm({ startNum: '', endNum: '', year: new Date().getFullYear(), prefix: '010.009' });
      fetchPools();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal membuat NSFP pool');
    } finally {
      setCreatingPool(false);
    }
  };

  const formatRemaining = (pool: any) => {
    try {
      const cur = BigInt(String(pool.current).replace(/\D/g, ''));
      const end = BigInt(String(pool.endNum).replace(/\D/g, ''));
      if (end < cur) return 0;
      return Number(end - cur + 1n);
    } catch {
      return '-';
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2">
        <p className="text-sm text-muted-foreground">Hanya SUPERADMIN yang dapat mengakses pengaturan pajak</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="h-6 w-6" /> Pengaturan Pajak
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Kelola tarif PPN dan stok NSFP e-Nofa (17 digit)</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">PPN Rate</CardTitle>
            <CardDescription>Tarif PPN configurable (snapshot disimpan per faktur). Contoh: 0.11 = 11%</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingRate ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Memuat...
              </div>
            ) : (
              <form onSubmit={handleSavePpn} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="ppn-rate" className="text-xs font-semibold uppercase">Rate (0 - 1)</Label>
                  <Input
                    id="ppn-rate"
                    type="number"
                    step="0.01"
                    min={0}
                    max={1}
                    value={rateInput}
                    onChange={(e) => setRateInput(e.target.value)}
                    placeholder="0.11"
                    className="h-9"
                  />
                  <p className="text-xs text-muted-foreground">Nilai aktif: {rate} ({(rate * 100).toFixed(0)}%)</p>
                </div>
                <Button type="submit" disabled={savingRate} className="w-full gap-2">
                  {savingRate ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Simpan PPN
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Hash className="h-4 w-4" /> Tambah NSFP Pool</CardTitle>
            <CardDescription>Input stok NSFP dari e-Nofa (16 digit tanpa titik, akan diformat 17 digit Coretax)</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreatePool} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase">Tahun</Label>
                  <Input
                    type="number"
                    value={nsfpForm.year}
                    onChange={(e) => setNsfpForm({ ...nsfpForm, year: Number(e.target.value) })}
                    placeholder="2025"
                    className="h-9"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase">Prefix</Label>
                  <Input
                    value={nsfpForm.prefix}
                    onChange={(e) => setNsfpForm({ ...nsfpForm, prefix: e.target.value })}
                    placeholder="010.009"
                    className="h-9"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase">Start Num</Label>
                <Input
                  value={nsfpForm.startNum}
                  onChange={(e) => setNsfpForm({ ...nsfpForm, startNum: e.target.value })}
                  placeholder="0100092500000001"
                  className="h-9 font-mono"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase">End Num</Label>
                <Input
                  value={nsfpForm.endNum}
                  onChange={(e) => setNsfpForm({ ...nsfpForm, endNum: e.target.value })}
                  placeholder="0100092500001000"
                  className="h-9 font-mono"
                  required
                />
              </div>
              <Button type="submit" disabled={creatingPool} className="w-full gap-2">
                {creatingPool ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Buat Pool
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Stok NSFP</CardTitle>
          <CardDescription>Nomor tersedia dan sisa per pool. Format tampil: 010.009-25.00000001 (17 digit)</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingPool ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Memuat pool...
            </div>
          ) : pools.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada pool NSFP. Tambahkan di form atas.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tahun</TableHead>
                    <TableHead>Prefix</TableHead>
                    <TableHead>Current</TableHead>
                    <TableHead>Range</TableHead>
                    <TableHead>Sisa</TableHead>
                    <TableHead>Dibuat</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pools.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell>{p.year}</TableCell>
                      <TableCell className="font-mono text-xs">{p.prefix}</TableCell>
                      <TableCell className="font-mono text-xs">{p.current}</TableCell>
                      <TableCell className="font-mono text-xs">{p.startNum} - {p.endNum}</TableCell>
                      <TableCell>{formatRemaining(p)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{p.createdAt ? new Date(p.createdAt).toLocaleDateString('id-ID') : '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
