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
  AlertTriangle,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { getInvoices, createInvoice } from '@/modules/invoices/api';
import { getOrders } from '@/modules/orders/api';
import { getBranches } from '@/modules/branches/api';
import { getOrderItems } from '@/modules/order-items/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/page-header';
import { PaginationFooter } from '@/components/shared/pagination-footer';
import { Skeleton } from '@/components/shared/skeleton';
import { useUserRole } from '@/hooks/useUserRole';

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
  const n = Math.round(nominal);
  if (n === 0) return ' Nol';
  let temp = '';
  if (n < 12) temp = ' ' + bilangan[n];
  else if (n < 20) temp = terbilang(n - 10) + ' Belas';
  else if (n < 100)
    temp = terbilang(Math.floor(n / 10)) + ' Puluh' + terbilang(n % 10);
  else if (n < 200) temp = ' Seratus' + terbilang(n - 100);
  else if (n < 1000)
    temp = terbilang(Math.floor(n / 100)) + ' Ratus' + terbilang(n % 100);
  else if (n < 2000) temp = ' Seribu' + terbilang(n - 1000);
  else if (n < 1000000)
    temp = terbilang(Math.floor(n / 1000)) + ' Ribu' + terbilang(n % 1000);
  else if (n < 1000000000)
    temp =
      terbilang(Math.floor(n / 1000000)) + ' Juta' + terbilang(n % 1000000);
  return temp;
}

