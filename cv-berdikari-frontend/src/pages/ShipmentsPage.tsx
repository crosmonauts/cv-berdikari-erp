import { useEffect, useState } from 'react';
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
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Truck,
  MapPin,
  Printer,
  PlaneTakeoff,
  UploadCloud,
  Edit,
  CalendarDays,
  Search,
  ArrowUpDown,
  FileText,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { getOrders } from '@/modules/orders/api';
import { getBranches } from '@/modules/branches/api';
import { getOrderItems } from '@/modules/order-items/api';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ASSETS
import logoBerdikari from '@/assets/logo.png';
import ttdImage from '@/assets/ttd.png';
import stempelImage from '@/assets/stempel.png';

const loadAsset = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
};

export default function ShipmentsPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const currentActualYear = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentActualYear);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [isAwbOpen, setIsAwbOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [awbData, setAwbData] = useState({
    documentNumber: '',
    shippingCost: 0,
    otherFees: 0,
  });
  const [awbFile, setAwbFile] = useState<File | null>(null);

  const months = [
    { val: 1, label: 'Januari' },
    { val: 2, label: 'Februari' },
    { val: 3, label: 'Maret' },
    { val: 4, label: 'April' },
    { val: 5, label: 'Mei' },
    { val: 6, label: 'Juni' },
    { val: 7, label: 'Juli' },
    { val: 8, label: 'Agustus' },
    { val: 9, label: 'September' },
    { val: 10, label: 'Oktober' },
    { val: 11, label: 'November' },
    { val: 12, label: 'Desember' },
  ];
  const years = [
    currentActualYear,
    currentActualYear - 1,
    currentActualYear - 2,
  ];

  useEffect(() => {
    fetchData();
  }, []);
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedMonth, selectedYear, sortOrder]);

  const fetchData = async () => {
    try {
      const [ord, br] = await Promise.all([getOrders(), getBranches()]);
      setOrders(
        ord.filter((o) => o.status === 'DIKIRIM' || o.status === 'SELESAI'),
      );
      setBranches(br);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAndSortedOrders = orders
    .filter((o) => {
      const orderDate = new Date(o.createdAt);
      const matchesMonth = orderDate.getMonth() + 1 === Number(selectedMonth);
      const matchesYear = orderDate.getFullYear() === Number(selectedYear);
      const matchesSearch = o.poNumber
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      return matchesMonth && matchesYear && matchesSearch;
    })
    .sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

  const totalPages = Math.ceil(filteredAndSortedOrders.length / itemsPerPage);
  const paginatedOrders = filteredAndSortedOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const handleOpenAwb = (order: any, existingShipment: any = null) => {
    setSelectedOrder(order);
    if (existingShipment) {
      setAwbData({
        documentNumber: existingShipment.documentNumber || '',
        shippingCost: existingShipment.shippingCost || 0,
        otherFees: existingShipment.otherFees || 0,
      });
    } else {
      setAwbData({ documentNumber: '', shippingCost: 0, otherFees: 0 });
    }
    setAwbFile(null);
    setIsAwbOpen(true);
  };

  const handleSaveAwb = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    try {
      const API_URL = import.meta.env.VITE_API_URL;

      const formData = new FormData();
      formData.append('orderId', selectedOrder.id);
      formData.append('type', 'AWB');
      formData.append('documentNumber', awbData.documentNumber);
      formData.append(
        'shippingCost',
        String(Number(awbData.shippingCost) || 0),
      );
      formData.append('otherFees', String(Number(awbData.otherFees) || 0));
      if (awbFile) formData.append('file', awbFile);

      await axios.post(`${API_URL}/shipments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      alert('Data Pengiriman berhasil disimpan!');
      setIsAwbOpen(false);
      fetchData();
    } catch (error: any) {
      alert(`Gagal! Info Backend: ${error.response?.data?.message}`);
    }
  };

  const handlePrintDO = async (order: any) => {
    try {
      const branch = branches.find((b) => b.id === order.branchId);
      const items = await getOrderItems(order.id);
      const doc = new jsPDF();

      try {
        const logoImg = await loadAsset(logoBerdikari);
        doc.addImage(logoImg, 'JPEG', 14, 10, 22, 22);
      } catch (e) {
        console.warn('Logo gagal dimuat');
      }

      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('CV. BERDIKARI JAYA', 40, 20);
      doc.setFontSize(9);
      doc.text('Jl. Pemuda No. 123, Semarang | logistik@berdikari.com', 40, 26);
      doc.line(14, 35, 196, 35);
      doc.setFontSize(16);
      doc.text('DELIVERY ORDER', 14, 45);
      doc.setFontSize(9);
      doc.text(`No. Dokumen : DO-${order.poNumber}`, 14, 52);
      doc.text(
        `Tanggal     : ${new Date().toLocaleDateString('id-ID')}`,
        14,
        57,
      );
      doc.text(`Ref. PO     : ${order.poNumber}`, 14, 62);
      doc.text('Penerima:', 120, 52);
      doc.setFont('helvetica', 'bold');
      doc.text(branch?.name || 'Klien', 120, 57);
      doc.setFont('helvetica', 'normal');
      doc.text(branch?.address || '-', 120, 62, { maxWidth: 70 });

      const tableBody = items.map((item: any, idx: number) => [
        idx + 1,
        item.product.name,
        item.clientItemCode || item.product.sku || '-',
        item.quantity.toString() + ' Unit',
      ]);
      autoTable(doc, {
        startY: 75,
        head: [['No.', 'Nama Barang', 'Kode (SKU)', 'Jumlah']],
        body: tableBody,
        theme: 'grid',
        headStyles: { fillColor: [71, 85, 105] },
        styles: { fontSize: 9 },
      });

      const finalY = (doc as any).lastAutoTable.finalY || 150;
      doc.text('Hormat Kami,', 40, finalY + 25);

      try {
        const stempelImg = await loadAsset(stempelImage);
        doc.addImage(
          stempelImg,
          'PNG',
          15,
          finalY + 25,
          35,
          35,
          undefined,
          'FAST',
          0,
        );
        const ttdImg = await loadAsset(ttdImage);
        doc.addImage(
          ttdImg,
          'PNG',
          22,
          finalY + 30,
          30,
          20,
          undefined,
          'FAST',
          0,
        );
      } catch (e) {
        console.warn('Asset gagal dimuat');
      }

      doc.text('( Bag. Gudang & Pengiriman )', 28, finalY + 55);

      doc.text('Diterima Oleh,', 140, finalY + 25);
      doc.text('( Store Manager )', 135, finalY + 55);

      doc.save(`DO_${order.poNumber}.pdf`);
    } catch (e) {
      alert('Error Cetak DO');
    }
  };

  if (isLoading)
    return (
      <div className="p-10 text-center animate-pulse font-bold text-slate-400">
        Sinkronisasi Data...
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-300 px-2 pt-1 pb-10 space-y-4 font-sans">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-indigo-600 ring-1 ring-slate-200">
            <Truck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Ekspedisi & Logistik
            </h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              Antrean Pengiriman
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="h-11 bg-white border-none ring-1 ring-slate-200 shadow-sm text-xs font-bold text-slate-600 px-4 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <ArrowUpDown className="h-3.5 w-3.5 mr-2 text-indigo-600" />
            {sortOrder === 'desc' ? 'TERBARU' : 'TERLAMA'}
          </Button>
          <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl shadow-sm ring-1 ring-slate-200 h-11">
            <CalendarDays className="h-4 w-4 text-slate-400 ml-2" />
            <Select
              value={selectedMonth.toString()}
              onValueChange={(v) => setSelectedMonth(Number(v))}
            >
              <SelectTrigger className="w-[130px] h-8 border-none font-bold text-xs shadow-none focus:ring-0">
                <SelectValue placeholder="Bulan" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {months.map((m) => (
                  <SelectItem key={m.val} value={m.val.toString()}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={selectedYear.toString()}
              onValueChange={(v) => setSelectedYear(Number(v))}
            >
              <SelectTrigger className="w-[90px] h-8 border-none font-bold text-xs shadow-none focus:ring-0">
                <SelectValue placeholder="Tahun" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {years.map((y) => (
                  <SelectItem key={y} value={y.toString()}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto space-y-4">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
          <Input
            placeholder="Cari berdasarkan Nomor PO..."
            className="pl-11 h-12 bg-white border-none ring-1 ring-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-600 transition-all font-medium text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden ring-1 ring-slate-200 flex flex-col">
          <div className="flex-1 overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow className="border-b border-slate-100">
                  <TableHead className="pl-6 py-4 text-[10px] font-bold uppercase text-slate-400">
                    Nomor PO
                  </TableHead>
                  <TableHead className="py-4 text-[10px] font-bold uppercase text-slate-400">
                    Tanggal
                  </TableHead>
                  <TableHead className="py-4 text-[10px] font-bold uppercase text-slate-400">
                    Cabang
                  </TableHead>
                  <TableHead className="text-center py-4 text-[10px] font-bold uppercase text-slate-400">
                    Area
                  </TableHead>
                  <TableHead className="py-4 text-[10px] font-bold uppercase text-slate-400">
                    Info Pengiriman
                  </TableHead>
                  <TableHead className="pr-6 text-right py-4 text-[10px] font-bold uppercase text-slate-400">
                    Aksi
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-24 text-center">
                      <div className="flex flex-col items-center gap-2 opacity-40">
                        <FileText className="h-10 w-10 text-slate-400" />
                        <p className="text-xs font-bold uppercase italic text-slate-500">
                          Tidak ada pengiriman ditemukan.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedOrders.map((o) => {
                    const branch = branches.find((b) => b.id === o.branchId);

                    // --- PERBAIKAN BUG WHITE SCREEN DISINI ---
                    // Mengambil nama wilayah dari objek region, dengan fallback jika kosong
                    const region =
                      branch?.region?.name?.toUpperCase() || 'BELUM DIATUR';

                    const isLuarKota =
                      region !== 'SEMARANG' &&
                      region !== 'SMG' &&
                      region !== 'BELUM DIATUR';

                    const shipmentData = o.shipment || null;
                    const formattedDate = new Date(
                      o.createdAt,
                    ).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    });
                    return (
                      <TableRow
                        key={o.id}
                        className="hover:bg-slate-50/50 border-b border-slate-50 last:border-none transition-colors"
                      >
                        <TableCell className="pl-6 py-4 font-bold text-slate-800 uppercase">
                          {o.poNumber}
                        </TableCell>
                        <TableCell className="py-4 font-bold text-slate-600 text-xs">
                          {formattedDate}
                        </TableCell>
                        <TableCell className="py-4 font-semibold text-slate-600 text-xs">
                          {branch?.name || '-'}
                        </TableCell>
                        <TableCell className="text-center py-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${isLuarKota ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-100' : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'}`}
                          >
                            <MapPin className="h-2.5 w-2.5 inline mr-1" />{' '}
                            {region}
                          </span>
                        </TableCell>
                        <TableCell className="py-4">
                          {shipmentData ? (
                            <div className="space-y-0.5 py-1">
                              <span className="block text-xs font-bold text-slate-800">
                                Resi: {shipmentData.documentNumber}
                              </span>
                              <span className="block text-[10px] font-medium text-slate-500">
                                Kirim: Rp{' '}
                                {Number(
                                  shipmentData.shippingCost,
                                ).toLocaleString('id-ID')}
                              </span>
                              {Number(shipmentData.otherFees) > 0 && (
                                <span className="block text-[10px] font-medium text-slate-500">
                                  Lainnya: Rp{' '}
                                  {Number(
                                    shipmentData.otherFees,
                                  ).toLocaleString('id-ID')}
                                </span>
                              )}
                            </div>
                          ) : isLuarKota ? (
                            <span className="text-[10px] text-amber-600 font-medium italic">
                              Menunggu AWB...
                            </span>
                          ) : (
                            <span className="text-[10px] text-indigo-600 font-medium italic">
                              Kurir Internal
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="pr-6 text-right py-4">
                          {isLuarKota ? (
                            shipmentData ? (
                              <Button
                                onClick={() => handleOpenAwb(o, shipmentData)}
                                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 font-bold text-[10px] h-8 shadow-sm transition-all"
                              >
                                <Edit className="h-3.5 w-3.5 mr-1.5" /> EDIT AWB
                              </Button>
                            ) : (
                              <Button
                                onClick={() => handleOpenAwb(o)}
                                className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] h-8 shadow-sm transition-all"
                              >
                                <PlaneTakeoff className="h-3.5 w-3.5 mr-2" />{' '}
                                PROSES AWB
                              </Button>
                            )
                          ) : (
                            <Button
                              onClick={() => handlePrintDO(o)}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] h-8 shadow-sm transition-all"
                            >
                              <Printer className="h-3.5 w-3.5 mr-2" /> CETAK DO
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

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
                | TOTAL {filteredAndSortedOrders.length} ITEM
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
                  setCurrentPage((p) =>
                    Math.min(Math.max(1, totalPages), p + 1),
                  )
                }
                disabled={currentPage >= totalPages || totalPages === 0}
                className="h-8 px-3 text-[10px] font-bold uppercase text-slate-600 rounded-lg border-none shadow-sm ring-1 ring-slate-200 hover:bg-white transition-colors disabled:opacity-50"
              >
                SELANJUTNYA <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isAwbOpen} onOpenChange={setIsAwbOpen}>
        <DialogContent className="sm:max-w-md bg-white rounded-xl p-0 overflow-hidden border-none shadow-2xl">
          <div className="px-6 py-4 border-b bg-slate-50/50 flex items-center gap-3">
            <PlaneTakeoff className="h-5 w-5 text-amber-600" />
            <DialogTitle className="text-lg font-bold text-slate-900">
              Input Pengiriman
            </DialogTitle>
          </div>
          <div className="p-6">
            <form onSubmit={handleSaveAwb} className="space-y-4">
              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-slate-400 uppercase">
                  Nomor Resi
                </Label>
                <Input
                  required
                  value={awbData.documentNumber}
                  onChange={(e) =>
                    setAwbData({ ...awbData, documentNumber: e.target.value })
                  }
                  className="h-9 font-semibold bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-600"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase">
                    Biaya Kirim (Rp)
                  </Label>
                  <Input
                    type="number"
                    required
                    value={awbData.shippingCost || ''}
                    onChange={(e) =>
                      setAwbData({
                        ...awbData,
                        shippingCost: Number(e.target.value),
                      })
                    }
                    className="h-9 font-bold bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase">
                    Biaya Lain (Rp)
                  </Label>
                  <Input
                    type="number"
                    value={awbData.otherFees || ''}
                    onChange={(e) =>
                      setAwbData({
                        ...awbData,
                        otherFees: Number(e.target.value),
                      })
                    }
                    className="h-9 font-bold bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-slate-400 uppercase">
                  Upload Resi {awbData.documentNumber ? '(Opsional)' : ''}
                </Label>
                <div className="relative">
                  <Input
                    type="file"
                    required={!awbData.documentNumber}
                    onChange={(e) => setAwbFile(e.target.files?.[0] || null)}
                    className="h-9 text-xs file:bg-indigo-50 file:text-indigo-700 pt-1.5 bg-slate-50 border-none ring-1 ring-slate-200"
                  />
                  <UploadCloud className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full bg-slate-900 text-white h-10 font-bold uppercase tracking-widest text-xs mt-4 hover:bg-slate-800 transition-all active:scale-95 border-none shadow-sm"
              >
                SIMPAN PERUBAHAN
              </Button>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
