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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Receipt,
  Plus,
  Calendar,
  CalendarDays,
  Search,
  ArrowUpDown,
  FileText,
  FileDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { getInvoices, createInvoice } from '@/modules/invoices/api';
import { getOrders } from '@/modules/orders/api';
import { getBranches } from '@/modules/branches/api';
import { getOrderItems } from '@/modules/order-items/api';
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

function terbilang(nominal: number): string {
  const bilangan = [
    '',
    'Satu',
    'Dua',
    'Tiga',
    'Empat',
    'Lima',
    'Enam',
    'Tujuh',
    'Delapan',
    'Sembilan',
    'Sepuluh',
    'Sebelas',
  ];
  let temp = '';
  if (nominal < 12) temp = ' ' + bilangan[Math.floor(nominal)];
  else if (nominal < 20) temp = terbilang(nominal - 10) + ' Belas';
  else if (nominal < 100)
    temp = terbilang(nominal / 10) + ' Puluh' + terbilang(nominal % 10);
  else if (nominal < 200) temp = ' Seratus' + terbilang(nominal - 100);
  else if (nominal < 1000)
    temp = terbilang(nominal / 100) + ' Ratus' + terbilang(nominal % 100);
  else if (nominal < 2000) temp = ' Seribu' + terbilang(nominal - 1000);
  else if (nominal < 1000000)
    temp = terbilang(nominal / 1000) + ' Ribu' + terbilang(nominal % 1000);
  else if (nominal < 1000000000)
    temp =
      terbilang(nominal / 1000000) + ' Juta' + terbilang(nominal % 1000000);
  return temp;
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
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

  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    invoiceNumber: '',
    dueDate: '',
    orderId: '',
  });

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

  const fetchData = async () => {
    try {
      const [inv, ord, br] = await Promise.all([
        getInvoices(),
        getOrders(),
        getBranches(),
      ]);
      setInvoices(inv);
      setOrders(ord);
      setBranches(br);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedMonth, selectedYear, sortOrder]);

  const handleOpenAdd = () => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const prefix = `INV-${yyyy}${mm}`;

    const currentMonthInvoices = invoices.filter((inv) =>
      inv.invoiceNumber?.startsWith(prefix),
    );

    let maxSeq = 0;
    currentMonthInvoices.forEach((inv) => {
      const parts = inv.invoiceNumber.split(prefix);
      if (parts.length === 2) {
        const seq = parseInt(parts[1], 10);
        if (!isNaN(seq) && seq > maxSeq) {
          maxSeq = seq;
        }
      }
    });

    const nextSeq = maxSeq + 1;
    const seqString = String(nextSeq).padStart(3, '0');
    const generatedInvoiceNumber = `${prefix}${seqString}`;

    setFormData({
      invoiceNumber: generatedInvoiceNumber,
      dueDate: '',
      orderId: '',
    });
    setIsOpen(true);
  };

  const filteredAndSortedInvoices = invoices
    .filter((inv) => {
      const invDate = new Date(inv.createdAt || Date.now());
      const matchesMonth = invDate.getMonth() + 1 === Number(selectedMonth);
      const matchesYear = invDate.getFullYear() === Number(selectedYear);
      const relOrder = orders.find((o) => o.id === inv.orderId);
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        inv.invoiceNumber.toLowerCase().includes(searchLower) ||
        relOrder?.poNumber.toLowerCase().includes(searchLower);
      return matchesMonth && matchesYear && matchesSearch;
    })
    .sort((a, b) => {
      const dateA = new Date(a.createdAt || Date.now()).getTime();
      const dateB = new Date(b.createdAt || Date.now()).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

  const totalPages = Math.ceil(filteredAndSortedInvoices.length / itemsPerPage);
  const paginatedInvoices = filteredAndSortedInvoices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createInvoice({
        ...formData,
        dueDate: new Date(formData.dueDate).toISOString(),
      });
      setIsOpen(false);
      fetchData();
      setFormData({ invoiceNumber: '', dueDate: '', orderId: '' });
    } catch (e) {
      alert('Gagal! Mungkin Nomor Invoice duplikat.');
    }
  };

  // --- FUNGSI CETAK INVOICE ---
  const handlePrintInvoice = async (invoice: any, order: any) => {
    try {
      const branch = branches.find((b) => b.id === order.branchId);
      const items = await getOrderItems(order.id);
      const doc = new jsPDF();

      try {
        const logoImg = await loadAsset(logoBerdikari);
        // REVISI: Logo dikecilkan namun rasio tetap proporsional (26x13)
        doc.addImage(logoImg, 'PNG', 14, 10, 26, 13);
      } catch (e) {
        console.warn('Logo gagal dimuat');
      }

      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('CV. BERDIKARI BERKAH BERSAMA', 44, 18);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100);
      doc.text('Jl. Bulustalan V 653F, Semarang | Telp: 083842319061', 44, 24);
      doc.text('Email: cv.berdikari.berkah.bersama@gmail.com', 44, 29);

      doc.line(14, 35, 196, 35);

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0);
      doc.text('INVOICE', 14, 45);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');

      const tglInvoice = new Date(
        invoice.issuedDate || invoice.createdAt || Date.now(),
      ).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

      doc.text(`No. Invoice : ${invoice.invoiceNumber}`, 14, 52);
      doc.text(`Tgl. Terbit : ${tglInvoice}`, 14, 57);
      doc.text(`Ref. PO     : ${order.poNumber}`, 14, 62);

      doc.text('Kepada:', 120, 52);
      doc.setFont('helvetica', 'bold');
      doc.text('PT. REKSO NATIONAL FOOD', 120, 57);
      doc.setFont('helvetica', 'normal');
      doc.text(`Store: ${branch?.name || '-'}`, 120, 62);
      doc.text(branch?.address || '-', 120, 67, { maxWidth: 70 });

      const tableBody = items.map((item: any, idx: number) => [
        idx + 1,
        item.clientItemCode || item.product.sku || '-',
        item.product.name, // Kode internal sudah dihilangkan
        item.quantity.toString(),
        `Rp ${item.priceAtBuy.toLocaleString('id-ID')}`,
        `Rp ${(item.quantity * item.priceAtBuy).toLocaleString('id-ID')}`,
      ]);

      autoTable(doc, {
        startY: 75,
        head: [
          ['No', 'SKU / Kode', 'Deskripsi Barang', 'Qty', 'Harga', 'Subtotal'],
        ],
        body: tableBody,
        theme: 'grid',
        headStyles: { fillColor: [40, 40, 40] },
        styles: { fontSize: 8, cellPadding: 3 },
        columnStyles: {
          0: { cellWidth: 10 }, // REVISI: Kolom No dilebarkan
          1: { cellWidth: 26 },
          // Kolom 2 (Deskripsi) akan memakan sisa ruang otomatis
          3: { cellWidth: 12 },
          4: { cellWidth: 26 },
          5: { cellWidth: 32 },
        },
      });

      // @ts-ignore
      let finalY = doc.lastAutoTable.finalY || 150;

      // REVISI: LOGIKA AUTO-PAGE BREAK
      // Jika Y terlalu ke bawah (ruang sisa kurang dari ~80mm), lompat ke halaman baru
      if (finalY > 210) {
        doc.addPage();
        finalY = 20; // Mengatur koordinat Y di halaman baru
      }

      const dpp = order.totalAmount / 1.11;
      const ppn = order.totalAmount - dpp;

      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text('Total Dasar (DPP):', 115, finalY + 10);
      doc.text(
        `Rp ${dpp.toLocaleString('id-ID', { maximumFractionDigits: 2 })}`,
        160,
        finalY + 10,
      );
      doc.text('PPN (11%):', 115, finalY + 16);
      doc.text(
        `Rp ${ppn.toLocaleString('id-ID', { maximumFractionDigits: 2 })}`,
        160,
        finalY + 16,
      );
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('GRAND TOTAL:', 115, finalY + 24);
      doc.text(
        `Rp ${order.totalAmount.toLocaleString('id-ID')}`,
        160,
        finalY + 24,
      );

      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100);
      const teksTerbilang = terbilang(order.totalAmount)
        .replace(/\s+/g, ' ')
        .trim();
      doc.text('Terbilang: ' + teksTerbilang + ' Rupiah', 115, finalY + 30, {
        maxWidth: 85,
      });

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0);
      doc.text('Informasi Pembayaran:', 14, finalY + 40);
      doc.setFont('helvetica', 'normal');
      doc.text('Bank BNI KK Pandanaran A/C 1608388654', 14, finalY + 45);
      doc.text('a/n CV BERDIKARI BERKAH BERSAMA', 14, finalY + 50);

      doc.text(`Semarang, ${tglInvoice}`, 145, finalY + 40);
      doc.text('Hormat Kami,', 158, finalY + 45);

      try {
        const stempelImg = await loadAsset(stempelImage);
        doc.addImage(
          stempelImg,
          'PNG',
          130,
          finalY + 48,
          45,
          14,
          undefined,
          'FAST',
          0,
        );
        const ttdImg = await loadAsset(ttdImage);
        doc.addImage(
          ttdImg,
          'PNG',
          155,
          finalY + 42,
          25,
          18,
          undefined,
          'FAST',
          0,
        );
      } catch (e) {
        console.warn('Asset gagal dimuat');
      }

      doc.setTextColor(0);
      doc.text('( Dinny Elvandari Prinawati )', 145, finalY + 75);
      doc.save(`Invoice_${invoice.invoiceNumber}.pdf`);
    } catch (e) {
      alert('Error Cetak Invoice');
    }
  };

  // --- FUNGSI CETAK KWITANSI ---
  const handlePrintKwitansi = async (invoice: any, order: any) => {
    try {
      const doc = new jsPDF({ format: 'a5', orientation: 'landscape' });
      doc.rect(5, 5, 200, 138);

      try {
        const logoImg = await loadAsset(logoBerdikari);
        // REVISI: Logo kwitansi dikecilkan
        doc.addImage(logoImg, 'PNG', 10, 10, 18, 9);
      } catch (e) {
        console.warn('Logo gagal dimuat');
      }

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('CV. BERDIKARI BERKAH BERSAMA', 30, 14);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('Jl. Bulustalan V 653F, Semarang', 30, 18);

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('KWITANSI PEMBAYARAN', 105, 25, { align: 'center' });

      const kwitansiNo = invoice.invoiceNumber.replace('INV', 'KWT');

      const labelX = 10;
      const colonX = 43;
      const valueX = 46;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');

      doc.text('No', labelX, 35);
      doc.text(':', colonX, 35);
      doc.setFont('helvetica', 'bold');
      doc.text(kwitansiNo, valueX, 35);

      doc.setFont('helvetica', 'normal');
      doc.text('Sudah Terima Dari', labelX, 45);
      doc.text(':', colonX, 45);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('PT. REKSO NATIONAL FOOD', valueX, 45);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Sejumlah Uang', labelX, 55);
      doc.text(':', colonX, 55);

      doc.setFillColor(245, 245, 245);
      doc.rect(valueX - 2, 48, 145, 10, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(`Rp ${order.totalAmount.toLocaleString('id-ID')}`, valueX, 55);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Terbilang', labelX, 66);
      doc.text(':', colonX, 66);
      doc.setFont('helvetica', 'italic');

      const teksTerbilang = terbilang(order.totalAmount)
        .replace(/\s+/g, ' ')
        .trim();
      doc.text(`### ${teksTerbilang} Rupiah ###`, valueX, 66, {
        maxWidth: 140,
      });

      const tglKwitansi = new Date(
        invoice.issuedDate || invoice.createdAt || Date.now(),
      ).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      doc.setFont('helvetica', 'normal');
      doc.text('Untuk Pembayaran', labelX, 78);
      doc.text(':', colonX, 78);
      doc.text(
        `Invoice No. ${invoice.invoiceNumber} Tanggal ${tglKwitansi}`,
        valueX,
        78,
      );

      doc.text('Ref. PO', labelX, 86);
      doc.text(':', colonX, 86);
      doc.text(order.poNumber || '-', valueX, 86);

      doc.text(`Semarang, ${tglKwitansi}`, 145, 102);

      try {
        const stempelImg = await loadAsset(stempelImage);
        doc.addImage(stempelImg, 'PNG', 125, 106, 45, 14, undefined, 'FAST', 0);
        const ttdImg = await loadAsset(ttdImage);
        doc.addImage(ttdImg, 'PNG', 155, 100, 25, 18, undefined, 'FAST', 0);
      } catch (e) {
        console.warn('Asset gagal dimuat');
      }

      doc.setTextColor(0);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('( Dinny Elvandari Prinawati )', 142, 132);

      doc.save(`Kwitansi_${invoice.invoiceNumber}.pdf`);
    } catch (e) {
      alert('Error Cetak Kwitansi');
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
          <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm ring-1 ring-slate-200">
            <Receipt className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Daftar Tagihan
            </h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              Invoice History
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="h-11 bg-white border-none ring-1 ring-slate-200 shadow-sm text-xs font-bold text-slate-600 px-4 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <ArrowUpDown className="h-3.5 w-3.5 mr-2 text-indigo-600" />{' '}
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
          <Button
            onClick={handleOpenAdd}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl h-11 px-5 shadow-md transition-all active:scale-95"
          >
            <Plus className="mr-2 h-4 w-4" /> BUAT TAGIHAN
          </Button>

          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="bg-white rounded-xl border-none shadow-2xl">
              <DialogHeader>
                <DialogTitle className="font-bold">Invoice Baru</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold uppercase text-slate-400">
                    No. Tagihan (Auto-Generate)
                  </Label>
                  <Input
                    value={formData.invoiceNumber}
                    readOnly
                    className="h-9 font-bold bg-slate-100 text-slate-600 uppercase border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-600 cursor-not-allowed"
                    title="Nomor digenerate otomatis berdasarkan bulan dan tahun saat ini"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold uppercase text-slate-400">
                    Pilih PO
                  </Label>
                  <Select
                    value={formData.orderId}
                    onValueChange={(val) =>
                      setFormData({ ...formData, orderId: val })
                    }
                    required
                  >
                    <SelectTrigger className="h-9 bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-600 shadow-none">
                      <SelectValue placeholder="Pilih PO..." />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {orders.map((o) => (
                        <SelectItem key={o.id} value={o.id}>
                          {o.poNumber}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold uppercase text-slate-400">
                    Jatuh Tempo
                  </Label>
                  <Input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) =>
                      setFormData({ ...formData, dueDate: e.target.value })
                    }
                    required
                    className="h-9 font-semibold bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-bold uppercase tracking-widest text-xs mt-2 transition-all active:scale-95 shadow-md"
                >
                  SIMPAN
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="max-w-6xl mx-auto space-y-4">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
          <Input
            placeholder="Cari berdasarkan No. Tagihan atau Nomor PO..."
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
                    No. Tagihan
                  </TableHead>
                  <TableHead className="py-4 text-[10px] font-bold uppercase text-slate-400">
                    Tgl Terbit
                  </TableHead>
                  <TableHead className="py-4 text-[10px] font-bold uppercase text-slate-400">
                    Ref. PO
                  </TableHead>
                  <TableHead className="text-center py-4 text-[10px] font-bold uppercase text-slate-400">
                    Jatuh Tempo
                  </TableHead>
                  <TableHead className="text-right py-4 text-[10px] font-bold uppercase text-slate-400">
                    Total
                  </TableHead>
                  <TableHead className="pr-6 text-right py-4 text-[10px] font-bold uppercase text-slate-400">
                    Aksi
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-24 text-center">
                      <div className="flex flex-col items-center gap-2 opacity-40">
                        <FileText className="h-10 w-10 text-slate-400" />
                        <p className="text-xs font-bold uppercase italic text-slate-500">
                          Tidak ada tagihan ditemukan.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedInvoices.map((inv) => {
                    const relOrder = orders.find((o) => o.id === inv.orderId);
                    const issuedDate = new Date(
                      inv.createdAt || Date.now(),
                    ).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    });
                    return (
                      <TableRow
                        key={inv.id}
                        className="hover:bg-slate-50/50 border-b border-slate-50 last:border-none transition-colors"
                      >
                        <TableCell className="pl-6 py-4 font-black text-indigo-600 uppercase tracking-tight">
                          {inv.invoiceNumber}
                        </TableCell>
                        <TableCell className="py-4 font-bold text-slate-600 text-xs">
                          {issuedDate}
                        </TableCell>
                        <TableCell className="py-4 font-bold text-slate-800 text-xs uppercase">
                          {relOrder?.poNumber || '-'}
                        </TableCell>
                        <TableCell className="text-center py-4">
                          <span className="px-2 py-1 bg-amber-50 text-amber-700 ring-1 ring-amber-100 rounded-md text-[9px] font-bold whitespace-nowrap">
                            <Calendar className="inline h-3 w-3 mr-1" />{' '}
                            {new Date(inv.dueDate).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </TableCell>
                        <TableCell className="text-right py-4 font-black text-slate-900 text-xs">
                          Rp{' '}
                          {relOrder?.totalAmount.toLocaleString('id-ID') || 0}
                        </TableCell>
                        <TableCell className="pr-6 text-right py-4">
                          <div className="flex justify-end gap-1">
                            {relOrder && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    handlePrintInvoice(inv, relOrder)
                                  }
                                  className="h-8 w-8 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                                  title="Download Invoice PDF"
                                >
                                  <FileDown className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    handlePrintKwitansi(inv, relOrder)
                                  }
                                  className="h-8 w-8 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                                  title="Download Kwitansi Pelunasan"
                                >
                                  <FileDown className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
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
                | TOTAL {filteredAndSortedInvoices.length} ITEM
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
    </div>
  );
}
