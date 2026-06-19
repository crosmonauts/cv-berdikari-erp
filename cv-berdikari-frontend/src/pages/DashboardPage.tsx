import { useEffect, useState, useCallback } from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  Wallet,
  TrendingUp,
  Database,
  ClipboardList,
  Store,
  Package,
  Percent,
  ChevronRight,
  Inbox,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getDashboardStats } from '@/modules/dashboard/api';
import { PageHeader } from '@/components/shared/page-header';
import { MetricCardSkeleton } from '@/components/shared/skeleton';
import type { DashboardStats } from '@/modules/dashboard/types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Link } from 'react-router-dom';

function formatRupiah(value: number) {
  return `Rp ${value.toLocaleString('id-ID')}`;
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'PENDING': return 'bg-amber-50 text-amber-700 ring-amber-100';
    case 'DIPROSES': return 'bg-violet-50 text-violet-700 ring-violet-100';
    case 'PROSES_KIRIM': return 'bg-blue-50 text-blue-700 ring-blue-100';
    case 'DIKIRIM': return 'bg-indigo-50 text-indigo-700 ring-indigo-100';
    case 'SELESAI': return 'bg-emerald-50 text-emerald-700 ring-emerald-100';
    case 'BATAL': return 'bg-rose-50 text-rose-700 ring-rose-100';
    default: return 'bg-muted text-foreground ring-border';
  }
}

function getPaymentColor(status: string | undefined): string {
  switch (status) {
    case 'PAID': return 'bg-emerald-50 text-emerald-700 ring-emerald-200';
    case 'PARTIAL': return 'bg-brand-50 text-brand-900 ring-brand-200';
    default: return 'bg-muted text-muted-foreground ring-border';
  }
}

