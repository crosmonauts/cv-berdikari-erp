import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Store,
  ClipboardList,
  TrendingUp,
  ArrowUpRight,
  Activity,
  Wallet,
  ShoppingBag,
  Percent,
  Database,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getDashboardStats } from '@/modules/dashboard/api';
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

export default function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getDashboardStats();
        setStats(data);
      } catch (error) {
        console.error('Gagal mengambil data dashboard:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (isLoading)
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center">
            Sinkronisasi Keuangan...
          </p>
        </div>
      </div>
    );

  // Data untuk Diagram Batang
  const chartData = [
    {
      name: 'Omzet Netto',
      value: stats?.totalNetRevenue || 0,
      color: '#6366f1',
    },
    { name: 'Total Kulakan', value: stats?.totalCOGS || 0, color: '#f59e0b' },
    { name: 'Laba Bersih', value: stats?.totalProfit || 0, color: '#10b981' },
  ];

  // 4 KARTU KEUANGAN UTAMA
  const financialCards = [
    {
      title: 'Nilai Aset (Modal)',
      value: `Rp ${(stats?.totalInventoryValue || 0).toLocaleString('id-ID')}`,
      subtitle: 'Total stok fisik di gudang',
      icon: Database,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-l-blue-500',
    },
    {
      title: 'Penjualan Netto',
      value: `Rp ${(stats?.totalNetRevenue || 0).toLocaleString('id-ID')}`,
      subtitle: 'Omzet tanpa PPN 11%',
      icon: ShoppingBag,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      border: 'border-l-indigo-500',
    },
    {
      title: 'Beban Kulakan (HPP)',
      value: `Rp ${(stats?.totalCOGS || 0).toLocaleString('id-ID')}`,
      subtitle: 'Modal dari barang terjual',
      icon: Wallet,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-l-amber-500',
    },
    {
      title: 'Laba Bersih (Profit)',
      value: `Rp ${(stats?.totalProfit || 0).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtitle: 'Keuntungan riil perusahaan',
      icon: TrendingUp,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-l-emerald-500',
    },
  ];

  const marginPercentage =
    stats?.totalNetRevenue > 0
      ? ((stats.totalProfit / stats.totalNetRevenue) * 100).toFixed(1)
      : 0;

  return (
    <div className="min-h-screen bg-slate-300 px-2 pt-1 pb-10 space-y-4 font-sans text-slate-900">
      {/* HEADER */}
      <div className="max-w-6xl mx-auto flex items-center gap-3">
        <div className="h-10 w-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-indigo-600 ring-1 ring-slate-200">
          <LayoutDashboard className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Beranda Utama</h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.1em]">
            Executive Dashboard CV Berdikari
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto space-y-4">
        {/* ROW 1: STATS KEUANGAN */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {financialCards.map((stat, i) => (
            <Card
              key={i}
              className={`border-none shadow-sm ring-1 ring-slate-200 rounded-xl overflow-hidden border-l-4 ${stat.border}`}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {stat.title}
                  </p>
                  <div
                    className={`h-8 w-8 ${stat.bg} ${stat.color} rounded-lg flex items-center justify-center shrink-0`}
                  >
                    <stat.icon className="h-4 w-4" />
                  </div>
                </div>
                <h3 className="text-xl font-bold tracking-tight text-slate-800 mb-1">
                  {stat.value}
                </h3>
                <p className="text-[9px] text-slate-400 font-medium">
                  {stat.subtitle}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ROW 2: CHART & OPERASIONAL */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* KIRI: DIAGRAM BATANG */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tight">
                  Grafik Keuangan (Netto)
                </h2>
                <p className="text-[9px] text-slate-400 font-bold uppercase">
                  Omzet Bersih vs Modal Terjual vs Laba
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
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }}
                  />
                  <YAxis hide />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    formatter={(value: any) =>
                      `Rp ${Number(value).toLocaleString('id-ID')}`
                    }
                    contentStyle={{
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                      fontSize: '12px',
                      fontWeight: 'bold',
                    }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={60}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* KANAN: MARGIN & RINGKASAN OPERASIONAL */}
          <div className="space-y-4">
            <Card className="border-none shadow-sm ring-1 ring-slate-200 rounded-xl bg-slate-50/50 h-full">
              <CardContent className="p-6 space-y-6">
                {/* Indikator Margin Laba */}
                <div className="bg-white p-4 rounded-xl ring-1 ring-slate-200 shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                      <Percent className="h-3 w-3" /> Margin Laba
                    </span>
                    <span className="text-sm font-black text-emerald-600">
                      +{marginPercentage}%
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-1000"
                      style={{ width: `${marginPercentage}%` }}
                    ></div>
                  </div>
                </div>

                {/* Info Operasional */}
                <div className="space-y-4 pt-2">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2">
                    Ringkasan Operasional
                  </h3>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
                        <ClipboardList className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-600">
                        Pesanan Aktif
                      </span>
                    </div>
                    <span className="text-sm font-black text-slate-900">
                      {stats?.activeOrdersCount || 0}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center shadow-sm">
                        <Store className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-600">
                        Cabang Klien
                      </span>
                    </div>
                    <span className="text-sm font-black text-slate-900">
                      {stats?.branchCount || 0}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center shadow-sm">
                        <Package className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-600">
                        Katalog Produk
                      </span>
                    </div>
                    <span className="text-sm font-black text-slate-900">
                      {stats?.productCount || 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ROW 3: TABEL TRANSAKSI TERBARU FULL WIDTH */}
        <div className="bg-white rounded-xl shadow-sm ring-1 ring-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-slate-400" />
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tight">
                5 Aktivitas Terbaru
              </h2>
            </div>
            <button
              onClick={() => navigate('/orders')}
              className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors"
            >
              LIHAT SEMUA <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="pl-6 py-3 text-[9px] font-bold uppercase text-slate-400">
                  Nomor PO
                </TableHead>
                <TableHead className="py-3 text-[9px] font-bold uppercase text-slate-400">
                  Cabang
                </TableHead>
                <TableHead className="py-3 text-[9px] font-bold uppercase text-slate-400 text-right">
                  Nilai
                </TableHead>
                <TableHead className="py-3 text-[9px] font-bold uppercase text-slate-400 text-right">
                  Ongkir
                </TableHead>
                <TableHead className="py-3 text-[9px] font-bold uppercase text-slate-400 text-right">
                  Laba Riil
                </TableHead>
                {/* PENAMBAHAN HEADER PEMBAYARAN */}
                <TableHead className="py-3 text-[9px] font-bold uppercase text-slate-400 text-center">
                  Pembayaran
                </TableHead>
                <TableHead className="pr-6 py-3 text-[9px] font-bold uppercase text-slate-400 text-center">
                  Status PO
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!stats?.recentOrders || stats?.recentOrders?.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7} // UPDATE: Menjadi 7 kolom
                    className="text-center py-10 text-xs font-medium text-slate-400 italic bg-white"
                  >
                    Belum ada aktivitas pesanan.
                  </TableCell>
                </TableRow>
              ) : (
                stats.recentOrders.map((order: any) => {
                  const shipment = order.shipment || null;
                  const ongkir = Number(shipment?.shippingCost || 0);
                  const biayaLain = Number(shipment?.otherFees || 0);
                  const totalOngkir = ongkir + biayaLain;

                  const hpp =
                    order.items?.reduce(
                      (acc: number, item: any) =>
                        acc + item.costPriceAtBuy * item.quantity,
                      0,
                    ) || 0;

                  const dpp = order.totalAmount / 1.11;
                  const labaBersih = dpp - hpp - totalOngkir;

                  return (
                    <TableRow
                      key={order.id}
                      className="hover:bg-slate-50/50 border-b border-slate-50 last:border-none"
                    >
                      <TableCell className="pl-6 py-3 font-bold text-indigo-600 text-[10px] uppercase tracking-tight">
                        {order.poNumber}
                      </TableCell>
                      <TableCell className="py-3 font-semibold text-slate-600 text-xs">
                        {order.branch?.name || '-'}
                      </TableCell>

                      <TableCell className="py-3 text-right">
                        <div className="font-bold text-slate-900 text-xs">
                          Rp {order.totalAmount.toLocaleString('id-ID')}
                        </div>
                      </TableCell>

                      <TableCell className="py-3 text-right">
                        {totalOngkir > 0 ? (
                          <div
                            className="font-bold text-rose-500 text-xs"
                            title="Potongan Ongkir & Biaya Lain"
                          >
                            - Rp {totalOngkir.toLocaleString('id-ID')}
                          </div>
                        ) : (
                          <span className="text-slate-300 font-medium italic">
                            -
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="py-3 text-right">
                        <div className="font-bold text-emerald-600 text-xs">
                          Rp{' '}
                          {labaBersih.toLocaleString('id-ID', {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 2,
                          })}
                        </div>
                        <div className="text-[8px] text-slate-400 uppercase font-bold tracking-widest mt-0.5">
                          Net Profit
                        </div>
                      </TableCell>

                      {/* PENAMBAHAN CELL PEMBAYARAN */}
                      <TableCell className="py-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[8px] font-bold uppercase ring-1 ${
                            order.paymentStatus === 'LUNAS'
                              ? 'bg-blue-50 text-blue-700 ring-blue-100'
                              : order.paymentStatus === 'SEBAGIAN'
                                ? 'bg-purple-50 text-purple-700 ring-purple-100'
                                : 'bg-slate-100 text-slate-600 ring-slate-200'
                          }`}
                        >
                          {order.paymentStatus || 'BELUM'}
                        </span>
                      </TableCell>

                      <TableCell className="pr-6 py-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[8px] font-bold uppercase ring-1 ${
                            order.status === 'SELESAI' ||
                            order.status === 'DIKIRIM'
                              ? 'bg-emerald-50 text-emerald-700 ring-emerald-100'
                              : 'bg-amber-50 text-amber-700 ring-amber-100'
                          }`}
                        >
                          {order.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
