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
  ClipboardList,
  Plus,
  ShoppingCart,
  Edit3,
  Trash2,
  PackagePlus,
  FileText,
  CalendarDays,
  Search,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Receipt,
  Clock,
} from 'lucide-react';
import { getOrders, createOrder, updateOrder } from '@/modules/orders/api';
import { getBranches } from '@/modules/branches/api';
import { getProducts } from '@/modules/products/api';
import { getOrderItems } from '@/modules/order-items/api';

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const currentActualYear = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentActualYear);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    poNumber: '',
    branchId: '',
    status: 'PENDING',
  });

  const [cartItems, setCartItems] = useState<any[]>([]);
  const [tempItem, setTempItem] = useState({
    productId: '',
    quantity: 1,
    clientItemCode: '',
  });

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      const [o, b, p] = await Promise.all([
        getOrders(),
        getBranches(),
        getProducts(),
      ]);
      setOrders(o);
      setBranches(b);
      setProducts(p);
    } catch (error) {
      console.error(error);
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

  const calculateCartTotal = () =>
    cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const handleProductSelect = (productId: string) => {
    const selectedProduct = products.find((p) => p.id === productId);
    setTempItem({
      ...tempItem,
      productId,
      clientItemCode: (selectedProduct as any)?.defaultClientSku || '',
    });
  };

  const handleAddToCart = () => {
    const product = products.find((p) => p.id === tempItem.productId);
    if (product) {
      const existing = cartItems.find((item) => item.productId === product.id);
      if (existing) {
        setCartItems(
          cartItems.map((item) =>
            item.productId === product.id
              ? {
                  ...item,
                  quantity: item.quantity + tempItem.quantity,
                  clientItemCode:
                    tempItem.clientItemCode || item.clientItemCode,
                }
              : item,
          ),
        );
      } else {
        setCartItems([
          ...cartItems,
          {
            productId: product.id,
            sku: product.sku,
            name: product.name,
            price: product.price,
            quantity: tempItem.quantity,
            clientItemCode: tempItem.clientItemCode,
          },
        ]);
      }
      setTempItem({ productId: '', quantity: 1, clientItemCode: '' });
    }
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({ poNumber: '', branchId: '', status: 'PENDING' });
    setCartItems([]);
    setTempItem({ productId: '', quantity: 1, clientItemCode: '' });
    setSelectedFile(null);
    setIsOpen(true);
  };

  const handleOpenEdit = async (order: any) => {
    setEditingId(order.id);
    setFormData({
      poNumber: order.poNumber,
      branchId: order.branchId,
      status: order.status,
    });
    try {
      const items = await getOrderItems(order.id);
      const mappedCart = items.map((it: any) => ({
        productId: it.productId,
        name: it.product.name,
        sku: it.product.sku,
        price: it.priceAtBuy,
        quantity: it.quantity,
        clientItemCode: it.clientItemCode || '',
      }));
      setCartItems(mappedCart);
    } catch (e) {
      console.error('Gagal load item');
    }
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        if (cartItems.length === 0)
          return alert('Keranjang tidak boleh kosong!');
        await updateOrder(editingId, {
          status: formData.status,
          totalAmount: calculateCartTotal(),
          items: cartItems,
        });
      } else {
        if (cartItems.length === 0)
          return alert('Pilih minimal 1 barang di keranjang!');
        if (!selectedFile) return alert('Berkas PDF wajib diunggah!');
        const submitData = new FormData();
        submitData.append('poNumber', formData.poNumber);
        submitData.append('branchId', formData.branchId);
        submitData.append('totalAmount', calculateCartTotal().toString());
        submitData.append('items', JSON.stringify(cartItems));
        submitData.append('file', selectedFile);
        await createOrder(submitData);
      }
      setIsOpen(false);
      fetchData();
    } catch (error) {
      alert('Gagal menyimpan PO!');
    }
  };

  const handleOpenDetail = async (order: any) => {
    setSelectedOrder(order);
    setOrderItems([]);
    setIsDetailOpen(true);
    const items = await getOrderItems(order.id);
    setOrderItems(items);
  };

  // --- LOGIKA UPDATE STATUS PEMBAYARAN MENGGUNAKAN DROPDOWN ---
  const handleUpdatePaymentStatus = async (order: any, nextStatus: string) => {
    try {
      // Optimistic UI Update (Agar terasa instan saat dipilih)
      setOrders(
        orders.map((o) =>
          o.id === order.id ? { ...o, paymentStatus: nextStatus } : o,
        ),
      );

      // Kirim request ke backend
      await updateOrder(order.id, { paymentStatus: nextStatus });
    } catch (error) {
      alert('Gagal memperbarui status pembayaran.');
      fetchData(); // Rollback UI jika gagal
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-amber-50 text-amber-700 ring-amber-100';
      case 'DIPROSES':
        return 'bg-indigo-50 text-indigo-700 ring-indigo-100';
      case 'DIKIRIM':
        return 'bg-blue-50 text-blue-700 ring-blue-100';
      case 'SELESAI':
        return 'bg-emerald-50 text-emerald-700 ring-emerald-100';
      case 'BATAL':
        return 'bg-rose-50 text-rose-700 ring-rose-100';
      default:
        return 'bg-slate-50 text-slate-700 ring-slate-100';
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
            <ClipboardList className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Daftar Pesanan (PO)
            </h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              Manajemen Transaksi Klien
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
          <Button
            onClick={handleOpenAdd}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl h-11 px-5 shadow-md transition-all active:scale-95"
          >
            <Plus className="mr-2 h-4 w-4" /> BUAT PO BARU
          </Button>
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
                    Cabang Klien
                  </TableHead>
                  <TableHead className="py-4 text-[10px] font-bold uppercase text-slate-400 text-right">
                    Total Nilai
                  </TableHead>
                  <TableHead className="py-4 text-[10px] font-bold uppercase text-slate-400 text-center">
                    Status PO
                  </TableHead>
                  {/* KOLOM PEMBAYARAN */}
                  <TableHead className="py-4 text-[10px] font-bold uppercase text-slate-400 text-center">
                    Pembayaran
                  </TableHead>
                  <TableHead className="pr-6 py-4 text-[10px] font-bold uppercase text-slate-400 text-right">
                    Aksi
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-24 text-center">
                      <div className="flex flex-col items-center gap-2 opacity-40">
                        <FileText className="h-10 w-10 text-slate-400" />
                        <p className="text-xs font-bold uppercase italic text-slate-500">
                          Tidak ada pesanan ditemukan.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedOrders.map((order) => {
                    const branch = branches.find(
                      (b) => b.id === order.branchId,
                    );
                    const formattedDate = new Date(
                      order.createdAt,
                    ).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    });

                    const paymentStatus = order.paymentStatus || 'BELUM';

                    return (
                      <TableRow
                        key={order.id}
                        className="hover:bg-slate-50/50 border-b border-slate-50 last:border-none transition-colors"
                      >
                        <TableCell className="pl-6 py-4">
                          <span className="font-black text-slate-800 uppercase tracking-tight">
                            {order.poNumber}
                          </span>
                        </TableCell>
                        <TableCell className="py-4">
                          <span className="font-bold text-slate-600 text-xs">
                            {formattedDate}
                          </span>
                        </TableCell>
                        <TableCell className="py-4">
                          <span className="font-bold text-slate-600 text-xs">
                            {branch?.name || '-'}
                          </span>
                        </TableCell>
                        <TableCell className="py-4 text-right">
                          <span className="font-black text-slate-900 text-xs">
                            Rp {order.totalAmount.toLocaleString('id-ID')}
                          </span>
                        </TableCell>
                        <TableCell className="py-4 text-center">
                          <span
                            className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase ring-1 ${getStatusColor(order.status)}`}
                          >
                            {order.status}
                          </span>
                        </TableCell>

                        {/* DROPDOWN STATUS PEMBAYARAN */}
                        <TableCell className="py-4 text-center">
                          <Select
                            value={paymentStatus}
                            onValueChange={(val) =>
                              handleUpdatePaymentStatus(order, val)
                            }
                          >
                            <SelectTrigger
                              className={`w-[130px] mx-auto h-8 text-[9px] font-black uppercase tracking-wider border-none shadow-sm ring-1 transition-all focus:ring-2 ${
                                paymentStatus === 'LUNAS'
                                  ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                                  : paymentStatus === 'DITAGIHKAN'
                                    ? 'bg-indigo-50 text-indigo-700 ring-indigo-200'
                                    : 'bg-slate-50 text-slate-500 ring-slate-200'
                              }`}
                            >
                              <div className="flex items-center gap-1.5">
                                {paymentStatus === 'LUNAS' && (
                                  <CheckCircle2 className="h-3 w-3" />
                                )}
                                {paymentStatus === 'DITAGIHKAN' && (
                                  <Receipt className="h-3 w-3" />
                                )}
                                {paymentStatus === 'BELUM' && (
                                  <Clock className="h-3 w-3" />
                                )}
                                <SelectValue placeholder="Status" />
                              </div>
                            </SelectTrigger>
                            <SelectContent className="bg-white">
                              <SelectItem
                                value="BELUM"
                                className="text-[10px] font-bold text-slate-600"
                              >
                                BELUM
                              </SelectItem>
                              <SelectItem
                                value="DITAGIHKAN"
                                className="text-[10px] font-bold text-indigo-600"
                              >
                                DITAGIHKAN
                              </SelectItem>
                              <SelectItem
                                value="LUNAS"
                                className="text-[10px] font-bold text-emerald-600"
                              >
                                LUNAS
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>

                        <TableCell className="pr-6 py-4 text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDetail(order)}
                              className="h-8 w-8 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                            >
                              <ShoppingCart className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenEdit(order)}
                              className="h-8 w-8 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg"
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
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

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-2xl bg-white rounded-xl p-6 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="font-bold">
              {editingId ? 'Ubah Pesanan (PO)' : 'Buat Pesanan Baru'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-slate-400">
                  Nomor PO
                </Label>
                <Input
                  value={formData.poNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, poNumber: e.target.value })
                  }
                  required
                  disabled={!!editingId}
                  className="h-9 font-bold bg-slate-50 uppercase border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-600"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-slate-400">
                  Cabang
                </Label>
                <Select
                  value={formData.branchId}
                  onValueChange={(val) =>
                    setFormData({ ...formData, branchId: val })
                  }
                  required
                  disabled={!!editingId}
                >
                  <SelectTrigger className="h-9 bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-600 shadow-none">
                    <SelectValue placeholder="Pilih..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {editingId && (
              <div className="space-y-1 border-t pt-3">
                <Label className="text-[10px] font-bold uppercase text-slate-400">
                  Status Pesanan
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(val) =>
                    setFormData({ ...formData, status: val })
                  }
                  required
                >
                  <SelectTrigger className="h-9 bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-600 shadow-none">
                    <SelectValue placeholder="Pilih Status..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="PENDING">PENDING</SelectItem>
                    <SelectItem value="DIPROSES">DIPROSES</SelectItem>
                    <SelectItem value="DIKIRIM">DIKIRIM</SelectItem>
                    <SelectItem value="SELESAI">SELESAI</SelectItem>
                    <SelectItem value="BATAL">BATAL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="p-3 bg-slate-50 rounded-lg border border-dashed border-slate-200 space-y-3">
              <div className="flex gap-2 items-center text-indigo-600">
                <PackagePlus className="h-4 w-4" />
                <span className="text-[10px] font-bold uppercase">
                  Keranjang Barang
                </span>
              </div>
              <div className="flex gap-2">
                <Select
                  value={tempItem.productId}
                  onValueChange={handleProductSelect}
                >
                  <SelectTrigger className="h-8 text-xs bg-white w-2/5 border-none ring-1 ring-slate-200 shadow-none">
                    <SelectValue placeholder="Pilih Produk..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id} className="text-xs">
                        {p.sku} - {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="SKU Klien (Opsional)"
                  value={tempItem.clientItemCode}
                  onChange={(e) =>
                    setTempItem({ ...tempItem, clientItemCode: e.target.value })
                  }
                  className="h-8 text-xs bg-white w-2/5 font-semibold placeholder:text-slate-300 border-none ring-1 ring-slate-200"
                />
                <Input
                  type="number"
                  min="1"
                  value={tempItem.quantity}
                  onChange={(e) =>
                    setTempItem({
                      ...tempItem,
                      quantity: Number(e.target.value),
                    })
                  }
                  className="w-16 h-8 text-xs text-center font-bold bg-white border-none ring-1 ring-slate-200"
                />
                <Button
                  type="button"
                  onClick={handleAddToCart}
                  className="h-8 bg-indigo-600 hover:bg-indigo-700 shadow-sm"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {cartItems.length > 0 && (
                <div className="bg-white rounded border border-slate-200">
                  <table className="w-full text-[10px]">
                    <thead className="bg-slate-100 font-bold uppercase text-slate-400">
                      <tr>
                        <th className="p-2 text-left">Produk</th>
                        <th className="p-2 text-center">Kode Klien</th>
                        <th className="p-2 text-center">Qty</th>
                        <th className="p-2 text-right">Subtotal</th>
                        <th className="p-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {cartItems.map((item, i) => (
                        <tr key={i} className="border-t border-slate-100">
                          <td className="p-2 font-semibold">
                            {item.name} <br />
                            <span className="text-[8px] text-slate-400 font-normal">
                              Internal: {item.sku}
                            </span>
                          </td>
                          <td className="p-2 text-center font-bold text-slate-600">
                            {item.clientItemCode || '-'}
                          </td>
                          <td className="p-2 text-center font-bold">
                            {item.quantity}
                          </td>
                          <td className="p-2 text-right font-bold text-slate-800">
                            Rp {(item.price * item.quantity).toLocaleString()}
                          </td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() =>
                                setCartItems(
                                  cartItems.filter((_, idx) => idx !== i),
                                )
                              }
                              className="p-1 hover:bg-rose-50 rounded"
                            >
                              <Trash2 className="h-3 w-3 text-rose-500 mx-auto" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {!editingId && (
              <div className="space-y-1 p-3 bg-amber-50 rounded-lg border border-amber-100">
                <div className="flex gap-2 items-center text-amber-700 mb-2">
                  <FileText className="h-4 w-4" />
                  <span className="text-[10px] font-bold uppercase">
                    Unggah Berkas PO (PDF)
                  </span>
                </div>
                <Input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  required
                  className="h-10 text-xs py-2 bg-white border-none ring-1 ring-amber-200"
                />
              </div>
            )}
            <div className="flex justify-between p-3 bg-indigo-600 rounded-lg text-white shadow-inner">
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">
                Total Nilai Otomatis
              </span>
              <span className="text-lg font-bold">
                Rp {calculateCartTotal().toLocaleString('id-ID')}
              </span>
            </div>
            <Button
              type="submit"
              className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-bold uppercase text-xs tracking-widest border-none transition-all active:scale-95 shadow-md"
            >
              {editingId ? 'SIMPAN PERUBAHAN' : 'SIMPAN PO BARU & PDF'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-2xl bg-white rounded-xl p-0 border-none shadow-2xl">
          <div className="p-6 bg-slate-50 border-b">
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-indigo-600" /> Rincian{' '}
              {selectedOrder?.poNumber}
            </DialogTitle>
          </div>
          <div className="p-6">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow className="font-bold text-[9px] uppercase border-b border-slate-200">
                  <TableHead className="pl-4 py-3">Barang</TableHead>
                  <TableHead className="text-center py-3">Kode Klien</TableHead>
                  <TableHead className="text-center py-3">Jumlah</TableHead>
                  <TableHead className="text-right py-3 pr-4">
                    Subtotal
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orderItems.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center py-6 text-xs text-slate-400 italic"
                    >
                      PO ini dibuat menggunakan versi lama (tanpa barang) atau
                      kosong.
                    </TableCell>
                  </TableRow>
                ) : (
                  orderItems.map((item) => (
                    <TableRow
                      key={item.id}
                      className="text-xs border-b border-slate-100 last:border-none"
                    >
                      <td className="p-3 pl-4">
                        <span className="font-bold block text-slate-800">
                          {item.product.name}
                        </span>
                      </td>
                      <td className="p-3 text-center font-bold text-slate-500">
                        {item.clientItemCode || '-'}
                      </td>
                      <td className="p-3 text-center font-bold text-slate-800">
                        {item.quantity}
                      </td>
                      <td className="p-3 text-right font-bold text-indigo-600 pr-4">
                        Rp {(item.priceAtBuy * item.quantity).toLocaleString()}
                      </td>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