export default function InvoicesPage() {
  const { canManage } = useUserRole();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [isSubmitting, setIsSubmitting] = useState(false);

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
  const currentActualYear = new Date().getFullYear();
  const years = [
    currentActualYear,
    currentActualYear - 1,
    currentActualYear - 2,
  ];

  const fetchData = async () => {
    setIsError(false);
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
      setIsError(true);
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
    setIsSubmitting(true);
    try {
      await createInvoice({
        ...formData,
        dueDate: new Date(formData.dueDate).toISOString(),
      });
      toast.success('Tagihan baru berhasil dibuat');
      setIsOpen(false);
      fetchData();
      setFormData({ invoiceNumber: '', dueDate: '', orderId: '' });
    } catch (e) {
      toast.error('Gagal! Mungkin Nomor Invoice duplikat.');
    } finally {
      setIsSubmitting(false);
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
        // REVISI: Proporsi dikembalikan ke 5:4 (Lebar 20, Tinggi 16) agar bulat sempurna
        doc.addImage(logoImg, 'PNG', 14, 10, 20, 16);
      } catch (e) {
        console.warn('Logo gagal dimuat');
      }

      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      // REVISI: Teks digeser mepet ke logo
      doc.text('CV. BERDIKARI BERKAH BERSAMA', 38, 18);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100);
      doc.text('Jl. Bulustalan V 653F, Semarang | Telp: 083842319061', 38, 24);
      doc.text('Email: cv.berdikari.berkah.bersama@gmail.com', 38, 29);

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
          0: { cellWidth: 10 }, // Kolom No dilebarkan
          1: { cellWidth: 26 },
          // Kolom 2 (Deskripsi) akan memakan sisa ruang otomatis
          3: { cellWidth: 12 },
          4: { cellWidth: 26 },
          5: { cellWidth: 32 },
        },
      });

      // @ts-ignore
      let finalY = doc.lastAutoTable.finalY || 150;

      // LOGIKA AUTO-PAGE BREAK
      if (finalY > 210) {
        doc.addPage();
        finalY = 20;
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
      toast.error('Error Cetak Invoice');
    }
  };

  // --- FUNGSI CETAK KWITANSI (FORMAT KLASIK) ---
  const handlePrintKwitansi = async (invoice: any, order: any) => {
    try {
      const doc = new jsPDF({ format: 'a5', orientation: 'landscape' });
      doc.rect(5, 5, 200, 138);

      try {
        const logoImg = await loadAsset(logoBerdikari);
        doc.addImage(logoImg, 'PNG', 10, 10, 15, 12);
      } catch (e) {
        console.warn('Logo gagal dimuat');
      }

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('CV. BERDIKARI BERKAH BERSAMA', 28, 14);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('Jl. Bulustalan V 653F, Semarang', 28, 18);

      const kwitansiNo = invoice.invoiceNumber.replace('INV', 'KWT');

      // NOMOR KWITANSI DI KANAN ATAS
      doc.setFontSize(10);
      doc.text(`Nomor : ${kwitansiNo}`, 145, 15);

      // JUDUL KWITANSI
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('KWITANSI', 105, 30, { align: 'center' });

      const labelX = 10;
      const colonX = 45;
      const valueX = 48;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');

      // 1. TELAH TERIMA DARI
      doc.text('Telah terima dari', labelX, 45);
      doc.text(':', colonX, 45);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('PT. REKSO NATIONAL FOOD', valueX, 45);

      // 2. JUMLAH PEMBAYARAN (TERBILANG)
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Jumlah Pembayaran', labelX, 58);
      doc.text(':', colonX, 58);

      const teksTerbilang = terbilang(order.totalAmount)
        .replace(/\s+/g, ' ')
        .trim();

      doc.setFillColor(235, 235, 235);
      doc.rect(valueX - 2, 51, 145, 10, 'F');
      doc.setFont('helvetica', 'bolditalic');
      doc.setFontSize(10);
      doc.text(`## ${teksTerbilang} Rupiah ##`, valueX, 58, { maxWidth: 140 });

      // 3. UNTUK PEMBAYARAN
      const tglKwitansi = new Date(
        invoice.issuedDate || invoice.createdAt || Date.now(),
      ).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('Untuk Pembayaran', labelX, 72);
      doc.text(':', colonX, 72);
      doc.text(
        `Invoice No. ${invoice.invoiceNumber} Tanggal ${tglKwitansi}`,
        valueX,
        72,
      );

      // 4. KOTAK NOMINAL DI KIRI BAWAH
      doc.setLineWidth(0.5);
      doc.rect(10, 95, 65, 15);
      doc.setFillColor(245, 245, 245);
      doc.rect(10.5, 95.5, 64, 14, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text(`Rp ${order.totalAmount.toLocaleString('id-ID')}`, 42.5, 105, {
        align: 'center',
      });

      // 5. TANDA TANGAN & STEMPEL DI KANAN BAWAH
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Semarang, ${tglKwitansi}`, 135, 95);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('CV. BERDIKARI BERKAH BERSAMA', 135, 100);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('083842319061 / 081905540797', 135, 104);

      try {
        const stempelImg = await loadAsset(stempelImage);
        doc.addImage(stempelImg, 'PNG', 120, 106, 45, 14, undefined, 'FAST', 0);
        const ttdImg = await loadAsset(ttdImage);
        doc.addImage(ttdImg, 'PNG', 150, 102, 25, 18, undefined, 'FAST', 0);
      } catch (e) {
        console.warn('Asset gagal dimuat');
      }

      doc.setTextColor(0);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Dinny Elvandari Prinawati', 140, 130);
      doc.setLineWidth(0.3);
      doc.line(140, 131, 185, 131); // Garis bawah nama

      doc.save(`Kwitansi_${invoice.invoiceNumber}.pdf`);
    } catch (e) {
      toast.error('Error Cetak Kwitansi');
    }
  };

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="h-14 w-14 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
          <AlertTriangle className="h-7 w-7 text-destructive" />
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-2">Gagal Memuat Tagihan</h2>
        <p className="text-sm text-muted-foreground max-w-md mb-6">
          Tidak dapat memuat data tagihan. Periksa koneksi server atau coba lagi.
        </p>
        <Button onClick={fetchData} className="gap-2">
          <RefreshCw className="h-4 w-4" /> Coba Lagi
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-full space-y-6">
        <div className="h-10 w-64 rounded-lg bg-muted/70 animate-pulse" />
        <div className="h-12 rounded-xl bg-muted/70 animate-pulse" />
        <div className="bg-white rounded-xl shadow-sm ring-1 ring-border overflow-hidden">
          <div className="p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-20" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full space-y-6">
      <PageHeader icon={Receipt} title="Daftar Tagihan" subtitle="Invoice History">
        <Button
          variant="outline"
          onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
          className="h-9 bg-white ring-1 ring-border text-xs font-semibold text-muted-foreground px-4 rounded-xl hover:bg-muted"
        >
          <ArrowUpDown className="h-3.5 w-3.5 mr-2 text-brand-800" />
          {sortOrder === 'desc' ? 'TERBARU' : 'TERLAMA'}
        </Button>
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl ring-1 ring-border h-9">
          <CalendarDays className="h-4 w-4 text-muted-foreground ml-1" />
          <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(Number(v))}>
            <SelectTrigger className="w-[110px] h-7 border-none font-semibold text-xs shadow-none focus:ring-0">
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
          <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(Number(v))}>
            <SelectTrigger className="w-[80px] h-7 border-none font-semibold text-xs shadow-none focus:ring-0">
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
        {canManage && (
          <Button
            onClick={handleOpenAdd}
            className="h-9 bg-brand-800 hover:bg-brand-900 text-white font-semibold text-xs rounded-xl px-5 shadow-md transition-all active:scale-95"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Buat Tagihan
          </Button>
        )}

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="bg-white rounded-xl border-none shadow-2xl">
              <DialogHeader>
                <DialogTitle className="font-bold">Invoice Baru</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold uppercase text-muted-foreground">
                    No. Tagihan (Auto-Generate)
                  </Label>
                  <Input
                    value={formData.invoiceNumber}
                    readOnly
                    className="h-9 font-bold bg-muted text-muted-foreground uppercase border-none ring-1 ring-border focus:ring-2 focus:ring-brand-800 cursor-not-allowed"
                    title="Nomor digenerate otomatis berdasarkan bulan dan tahun saat ini"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold uppercase text-muted-foreground">
                    Pilih PO
                  </Label>
                  <Select
                    value={formData.orderId}
                    onValueChange={(val) =>
                      setFormData({ ...formData, orderId: val })
                    }
                    required
                  >
                    <SelectTrigger className="h-9 bg-muted border-none ring-1 ring-border focus:ring-2 focus:ring-brand-800 shadow-none">
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
                  <Label className="text-xs font-semibold uppercase text-muted-foreground">
                    Jatuh Tempo
                  </Label>
                  <Input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) =>
                      setFormData({ ...formData, dueDate: e.target.value })
                    }
                    required
                    className="h-9 font-semibold bg-muted border-none ring-1 ring-border focus:ring-2 focus:ring-brand-800"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-10 bg-brand-800 hover:bg-brand-900 text-white font-bold uppercase tracking-widest text-xs mt-2 transition-all active:scale-95 shadow-md"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'SIMPAN'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
      </PageHeader>

      <div className="space-y-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari No. Tagihan atau PO..."
            className="pl-10 h-11 bg-white ring-1 ring-border rounded-xl focus:ring-2 focus:ring-brand-800 transition-all text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden ring-1 ring-border flex flex-col">
          <div className="flex-1 overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted">
                <TableRow className="border-b border-border">
                  <TableHead className="pl-6 py-4 text-xs font-semibold uppercase text-muted-foreground">
                    No. Tagihan
                  </TableHead>
                  <TableHead className="py-4 text-xs font-semibold uppercase text-muted-foreground">
                    Tgl Terbit
                  </TableHead>
                  <TableHead className="py-4 text-xs font-semibold uppercase text-muted-foreground">
                    Ref. PO
                  </TableHead>
                  <TableHead className="text-center py-4 text-xs font-semibold uppercase text-muted-foreground">
                    Jatuh Tempo
                  </TableHead>
                  <TableHead className="text-right py-4 text-xs font-semibold uppercase text-muted-foreground">
                    Total
                  </TableHead>
                  <TableHead className="pr-6 text-right py-4 text-xs font-semibold uppercase text-muted-foreground">
                    Aksi
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-24 text-center">
                      <div className="flex flex-col items-center gap-2 opacity-40">
                        <FileText className="h-10 w-10 text-muted-foreground" />
                        <p className="text-xs font-bold uppercase italic text-muted-foreground">
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
                        className="hover:bg-muted/50 border-b border-border/50 last:border-none transition-colors"
                      >
                        <TableCell className="pl-6 py-4 font-bold text-brand-800 uppercase tracking-tight">
                          {inv.invoiceNumber}
                        </TableCell>
                        <TableCell className="py-4 font-bold text-muted-foreground text-xs">
                          {issuedDate}
                        </TableCell>
                        <TableCell className="py-4 font-bold text-foreground text-xs uppercase">
                          {relOrder?.poNumber || '-'}
                        </TableCell>
                        <TableCell className="text-center py-4">
                          <span className="px-2 py-1 bg-amber-50 text-amber-700 ring-1 ring-amber-100 rounded-md text-[10px] font-bold whitespace-nowrap">
                            <Calendar className="inline h-3 w-3 mr-1" />{' '}
                            {new Date(inv.dueDate).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </TableCell>
                        <TableCell className="text-right py-4 font-bold text-foreground text-xs">
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
                                  className="h-8 w-8 text-brand-800 hover:bg-brand-50 rounded-lg"
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

          <PaginationFooter
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredAndSortedInvoices.length}
            onPageChange={setCurrentPage}
            label="TAGIHAN"
          />
        </div>
      </div>
    </div>
  );
}
