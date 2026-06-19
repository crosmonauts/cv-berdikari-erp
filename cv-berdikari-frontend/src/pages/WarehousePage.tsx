import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  PackageOpen,
  Search,
  ScanBarcode,
  Barcode,
  PackageCheck,
  FileText,
  ChevronLeft,
  ChevronRight,
  Box,
  ScanLine,
  CircleDot,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Undo2,
} from 'lucide-react';
import { getOrders, updateOrderStatus } from '@/modules/orders/api';
import { getOrderItems, scanOrderItemBarcode, revertScanOrderItem } from '@/modules/order-items/api';
import type { Order } from '@/modules/orders/types';
import type { OrderItem } from '@/modules/order-items/types';
import { toast } from 'sonner';

export default function WarehousePage() {
  const API_URL = import.meta.env.VITE_API_URL;

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [orderItemsMap, setOrderItemsMap] = useState<Record<string, OrderItem[]>>({});

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewOrder, setPreviewOrder] = useState<Order | null>(null);

  const [barcodeInput, setBarcodeInput] = useState('');
  const [scanQty, setScanQty] = useState<number>(1);
  const [isScanningStatus, setIsScanningStatus] = useState(false);
  const [isReverting, setIsReverting] = useState(false);
  const [lastScannedItemId, setLastScannedItemId] = useState<number | null>(null);
  const [highlightedItemId, setHighlightedItemId] = useState<number | null>(null);
  const [isCompleteConfirmOpen, setIsCompleteConfirmOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchOrders = async () => {
    setIsError(false);
    try {
      const data = await getOrders();
      setOrders(
        data.filter((o) => o.status === 'PENDING' || o.status === 'DIPROSES'),
      );
    } catch (error) {
      console.error('Gagal mengambil data pesanan:', error);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const fetchOrderItems = async (orderId: string) => {
    try {
      const items = await getOrderItems(orderId);
      setOrderItems(items);
      setOrderItemsMap((prev) => ({ ...prev, [orderId]: items }));
      return items;
    } catch (error) {
      console.error('Gagal mengambil detail barang:', error);
      return [];
    }
  };

  const handleSelectOrder = async (order: Order) => {
    setSelectedOrder(order);
    setScanQty(1);
    setBarcodeInput('');
    setIsScanningStatus(false);
    await fetchOrderItems(order.id);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 200);
  };

  const handlePreviewPDF = (order: Order) => {
    setPreviewOrder(order);
    setIsPreviewOpen(true);
  };

  const handleScanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !barcodeInput.trim()) return;

    const qtyToProcess = Number(scanQty) || 1;
    setIsScanningStatus(true);

    try {
      const result = await scanOrderItemBarcode(
        selectedOrder.id,
        barcodeInput,
        qtyToProcess,
      );
      const productName = result?.product?.name || 'Barang';
      toast.success(`${productName} — berhasil di-scan (${qtyToProcess})`);
      const scannedId = result?.id ?? null;
      setLastScannedItemId(scannedId);
      setHighlightedItemId(scannedId);
      setTimeout(() => setHighlightedItemId(null), 2000);
      await fetchOrderItems(selectedOrder.id);
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        error.message ||
        'Gagal memproses scan';
      toast.error(msg);
    } finally {
      setBarcodeInput('');
      setScanQty(1);
      setIsScanningStatus(false);
      inputRef.current?.focus();
    }
  };

  const handleUndoScan = async (item: OrderItem) => {
    if (!selectedOrder || isReverting) return;
    setIsReverting(true);
    try {
      await revertScanOrderItem(
        selectedOrder.id,
        String(item.productId),
        1,
      );
      toast.info(`Scan ${item.product?.name || 'barang'} dibatalkan (1)`);
      setLastScannedItemId(null);
      await fetchOrderItems(selectedOrder.id);
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        error.message ||
        'Gagal membatalkan scan';
      toast.error(msg);
    } finally {
      setIsReverting(false);
    }
  };

  const handleCompletePicking = async () => {
    if (!selectedOrder) return;
    setIsCompleteConfirmOpen(false);
    try {
      await updateOrderStatus(selectedOrder.id, 'SELESAI');
      toast.success('Status pesanan diubah ke SELESAI');
      setSelectedOrder(null);
      setOrderItems([]);
      setLastScannedItemId(null);
      await fetchOrders();
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        error.message ||
        'Gagal mengubah status';
      toast.error(msg);
    }
  };

  const filteredOrders = orders.filter(
    (o) =>
      o.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o as any).branch?.name?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const getOrderProgress = (orderId: string) => {
    const items = orderItemsMap[orderId];
    if (!items || items.length === 0) return { total: 0, scanned: 0, percentage: 0 };
    const total = items.reduce((sum, i) => sum + i.quantity, 0);
    const scanned = items.reduce((sum, i) => sum + (i.scannedQty || 0), 0);
    return {
      total,
      scanned,
      percentage: total > 0 ? Math.round((scanned / total) * 100) : 0,
    };
  };

  const getStatusIcon = (orderId: string, status: string) => {
    const { percentage } = getOrderProgress(orderId);
    if (percentage >= 100)
      return <PackageCheck className="h-4 w-4 text-success" aria-label="Selesai" />;
    if (status === 'DIPROSES' || percentage > 0)
      return <Loader2 className="h-4 w-4 text-warning animate-spin" aria-label="Sedang diproses" />;
    return <CircleDot className="h-4 w-4 text-slate-500" aria-label="Menunggu" />;
  };

  if (isError) {
    return (
      <div className="min-h-full px-4 py-6 flex flex-col items-center justify-center text-center">
        <div className="h-14 w-14 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4">
          <AlertTriangle className="h-7 w-7 text-red-400" />
        </div>
        <h2 className="text-lg font-semibold text-white mb-2">Gagal Memuat Gudang</h2>
        <p className="text-sm text-slate-400 max-w-md mb-6">
          Tidak dapat memuat data antrean gudang. Periksa koneksi server atau coba lagi.
        </p>
        <button
          onClick={fetchOrders}
          className="h-9 px-5 bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" /> Coba Lagi
        </button>
      </div>
    );
  }

  if (isLoading)
    return (
      <div className="min-h-full px-4 py-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-white/5 animate-pulse" />
          <div className="space-y-2">
            <div className="h-5 w-48 rounded-md bg-white/10 animate-pulse" />
            <div className="h-3 w-36 rounded-md bg-white/5 animate-pulse" />
          </div>
        </div>
        <div className="bg-[#0f172a] rounded-xl ring-1 ring-white/10 p-6">
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 rounded-xl bg-white/5 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );

  return (
    <div className="min-h-full bg-background font-sans">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-brand-50 ring-1 ring-brand-200 flex items-center justify-center">
              <PackageOpen className="h-5 w-5 text-brand-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight">
                Gudang — Stasiun Scan
              </h1>
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider font-mono">
                Manajemen Picking &amp; Pengemasan
              </p>
            </div>
          </div>
        </div>

        {/* DARK PANEL */}
        <div className="bg-[#0f172a] rounded-xl ring-1 ring-white/10 overflow-hidden">
          <div className="flex flex-col lg:flex-row">
            {/* ===== LEFT COLUMN: ANTREAN SCAN ===== */}
            <div className="flex-1 min-w-0 p-6 border-b lg:border-b-0 lg:border-r border-white/5">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Box className="h-4 w-4 text-brand-400" />
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                    Antrean Scan
                  </h2>
                  <span className="text-[10px] font-mono text-slate-500 bg-white/5 px-2 py-0.5 rounded-md">
                    {filteredOrders.length}
                  </span>
                </div>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                  <Input
                    placeholder="Cari PO atau Cabang..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-48 h-9 pl-8 rounded-lg bg-white/10 border border-white/10 text-xs text-slate-200 placeholder:text-slate-500 focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30"
                  />
                </div>
              </div>

              <div className="space-y-2.5">
                {paginatedOrders.length === 0 ? (
                  <div className="text-center py-16">
                    <PackageCheck className="h-10 w-10 text-success/40 mx-auto mb-3" />
                    <p className="text-xs font-medium text-slate-500 italic">
                      Semua barang sudah disiapkan. Antrean kosong.
                    </p>
                  </div>
                ) : (
                  paginatedOrders.map((order) => {
                    const progress = getOrderProgress(order.id);
                    const isSelected = selectedOrder?.id === order.id;
                    return (
                      <button
                        key={order.id}
                        onClick={() => handleSelectOrder(order)}
                        className={`w-full text-left block p-4 rounded-xl border transition-all ${
                          isSelected
                            ? 'bg-brand-600/10 border-brand-500/40 ring-1 ring-brand-500/20'
                            : 'bg-white/5 border-white/10 hover:bg-white/[0.07]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-sm text-white font-mono tracking-tight">
                                {order.poNumber}
                              </span>
                              <span className="text-[10px] text-slate-500 font-medium">
                                {(order as any).branch?.name || 'Cabang Terdaftar'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(order.id, order.status)}
                              {progress.total > 0 ? (
                                <span className="text-[11px] font-mono text-slate-400">
                                  {progress.scanned}/{progress.total} item
                                  {progress.scanned >= progress.total ? (
                                    <span className="text-success ml-1">selesai</span>
                                  ) : (
                                    <span className="text-slate-500 ml-1">tersedia</span>
                                  )}
                                </span>
                              ) : (
                                <span className="text-[11px] font-mono text-slate-500">
                                  {order.status === 'DIPROSES' ? 'Sedang diproses' : 'Menunggu'}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <Button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePreviewPDF(order);
                              }}
                              variant="ghost"
                              className="h-7 w-7 p-0 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5"
                            >
                              <FileText className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectOrder(order);
                              }}
                              className="h-7 px-2.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-bold text-[10px] uppercase gap-1 border-none transition-all active:scale-95"
                            >
                              <ScanBarcode className="h-3 w-3" />
                              Scan
                            </Button>
                          </div>
                        </div>
                        {progress.total > 0 && (
                          <div
                            className="mt-3 h-1.5 bg-white/10 rounded-full overflow-hidden"
                            role="progressbar"
                            aria-valuenow={progress.percentage}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={`Kemajuan: ${progress.scanned} dari ${progress.total} item`}
                          >
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                progress.percentage >= 100
                                  ? 'bg-success'
                                  : 'bg-brand-500'
                              }`}
                              style={{ width: `${progress.percentage}%` }}
                            />
                          </div>
                        )}
                      </button>
                    );
                  })
                )}
              </div>

              {/* PAGINATION */}
              <div className="flex flex-col sm:flex-row items-center justify-between mt-6 pt-4 border-t border-white/5 gap-4">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                  {totalPages > 0 ? (
                    <span>
                      Hal {currentPage}/{totalPages}
                    </span>
                  ) : (
                    <span>0 Data</span>
                  )}
                  <span className="text-brand-400 ml-3">
                    | {filteredOrders.length} antrean
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    className="h-7 px-2.5 text-[10px] font-bold uppercase text-slate-400 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-30"
                  >
                    <ChevronLeft className="h-3 w-3 mr-1" /> Sebelumnya
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((p) => Math.min(Math.max(1, totalPages), p + 1))
                    }
                    disabled={currentPage >= totalPages || totalPages === 0}
                    className="h-7 px-2.5 text-[10px] font-bold uppercase text-slate-400 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-30"
                  >
                    Selanjutnya <ChevronRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </div>
            </div>

            {/* ===== RIGHT COLUMN: SCANNER TERMINAL ===== */}
            <div className="w-full lg:w-[420px] shrink-0 p-6">
              <div className="flex items-center gap-2 mb-6">
                <ScanLine className="h-4 w-4 text-brand-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Scanner Terminal
                </h2>
                {isScanningStatus && (
                  <span className="text-[10px] font-mono text-warning uppercase animate-pulse ml-auto">
                    Memproses...
                  </span>
                )}
              </div>

              {selectedOrder ? (
                <div className="space-y-4">
                  {/* SELECTED ORDER INFO */}
                  <div className="bg-white/5 rounded-xl border border-white/10 p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                          PO Aktif
                        </p>
                        <p className="text-sm font-bold text-white font-mono mt-0.5">
                          {selectedOrder.poNumber}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {(selectedOrder as any).branch?.name || 'Cabang Terdaftar'}
                        </p>
                      </div>
                      <div className="text-right">
                        {(() => {
                          const p = getOrderProgress(selectedOrder.id);
                          const done = p.total > 0 && p.scanned >= p.total;
                          return (
                            <span
                              className={`text-[10px] font-bold font-mono ${
                                done ? 'text-success' : 'text-warning'
                              }`}
                            >
                              {done
                                ? 'SELESAI'
                                : `${p.scanned}/${p.total}`}
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                    {(() => {
                      const p = getOrderProgress(selectedOrder.id);
                      if (p.total > 0) {
                        return (
                          <div
                            className="mt-2.5 h-1 bg-white/10 rounded-full overflow-hidden"
                            role="progressbar"
                            aria-valuenow={p.percentage}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={`Kemajuan: ${p.scanned} dari ${p.total} item`}
                          >
                            <div
                              className={`h-full rounded-full transition-all ${
                                p.percentage >= 100
                                  ? 'bg-success'
                                  : 'bg-brand-500'
                              }`}
                              style={{ width: `${p.percentage}%` }}
                            />
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>

                  {/* SCANNER FORM */}
                  <form
                    onSubmit={handleScanSubmit}
                    className={`bg-white/5 rounded-xl border border-white/10 p-4 space-y-4 transition-opacity ${
                      isScanningStatus ? 'opacity-50 pointer-events-none' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col w-[72px] shrink-0">
                        <span className="text-[10px] text-slate-500 font-semibold mb-1 uppercase tracking-wider font-mono">
                          Qty
                        </span>
                        <Input
                          type="number"
                          min="1"
                          value={scanQty}
                          onChange={(e) => setScanQty(Number(e.target.value))}
                          className="h-10 bg-white/10 border border-white/10 rounded-lg text-center text-white text-sm font-semibold font-mono focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30"
                          disabled={isScanningStatus}
                        />
                      </div>
                      <div className="flex flex-col flex-1">
                        <span className="text-[10px] text-slate-500 font-semibold mb-1 uppercase tracking-wider font-mono">
                          Data Barcode
                        </span>
                        <Input
                          ref={inputRef}
                          value={barcodeInput}
                          onChange={(e) => setBarcodeInput(e.target.value)}
                          placeholder="TEMBAK SCANNER KE SINI..."
                          className="h-10 bg-white/10 border border-white/20 rounded-lg text-center text-white text-sm font-semibold tracking-[0.15em] font-mono placeholder:text-slate-600 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/40"
                          autoComplete="off"
                          disabled={isScanningStatus}
                        />
                      </div>
                      <div className="flex flex-col self-end">
                        <Button
                          type="submit"
                          disabled={isScanningStatus || !barcodeInput.trim()}
                          className="h-10 px-4 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-bold text-[10px] uppercase gap-1.5 border-none disabled:opacity-40"
                        >
                          <Barcode className="h-4 w-4" />
                          Scan
                        </Button>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-600 italic leading-relaxed">
                      Tip: Jika ada banyak barang sama, ubah QTY lalu scan 1 barcode.
                    </p>
                  </form>

                  {/* ITEMS TABLE */}
                  <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-white/5">
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider font-mono">
                      Hasil Scan — {orderItems.length} item
                    </p>
                    </div>
                    <div className="divide-y divide-white/5 max-h-[420px] overflow-y-auto">
                      {orderItems.length === 0 ? (
                        <div className="px-4 py-8 text-center">
                          <p className="text-[10px] text-slate-500 italic">
                            Belum ada data barang.
                          </p>
                        </div>
                      ) : (
                        orderItems.map((item) => {
                          const isDone = (item.scannedQty || 0) >= item.quantity;
                          const isHighlighted = highlightedItemId === item.id;
                          return (
                            <div
                              key={item.id}
                              className={`px-4 py-3 flex items-center justify-between gap-3 transition-all duration-500 ${
                                isDone ? 'bg-success/5' : ''
                              } ${
                                isHighlighted
                                  ? 'bg-brand-500/20 ring-1 ring-brand-500/40 scale-[1.02]'
                                  : ''
                              }`}
                              aria-live="polite"
                              aria-label={`${item.product.name}, ${item.scannedQty || 0} dari ${item.quantity} di-scan`}
                            >
                              <div className="min-w-0 flex-1">
                                <p
                                  className={`text-xs font-bold truncate ${
                                    isDone ? 'text-success' : 'text-slate-200'
                                  }`}
                                >
                                  {item.product.name}
                                </p>
                                <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                                  {item.product.sku}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <div className="text-center">
                                  <p className="text-[10px] text-slate-500 font-mono">Req</p>
                                  <p className="text-xs font-bold text-slate-300 font-mono">
                                    {item.quantity}
                                  </p>
                                </div>
                                <div className="text-center">
                                  <p className="text-[10px] text-slate-500 font-mono">Scan</p>
                                  <p
                                    className={`text-xs font-bold font-mono ${
                                      isDone ? 'text-success' : 'text-slate-400'
                                    }`}
                                  >
                                    {item.scannedQty || 0}
                                  </p>
                                </div>
                                {(item.scannedQty || 0) > 0 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleUndoScan(item)}
                                    disabled={isReverting}
                                    className="h-7 w-7 p-0 rounded-lg text-slate-500 hover:text-warning hover:bg-warning/10"
                                    aria-label={`Batalkan scan ${item.product.name}`}
                                  >
                                    <Undo2 className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                                {isDone && (
                                  <PackageCheck className="h-4 w-4 text-success shrink-0" />
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* COMPLETE PICKING BUTTON */}
                  {(() => {
                    const p = getOrderProgress(selectedOrder.id);
                    const allDone = p.total > 0 && p.scanned >= p.total;
                    if (!allDone) return null;
                    return (
                      <Button
                        type="button"
                        onClick={() => setIsCompleteConfirmOpen(true)}
                        className="w-full h-11 rounded-xl bg-success hover:bg-success/80 text-white font-bold text-xs uppercase tracking-wider gap-2 border-none transition-all active:scale-95"
                      >
                        <PackageCheck className="h-4 w-4" />
                        Selesaikan Picking
                      </Button>
                    );
                  })()}
                </div>
              ) : (
                /* PLACEHOLDER */
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <ScanBarcode className="h-12 w-12 text-slate-700 mb-4" />
                  <p className="text-sm font-bold text-slate-500">
                    Pilih pesanan dari antrean
                  </p>
                  <p className="text-[10px] text-slate-600 mt-1">
                    untuk memulai scanning barang
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* DIALOG: PREVIEW PDF */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="sm:max-w-4xl h-[85vh] bg-[#0f172a] rounded-2xl border border-white/10 shadow-2xl p-0 overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between shrink-0">
            <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="h-4 w-4 text-brand-400" />
              Dokumen PO: {previewOrder?.poNumber}
            </DialogTitle>
          </div>
          <div className="flex-1 bg-white/5 m-4 rounded-xl overflow-hidden relative">
            {previewOrder?.poDocumentUrl ? (
              <iframe
                src={`${API_URL}${previewOrder.poDocumentUrl}#toolbar=0`}
                className="w-full h-full rounded-xl"
                title="Preview PO"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
                <PackageOpen className="h-10 w-10 mb-2 opacity-20" />
                <p className="text-xs font-bold uppercase tracking-widest opacity-40 font-mono">
                  Dokumen PDF Tidak Tersedia
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG: KONFIRMASI SELESAI PICKING */}
      <Dialog open={isCompleteConfirmOpen} onOpenChange={setIsCompleteConfirmOpen}>
        <DialogContent className="sm:max-w-md bg-[#0f172a] rounded-2xl border border-white/10 shadow-2xl p-0">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
              <PackageCheck className="h-5 w-5 text-success" />
              Selesaikan Picking
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400 mt-2 leading-relaxed">
              Apakah Anda yakin ingin menyelesaikan proses picking untuk PO{' '}
              <span className="font-mono text-slate-300">{selectedOrder?.poNumber}</span>?
              Semua barang yang sudah di-scan akan ditandai sebagai SELESAI.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="px-6 pb-6 pt-2 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCompleteConfirmOpen(false)}
              className="h-9 px-4 text-[10px] font-bold uppercase text-slate-400 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10"
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleCompletePicking}
              className="h-9 px-4 text-[10px] font-bold uppercase rounded-lg bg-success hover:bg-success/80 text-white border-none gap-1.5"
            >
              <PackageCheck className="h-3.5 w-3.5" />
              Selesaikan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