const chartColors = [
  'hsl(var(--primary))',
  'hsl(var(--warning))',
  'hsl(var(--success))',
];

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const fetchStats = useCallback(async () => {
    setIsError(false);
    setIsLoading(true);
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('Gagal mengambil data dashboard:', error);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="h-14 w-14 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
          <AlertTriangle className="h-7 w-7 text-destructive" />
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-2">Gagal Memuat Dashboard</h2>
        <p className="text-sm text-muted-foreground max-w-md mb-6">
          Tidak dapat memuat data dashboard. Periksa koneksi server atau coba lagi.
        </p>
        <Button onClick={() => { setIsError(false); setIsLoading(true); fetchStats(); }} className="gap-2">
          <RefreshCw className="h-4 w-4" /> Coba Lagi
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-full space-y-6">
        <div className="h-10 w-64 rounded-lg bg-muted/70 animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <MetricCardSkeleton key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 h-80 rounded-xl bg-white ring-1 ring-border animate-pulse" />
          <div className="h-80 rounded-xl bg-white ring-1 ring-border animate-pulse" />
        </div>
      </div>
    );
  }

  const chartData = [
    { name: 'Omzet Netto', value: stats?.totalNetRevenue || 0, color: chartColors[0] },
    { name: 'Beban Kulakan', value: stats?.totalCOGS || 0, color: chartColors[1] },
    { name: 'Laba Bersih', value: stats?.totalProfit || 0, color: chartColors[2] },
  ];

  const marginPercentage =
    stats?.totalNetRevenue && stats?.totalNetRevenue > 0
      ? ((stats.totalProfit / stats.totalNetRevenue) * 100).toFixed(1)
      : '0.0';

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(Number(marginPercentage) / 100, 1);
  const strokeDashoffset = circumference * (1 - progress);

  const metrics = [
    {
      label: 'Nilai Aset',
      value: formatRupiah(stats?.totalInventoryValue || 0),
      icon: Database,
      gradient: 'from-brand-600 to-brand-500',
    },
    {
      label: 'Penjualan Netto',
      value: formatRupiah(stats?.totalNetRevenue || 0),
      icon: ShoppingBag,
      gradient: 'from-emerald-600 to-emerald-500',
    },
    {
      label: 'Beban Kulakan (HPP)',
      value: formatRupiah(stats?.totalCOGS || 0),
      icon: Wallet,
      gradient: 'from-amber-600 to-amber-500',
    },
    {
      label: 'Profit Bersih',
      value: formatRupiah(stats?.totalProfit || 0),
      icon: TrendingUp,
      gradient: 'from-emerald-600 to-emerald-500',
    },
  ];

  return (
    <div className="min-h-full space-y-6">
      <PageHeader
        icon={LayoutDashboard}
        title="Beranda Utama"
        subtitle="Executive Dashboard"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, i) => (
          <div
            key={i}
            className="relative bg-white rounded-xl shadow-sm ring-1 ring-border overflow-hidden group hover:shadow-md transition-all"
          >
            <div className={`h-1 w-full bg-gradient-to-r ${metric.gradient}`} />
            <div className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={`h-9 w-9 rounded-lg bg-gradient-to-br ${metric.gradient} flex items-center justify-center text-white shadow-sm`}>
                  <metric.icon className="h-5 w-5" />
                </div>
              </div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                {metric.label}
              </p>
              <p className="text-lg font-bold text-foreground font-mono tracking-tight">
                {metric.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm ring-1 ring-border p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                Grafik Keuangan
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Omzet Bersih vs Beban Kulakan vs Laba Bersih
              </p>
            </div>
          </div>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fontWeight: 600, fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis hide />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--muted))' }}
                  formatter={(value: any) =>
                    `Rp ${Number(value).toLocaleString('id-ID')}`
                  }
                  contentStyle={{
                    borderRadius: '10px',
                    border: '1px solid hsl(var(--border))',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    fontSize: '12px',
                    fontWeight: 600,
                    background: 'hsl(var(--card))',
                  }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={64}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center mb-6">
                <div className="relative flex items-center justify-center">
                  <svg width="140" height="140" className="-rotate-90">
                    <circle
                      cx="70" cy="70" r={radius}
                      fill="none" stroke="hsl(var(--border))" strokeWidth="10"
                    />
                    <circle
                      cx="70" cy="70" r={radius}
                      fill="none" stroke="hsl(var(--success))" strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <Percent className="h-5 w-5 text-emerald-600" />
                    <span className="text-2xl font-bold text-foreground font-mono">
                      {marginPercentage}%
                    </span>
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Margin
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Ringkasan Operasional
                </h3>
                <div className="space-y-2.5">
                  {[
                    { label: 'Pesanan Aktif', value: stats?.activeOrdersCount || 0, icon: ClipboardList, bg: 'bg-brand-50 text-brand-700' },
                    { label: 'Cabang Klien', value: stats?.branchCount || 0, icon: Store, bg: 'bg-warning/10 text-warning' },
                    { label: 'Katalog Produk', value: stats?.productCount || 0, icon: Package, bg: 'bg-brand-50 text-brand-700' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-1.5">
                      <div className="flex items-center gap-2.5">
                        <div className={`h-7 w-7 rounded-lg ${item.bg} flex items-center justify-center`}>
                          <item.icon className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-xs font-semibold text-muted-foreground">
                          {item.label}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-foreground font-mono">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between border-b pb-4">
          <CardTitle className="text-sm font-semibold">
            Pesanan Terbaru
          </CardTitle>
          <Link
            to="/orders"
            className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1"
          >
            Lihat Semua <ChevronRight className="h-3 w-3" />
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {stats?.recentOrders && stats.recentOrders.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No. PO</TableHead>
                  <TableHead>Cabang</TableHead>
                  <TableHead className="text-right">Nilai PO</TableHead>
                  <TableHead className="text-right">Ongkir</TableHead>
                  <TableHead className="text-right">Total Bersih</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Pembayaran</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.recentOrders.slice(0, 5).map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-xs font-semibold">
                      {order.poNumber}
                    </TableCell>
                    <TableCell className="text-sm">
                      {order.branch?.name || '-'}
                    </TableCell>
                    <TableCell className="font-mono text-sm font-bold text-right">
                      {formatRupiah(Number(order.totalAmount) || 0)}
                    </TableCell>
                    <TableCell className="font-mono text-sm font-medium text-right">
                      {formatRupiah(Number(order.shipment?.shippingCost) || 0)}
                    </TableCell>
                    <TableCell className="font-mono text-sm font-bold text-emerald-600 text-right">
                      {formatRupiah(Math.max(0, (Number(order.totalAmount) || 0) - (Number(order.shipment?.shippingCost) || 0)))}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold leading-5 ring-1 ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold leading-5 ring-1 ${getPaymentColor(order.paymentStatus)}`}>
                        {order.paymentStatus}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Inbox className="h-12 w-12 text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">
                Belum ada pesanan
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Pesanan akan muncul di sini setelah dibuat
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
