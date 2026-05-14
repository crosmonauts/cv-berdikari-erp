import { useEffect, useState, useRef } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import {
  PackageOpen,
  Search,
  ScanBarcode,
  Barcode,
  PackageCheck,
  ArrowRight,
  FileText,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { getOrders } from '@/modules/orders/api';
import { getOrderItems, scanOrderItemBarcode } from '@/modules/order-items/api';
import type { Order } from '@/modules/orders/types';

export default function WarehousePage() {
  // Variabel penentu URL otomatis untuk Preview PDF
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // --- STATE PAGINATION ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // --- STATE SCANNER TERMINAL ---
  const [isScanOpen, setIsScanOpen] = useState(false);
  const [isScanningStatus, setIsScanningStatus] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);

  const [barcodeInput, setBarcodeInput] = useState('');
  const [scanQty, setScanQty] = useState<number>(1);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchOrders = async () => {
    try {
      const data = await getOrders();
      // Hanya tampilkan PO yang PENDING atau DIPROSES untuk antrean gudang
      setOrders(
        data.filter((o) => o.status === 'PENDING' || o.status === 'DIPROSES'),
      );
    } catch (error) {
      console.error('Gagal mengambil data pesanan:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Reset pagination ke halaman 1 saat pencarian berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleOpenScanner = async (order: Order) => {
    setSelectedOrder(order);
    setScanQty(1); // Reset QTY ke 1 setiap buka terminal
    setIsScanOpen(true);
    await fetchOrderItems(order.id);

    setTimeout(() => {
      inputRef.current?.focus();
    }, 200);
  };

  const fetchOrderItems = async (orderId: string) => {
    try {
      const items = await getOrderItems(orderId);
      setOrderItems(items);
    } catch (error) {
      console.error('Gagal mengambil detail barang:', error);
    }
  };

  // --- LOGIKA SMART SCANNER (1x Hit API ke Backend) ---
  const handleScanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !barcodeInput.trim()) return;

    const qtyToProcess = Number(scanQty) || 1;
    setIsScanningStatus(true);

    try {
      // Hit ke API Backend yang sudah kita buat mampu menerima QTY
      const result = await scanOrderItemBarcode(
        selectedOrder.id,
        barcodeInput,
        qtyToProcess,
      );

      if (result.success) {
        // Jika sukses, reload data barang untuk update visual progress bar
        await fetchOrderItems(selectedOrder.id);
      } else {
        // Jika gagal (melebihi kapasitas, barcode salah, dll), tampilkan pesan error dari backend
        alert(`Gagal: ${result.message}`);
      }
    } catch (error) {
      alert('Terjadi kesalahan jaringan saat memproses scan!');
    } finally {
      // Apapun yang terjadi (sukses/gagal), wajib kosongkan input & reset QTY ke 1
      setBarcodeInput('');
      setScanQty(1);
      setIsScanningStatus(false);
      inputRef.current?.focus();
    }
  };

  // --- LOGIKA FILTER & PAGINATION ---
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

  if (isLoading)
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-xs font-bold text-slate-400 animate-pulse uppercase tracking-widest">
          Mengakses Terminal Gudang...
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-300 px-2 pt-1 pb-10 space-y-4 font-sans">
      {/* HEADER SECTION */}
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-indigo-600 ring-1 ring-slate-200">
            <PackageOpen className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Operasional Gudang
            </h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              Antrean Penyiapan Barang
            </p>
          </div>
        </div>

        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
          <Input
            placeholder="Cari No. PO atau Cabang..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64 h-10 pl-9 rounded-xl bg-white border-none ring-1 ring-slate-200 text-sm font-medium focus:ring-2 focus:ring-indigo-500 shadow-sm"
          />
        </div>
      </div>

      {/* TABLE ANTREAN GUDANG */}
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-sm ring-1 ring-slate-200 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50 border-b">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="pl-6 py-4 text-[10px] font-bold uppercase text-slate-400">
                  Nomor PO
                </TableHead>
                <TableHead className="py-4 text-[10px] font-bold uppercase text-slate-400">
                  Cabang Tujuan
                </TableHead>
                <TableHead className="py-4 text-[10px] font-bold uppercase text-slate-400 text-center">
                  Status
                </TableHead>
                <TableHead className="pr-6 py-4 text-[10px] font-bold uppercase text-slate-400 text-right">
                  Aksi
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedOrders.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center py-24 text-xs font-medium text-slate-400 italic bg-white"
                  >
                    Semua barang sudah disiapkan dan dikirim. Antrean kosong.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedOrders.map((o) => (
                  <TableRow
                    key={o.id}
                    className="group hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-none"
                  >
                    <TableCell className="pl-6 py-4 font-black text-indigo-600 text-sm uppercase tracking-tight">
                      {o.poNumber}
                    </TableCell>
                    <TableCell className="py-4 font-semibold text-slate-600 text-sm">
                      {(o as any).branch?.name || 'Cabang Terdaftar'}
                    </TableCell>
                    <TableCell className="py-4 text-center">
                      <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-md text-[9px] font-bold uppercase ring-1 ring-indigo-100 shadow-sm">
                        {o.status}
                      </span>
                    </TableCell>
                    <TableCell className="pr-6 py-4 text-right">
                      <Button
                        onClick={() => handleOpenScanner(o)}
                        className="h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] gap-1.5 border-none uppercase transition-all active:scale-95 shadow-md"
                      >
                        <ScanBarcode className="h-4 w-4" /> BUKA TERMINAL{' '}
                        <ArrowRight className="h-3.5 w-3.5 ml-1" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* KONTROL PAGINATION DI FOOTER TABEL */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 bg-slate-50/50 border-t border-slate-100 gap-4">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-3">
            {totalPages > 0 ? (
              <span>
                Halaman {currentPage} dari {totalPages}
              </span>
            ) : (
              <span>0 Data</span>
            )}
            <span className="font-black text-indigo-400">
              | TOTAL {filteredOrders.length} ANTREAN
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="h-8 px-3 text-[10px] font-bold uppercase text-slate-600 rounded-lg border-none shadow-sm ring-1 ring-slate-200 hover:bg-white transition-colors disabled:opacity-50"
            >
              <ChevronLeft className="h-3.5 w-3.5 mr-1" /> SEBELUMNYA
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage((p) => Math.min(Math.max(1, totalPages), p + 1))
              }
              disabled={currentPage >= totalPages || totalPages === 0}
              className="h-8 px-3 text-[10px] font-bold uppercase text-slate-600 rounded-lg border-none shadow-sm ring-1 ring-slate-200 hover:bg-white transition-colors disabled:opacity-50"
            >
              SELANJUTNYA <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </div>

      {/* POP-UP TERMINAL SCANNER (SPLIT VIEW MODE) */}
      <Dialog open={isScanOpen} onOpenChange={setIsScanOpen}>
        <DialogContent className="sm:max-w-7xl h-[90vh] bg-white rounded-2xl border-none shadow-2xl p-0 overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b bg-slate-50/50 flex items-center justify-between shrink-0">
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Barcode className="h-5 w-5 text-indigo-600" /> Terminal Scan PO:{' '}
              {selectedOrder?.poNumber}
            </DialogTitle>
          </div>

          <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden p-6 gap-6">
            {/* KIRI: DOKUMEN PDF PO */}
            <div className="w-full lg:w-1/2 flex flex-col gap-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                <FileText className="h-3 w-3" /> Dokumen Fisik Purchase Order
              </p>
              <div className="flex-1 bg-slate-100 rounded-2xl border-2 border-slate-200 border-dashed overflow-hidden relative">
                {selectedOrder?.poDocumentUrl ? (
                  <iframe
                    src={`${API_URL}${selectedOrder.poDocumentUrl}#toolbar=0`}
                    className="w-full h-full rounded-xl bg-white"
                    title="Preview PO"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                    <PackageOpen className="h-10 w-10 mb-2 opacity-20" />
                    <p className="text-xs font-bold uppercase tracking-widest opacity-40">
                      Dokumen PDF Tidak Tersedia
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* KANAN: FORM SCAN & TABEL BARANG */}
            <div className="w-full lg:w-1/2 flex flex-col gap-6 overflow-hidden">
              {/* FORM SMART SCANNER */}
              <form
                onSubmit={handleScanSubmit}
                className={`bg-slate-950 p-6 rounded-2xl flex flex-col shadow-xl shrink-0 transition-opacity ${isScanningStatus ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <p className="text-indigo-400 font-bold text-[9px] tracking-[0.2em] uppercase opacity-80 flex items-center gap-2">
                    <ScanBarcode className="h-3 w-3" /> Terminal Scanner Aktif
                  </p>
                  {isScanningStatus && (
                    <span className="text-amber-400 font-bold text-[9px] uppercase animate-pulse">
                      Memproses...
                    </span>
                  )}
                </div>

                <div className="flex items-stretch gap-3 w-full">
                  {/* INPUT QTY MULTIPLIER */}
                  <div className="flex flex-col w-20 shrink-0">
                    <span className="text-slate-400 text-[9px] font-bold mb-1.5 uppercase tracking-wider">
                      Jml (Qty)
                    </span>
                    <Input
                      type="number"
                      min="1"
                      value={scanQty}
                      onChange={(e) => setScanQty(Number(e.target.value))}
                      className="h-12 bg-white border-none rounded-xl text-center text-slate-900 text-lg font-black focus:ring-4 focus:ring-indigo-500 transition-all shadow-inner"
                      disabled={isScanningStatus}
                      title="Ubah angka ini jika barang lebih dari 1"
                    />
                  </div>

                  {/* INPUT BARCODE UTAMA */}
                  <div className="flex flex-col flex-1">
                    <span className="text-slate-400 text-[9px] font-bold mb-1.5 uppercase tracking-wider">
                      Data Barcode
                    </span>
                    <Input
                      ref={inputRef}
                      value={barcodeInput}
                      onChange={(e) => setBarcodeInput(e.target.value)}
                      placeholder="TEMBAK SCANNER KE SINI..."
                      className="h-12 bg-white/10 border-indigo-500/30 rounded-xl text-center text-white text-lg font-bold tracking-[0.2em] placeholder:text-slate-600 focus:ring-4 focus:ring-indigo-500 focus:bg-white/20 transition-all"
                      autoComplete="off"
                      disabled={isScanningStatus}
                    />
                  </div>
                </div>

                <p className="text-slate-500 text-[10px] mt-4 font-medium italic">
                  💡 Tips: Jika ada 100 barang yg sama, ubah QTY menjadi 100,
                  lalu scan 1 barcode saja.
                </p>
              </form>

              {/* TABEL LIST BARANG PO */}
              <div className="flex-1 rounded-xl ring-1 ring-slate-200 overflow-auto shadow-sm bg-white">
                <Table>
                  <TableHeader className="bg-slate-50/80 sticky top-0 z-10 backdrop-blur-sm shadow-sm">
                    <TableRow className="border-none">
                      <TableHead className="pl-6 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Deskripsi Barang
                      </TableHead>
                      <TableHead className="py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 text-center">
                        Req Qty
                      </TableHead>
                      <TableHead className="py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 text-center">
                        Discan
                      </TableHead>
                      <TableHead className="pr-6 py-3 text-[10px] font-bold uppercase tracking-wider text-right">
                        Status
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orderItems.map((item) => {
                      const isDone = item.scannedQty >= item.quantity;
                      return (
                        <TableRow
                          key={item.id}
                          className={`transition-colors border-b border-slate-50 last:border-none ${isDone ? 'bg-emerald-50/30' : 'hover:bg-slate-50/50'}`}
                        >
                          <TableCell className="pl-6 py-3">
                            <span
                              className={`font-bold block text-xs uppercase ${isDone ? 'text-emerald-800' : 'text-slate-700'}`}
                            >
                              {item.product.name}
                            </span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                              {item.product.sku}
                            </span>
                          </TableCell>
                          <TableCell className="text-center font-bold text-slate-400 text-xs">
                            {item.quantity}
                          </TableCell>
                          <TableCell className="text-center">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-black tracking-wider ${isDone ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-indigo-600'}`}
                            >
                              {item.scannedQty}
                            </span>
                          </TableCell>
                          <TableCell className="pr-6 text-right">
                            {isDone ? (
                              <PackageCheck className="h-5 w-5 text-emerald-500 ml-auto drop-shadow-sm" />
                            ) : (
                              <div className="h-1.5 w-6 bg-slate-200 rounded-full ml-auto" />
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
