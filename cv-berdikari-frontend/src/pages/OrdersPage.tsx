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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
  AlertTriangle,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { getOrders, createOrder, updateOrder } from '@/modules/orders/api';
import { getBranches } from '@/modules/branches/api';
import { getProducts } from '@/modules/products/api';
import { getOrderItems } from '@/modules/order-items/api';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/page-header';
import { PaginationFooter } from '@/components/shared/pagination-footer';
import { Skeleton } from '@/components/shared/skeleton';
import { useUserRole } from '@/hooks/useUserRole';

export default function OrdersPage() {
  const { canManage } = useUserRole();
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

  const [productSearchTerm, setProductSearchTerm] = useState('');

  const [selectOpen, setSelectOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

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

  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const [isError, setIsError] = useState(false);

  const fetchData = async () => {
    setIsError(false);
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
    let clientItemCode = '';

    if (selectedProduct && formData.branchId) {
      const selectedBranch = branches.find((b) => b.id === formData.branchId);
      const branchRegionId = selectedBranch?.regionId;
      if (branchRegionId && (selectedProduct as any).regionPrices) {
        const matched = (selectedProduct as any).regionPrices.find(
          (rp: any) => rp.regionId === branchRegionId,
        );
        if (matched?.clientSku) {
          clientItemCode = matched.clientSku;
        }
      }
    }

    setTempItem({
      ...tempItem,
      productId,
      clientItemCode,
    });
    setProductSearchTerm('');
  };

  const handleAddToCart = () => {
    if (!formData.branchId) {
      toast.error(
        'Mohon pilih Cabang Klien terlebih dahulu agar sistem dapat menyesuaikan harga wilayah!',
      );
      return;
    }

    const product = products.find((p) => p.id === tempItem.productId);
    if (product) {
      const selectedBranch = branches.find((b) => b.id === formData.branchId);
      const branchRegionId = selectedBranch?.regionId;

      let finalPrice = product.price;

      if (branchRegionId && (product as any).regionPrices) {
        const specialPriceData = (product as any).regionPrices.find(
          (rp: any) => rp.regionId === branchRegionId,
        );

        if (specialPriceData) {
          finalPrice = specialPriceData.price;
        }
      }

      setCartItems((prevCart) => {
        const existing = prevCart.find((item) => item.productId === product.id);

        if (existing) {
          return prevCart.map((item) =>
            item.productId === product.id
              ? {
                  ...item,
                  quantity: item.quantity + tempItem.quantity,
                  clientItemCode:
                    tempItem.clientItemCode || item.clientItemCode,
                }
              : item,
          );
        } else {
          return [
            ...prevCart,
            {
              productId: product.id,
              sku: product.sku,
              name: product.name,
              price: finalPrice,
              quantity: tempItem.quantity,
              clientItemCode: tempItem.clientItemCode,
            },
          ];
        }
      });

      setTempItem({ productId: '', quantity: 1, clientItemCode: '' });
      setProductSearchTerm('');
    }
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({ poNumber: '', branchId: '', status: 'PENDING' });
    setCartItems([]);
    setTempItem({ productId: '', quantity: 1, clientItemCode: '' });
    setSelectedFile(null);
    setProductSearchTerm('');
    setIsOpen(true);
  };

  const handleOpenEdit = async (order: any) => {
    setEditingId(order.id);
    setFormData({
      poNumber: order.poNumber,
      branchId: order.branchId,
      status: order.status,
    });
    setProductSearchTerm('');
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
    setIsSubmitting(true);
    try {
      if (editingId) {
        if (cartItems.length === 0)
          return toast.error('Keranjang tidak boleh kosong!');
        await updateOrder(editingId, {
          status: formData.status,
          items: cartItems,
        });
        toast.success('PO berhasil diperbarui');
      } else {
        if (cartItems.length === 0)
          return toast.error('Pilih minimal 1 barang di keranjang!');
        if (!selectedFile) return toast.error('Berkas PDF wajib diunggah!');
        const submitData = new FormData();
        submitData.append('poNumber', formData.poNumber);
        submitData.append('branchId', formData.branchId);
        submitData.append('items', JSON.stringify(cartItems));
        submitData.append('file', selectedFile);
        await createOrder(submitData);
        toast.success('PO baru berhasil dibuat');
      }
      setIsOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Gagal menyimpan PO!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDetail = async (order: any) => {
    setSelectedOrder(order);
    setOrderItems([]);
    setIsDetailOpen(true);
    const items = await getOrderItems(order.id);
    setOrderItems(items);
  };

  const handleUpdatePaymentStatus = async (order: any, nextStatus: string) => {
    try {
      setOrders(
        orders.map((o) =>
          o.id === order.id ? { ...o, paymentStatus: nextStatus } : o,
        ),
      );
      await updateOrder(order.id, { paymentStatus: nextStatus });
    } catch (error) {
      toast.error('Gagal memperbarui status pembayaran.');
      fetchData();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-amber-50 text-amber-700 ring-amber-100';
      case 'DIPROSES':
        return 'bg-violet-50 text-violet-700 ring-violet-100';
      case 'DIKIRIM':
        return 'bg-blue-50 text-blue-700 ring-blue-100';
      case 'SELESAI':
        return 'bg-emerald-50 text-emerald-700 ring-emerald-100';
      case 'BATAL':
        return 'bg-rose-50 text-rose-700 ring-rose-100';
      default:
        return 'bg-muted text-foreground ring-border';
    }
  };

  const filteredProducts = products.filter((p) =>
    `${p.sku} ${p.name}`
      .toLowerCase()
      .includes(productSearchTerm.toLowerCase()),
  );

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="h-14 w-14 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
          <AlertTriangle className="h-7 w-7 text-destructive" />
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-2">Gagal Memuat Pesanan</h2>
        <p className="text-sm text-muted-foreground max-w-md mb-6">
          Tidak dapat memuat data pesanan. Periksa koneksi server atau coba lagi.
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
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-32" />
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
      <PageHeader icon={ClipboardList} title="Daftar Pesanan (PO)" subtitle="Manajemen Transaksi Klien">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="h-11 bg-white border-none shadow-sm ring-1 ring-border text-xs font-bold text-muted-foreground px-4 rounded-xl hover:bg-muted transition-colors"
          >
            <ArrowUpDown className="h-3.5 w-3.5 mr-2 text-brand-800" />
            {sortOrder === 'desc' ? 'TERBARU' : 'TERLAMA'}
          </Button>
          <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl shadow-sm ring-1 ring-border h-11">
            <CalendarDays className="h-4 w-4 text-muted-foreground ml-2" />
            <Select
              value={selectedMonth.toString()}
              onValueChange={(v) => setSelectedMonth(Number(v))}
            >
              <SelectTrigger className="w-[130px] h-8 border-none font-bold text-xs shadow-none focus:ring-0">
                <SelectValue placeholder="Bulan" />
              </SelectTrigger>
              <SelectContent
                position="popper"
                className="bg-white max-h-[300px] overflow-y-auto"
              >
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
              <SelectContent
                position="popper"
                className="bg-white max-h-[300px] overflow-y-auto"
              >
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
              className="bg-brand-800 hover:bg-brand-900 text-white font-semibold text-xs rounded-xl h-11 px-5 shadow-md transition-all active:scale-95"
            >
              <Plus className="mr-2 h-4 w-4" /> Buat PO Baru
            </Button>
          )}
        </div>
      </PageHeader>

      <div className="space-y-6">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-brand-800 transition-colors" />
          <Input
            placeholder="Cari berdasarkan Nomor PO..."
            className="pl-11 h-12 bg-white border-none ring-1 ring-border rounded-xl shadow-sm focus:ring-2 focus:ring-brand-800 transition-all font-medium text-sm"
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
                    Nomor PO
                  </TableHead>
                  <TableHead className="py-4 text-xs font-semibold uppercase text-muted-foreground">
                    Tanggal
                  </TableHead>
                  <TableHead className="py-4 text-xs font-semibold uppercase text-muted-foreground">
                    Cabang Klien
                  </TableHead>
                  <TableHead className="py-4 text-xs font-semibold uppercase text-muted-foreground text-right">
                    Total Nilai
                  </TableHead>
                  <TableHead className="py-4 text-xs font-semibold uppercase text-muted-foreground text-center">
                    Status PO
                  </TableHead>
                  <TableHead className="py-4 text-xs font-semibold uppercase text-muted-foreground text-center">
                    Pembayaran
                  </TableHead>
                  <TableHead className="pr-6 py-4 text-xs font-semibold uppercase text-muted-foreground text-right">
                    Aksi
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-24 text-center">
                      <div className="flex flex-col items-center gap-2 opacity-40">
                        <FileText className="h-10 w-10 text-muted-foreground" />
                        <p className="text-xs font-bold uppercase italic text-muted-foreground">
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

                    const paymentStatus = order.paymentStatus || 'UNPAID';

                    return (
                      <TableRow
                        key={order.id}
                        className="hover:bg-muted/50 border-b border-border/50 last:border-none transition-colors"
                      >
                        <TableCell className="pl-6 py-4">
                          <span className="font-bold text-foreground uppercase tracking-tight">
                            {order.poNumber}
                          </span>
                        </TableCell>
                        <TableCell className="py-4">
                          <span className="font-bold text-muted-foreground text-xs">
                            {formattedDate}
                          </span>
                        </TableCell>
                        <TableCell className="py-4">
                          <span className="font-bold text-muted-foreground text-xs">
                            {branch?.name || '-'}
                          </span>
                        </TableCell>
                        <TableCell className="py-4 text-right">
                          <span className="font-bold text-foreground text-xs">
                            Rp {order.totalAmount.toLocaleString('id-ID')}
                          </span>
                        </TableCell>
                        <TableCell className="py-4 text-center">
                          <span
                            className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase ring-1 ${getStatusColor(order.status)}`}
                          >
                            {order.status}
                          </span>
                        </TableCell>

                        <TableCell className="py-4 text-center">
                          <Select
                            value={paymentStatus}
                            onValueChange={(val) =>
                              handleUpdatePaymentStatus(order, val)
                            }
                          >
                            <SelectTrigger
                              className={`w-[130px] mx-auto h-8 text-[10px] font-bold uppercase tracking-wider border-none shadow-sm ring-1 transition-all focus:ring-2 ${
                                paymentStatus === 'PAID'
                                  ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                                  : paymentStatus === 'PARTIAL'
                                    ? 'bg-brand-50 text-brand-900 ring-brand-200'
                                    : 'bg-muted text-muted-foreground ring-border'
                              }`}
                            >
                              <div className="flex items-center gap-1.5">
                                {paymentStatus === 'PAID' && (
                                  <CheckCircle2 className="h-3 w-3" />
                                )}
                                {paymentStatus === 'PARTIAL' && (
                                  <Receipt className="h-3 w-3" />
                                )}
                                {paymentStatus === 'UNPAID' && (
                                  <Clock className="h-3 w-3" />
                                )}
                                <SelectValue placeholder="Status" />
                              </div>
                            </SelectTrigger>
                            <SelectContent
                              position="popper"
                              className="bg-white"
                            >
                              <SelectItem
                                value="UNPAID"
                                className="text-[10px] font-bold text-muted-foreground"
                              >
                                UNPAID
                              </SelectItem>
                              <SelectItem
                                value="PARTIAL"
                                className="text-[10px] font-bold text-brand-800"
                              >
                                PARTIAL
                              </SelectItem>
                              <SelectItem
                                value="PAID"
                                className="text-[10px] font-bold text-emerald-600"
                              >
                                PAID
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
                              className="h-8 w-8 text-brand-800 hover:bg-brand-50 rounded-lg"
                            >
                              <ShoppingCart className="h-4 w-4" />
                            </Button>
                            {canManage && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenEdit(order)}
                                className="h-8 w-8 text-muted-foreground hover:text-amber-600 hover:bg-amber-50 rounded-lg"
                              >
                                <Edit3 className="h-4 w-4" />
                              </Button>
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
            totalItems={filteredAndSortedOrders.length}
            onPageChange={setCurrentPage}
            label="ITEM"
          />
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col bg-white rounded-xl p-4 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="font-bold text-xl text-foreground">
              {editingId ? 'Ubah Pesanan (PO)' : 'Buat Pesanan Baru'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex-1 min-h-0 grid overflow-hidden gap-2" style={{ gridTemplateRows: 'auto auto 1fr auto auto auto' }}>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold uppercase text-muted-foreground">
                    Nomor PO
                  </Label>
                  <Input
                    value={formData.poNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, poNumber: e.target.value })
                    }
                    required
                    disabled={!!editingId}
                    className="h-10 font-bold bg-muted uppercase border-none ring-1 ring-border focus:ring-2 focus:ring-brand-800"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold uppercase text-muted-foreground">
                    Cabang Klien
                  </Label>
                  <Select
                    value={formData.branchId}
                    onValueChange={(val) => {
                      setFormData({ ...formData, branchId: val });
                      if (cartItems.length > 0) {
                        toast.error(
                          'Perhatian: Cabang diubah! Keranjang dikosongkan otomatis untuk menyesuaikan ulang harga khusus wilayah.',
                        );
                        setCartItems([]);
                      }
                    }}
                    required
                    disabled={!!editingId}
                  >
                    <SelectTrigger className="h-10 bg-muted font-semibold border-none ring-1 ring-border focus:ring-2 focus:ring-brand-800 shadow-none">
                      <SelectValue placeholder="Pilih Cabang..." />
                    </SelectTrigger>
                    <SelectContent
                      position="popper"
                      className="bg-white max-h-[250px] overflow-y-auto"
                    >
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
                  <Label className="text-xs font-semibold uppercase text-muted-foreground">
                    Status Pesanan
                  </Label>
                  <Select
                    value={formData.status}
                    onValueChange={(val) =>
                      setFormData({ ...formData, status: val })
                    }
                    required
                  >
                    <SelectTrigger className="h-10 font-bold bg-muted border-none ring-1 ring-border focus:ring-2 focus:ring-brand-800 shadow-none">
                      <SelectValue placeholder="Pilih Status..." />
                    </SelectTrigger>
                    <SelectContent position="popper" className="bg-white">
                      <SelectItem value="PENDING">PENDING</SelectItem>
                      <SelectItem value="DIPROSES">DIPROSES</SelectItem>
                      <SelectItem value="DIKIRIM">DIKIRIM</SelectItem>
                      <SelectItem value="SELESAI">SELESAI</SelectItem>
                      <SelectItem value="BATAL">BATAL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

              <div className="space-y-1">
                <div className="flex gap-2 items-center text-brand-800">
                  <PackagePlus className="h-5 w-5" />
                  <span className="text-xs font-bold uppercase tracking-widest">
                    Pilih Barang
                  </span>
                </div>
                <div className="grid grid-cols-[minmax(0,1fr)_200px_80px_auto] gap-2 items-start">
                <Popover
                  open={selectOpen}
                  onOpenChange={(open) => {
                    setSelectOpen(open);
                    if (open) setProductSearchTerm('');
                  }}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={selectOpen}
                      className="min-h-10 py-2.5 w-full justify-start text-xs bg-white border-none shadow-sm ring-1 ring-border hover:ring-2 hover:ring-brand-800 focus:ring-2 focus:ring-brand-800 font-normal text-muted-foreground whitespace-normal"
                    >
                      {tempItem.productId
                        ? products.find((p) => p.id === tempItem.productId)?.name
                        : 'Cari & Pilih Produk...'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-[var(--radix-popper-anchor-width)] p-2 rounded-xl"
                    align="start"
                  >
                    <div className="space-y-2">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <Input
                          ref={searchRef}
                          placeholder="Ketik nama produk..."
                          className="h-9 pl-9 text-xs border-none ring-1 ring-border focus:ring-2 focus:ring-brand-600"
                          value={productSearchTerm}
                          onChange={(e) => setProductSearchTerm(e.target.value)}
                        />
                      </div>
                      <div
                        className="max-h-[250px] overflow-y-auto"
                        onWheel={(e) => e.stopPropagation()}
                      >
                        {filteredProducts.length === 0 ? (
                          <div className="p-4 text-center text-xs text-muted-foreground italic">
                            Produk tidak ditemukan.
                          </div>
                        ) : (
                          filteredProducts.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              className="w-full text-left px-3 py-2.5 rounded-lg text-xs hover:bg-accent transition-colors"
                              onClick={() => {
                                handleProductSelect(p.id);
                                setSelectOpen(false);
                              }}
                            >
                              <span className="font-bold text-foreground block">
                                {p.sku}
                              </span>
                              <span className="text-muted-foreground break-words">
                                {p.name}
                              </span>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>

                <Input
                  value={tempItem.clientItemCode || ''}
                  readOnly
                  placeholder="SKU Klien (otomatis)"
                  className="h-10 text-xs font-semibold text-muted-foreground bg-muted border-none ring-1 ring-border"
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
                  className="h-10 text-sm text-center font-bold bg-white border-none shadow-sm ring-1 ring-border"
                />
                <Button
                  type="button"
                  onClick={handleAddToCart}
                  className="h-10 px-4 bg-brand-800 hover:bg-brand-900 shadow-md font-bold text-white transition-all active:scale-95"
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
            </div>

              <div className="bg-white rounded-lg border border-border shadow-inner overflow-y-auto min-h-0">
                {cartItems.length === 0 ? (
                  <div className="p-8 text-center text-xs text-muted-foreground italic">
                    Belum ada barang di keranjang.
                  </div>
                ) : (
                  <table className="w-full table-fixed">
                    <thead className="bg-muted sticky top-0 z-10 shadow-sm">
                      <tr className="border-none">
                        <th className="py-3 pl-4 pr-2 text-xs font-semibold uppercase text-muted-foreground text-left">
                          Nama Produk
                        </th>
                        <th className="py-3 px-2 text-xs font-semibold uppercase text-muted-foreground text-center w-[120px]">
                          Kode Klien
                        </th>
                        <th className="py-3 px-2 text-xs font-semibold uppercase text-muted-foreground text-center w-[60px]">
                          Qty
                        </th>
                        <th className="py-3 pl-2 pr-4 text-xs font-semibold uppercase text-muted-foreground text-right w-[120px]">
                          Subtotal
                        </th>
                        <th className="py-3 w-[44px]"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {cartItems.map((item, i) => (
                        <tr key={i} className="hover:bg-muted transition-colors">
                          <td className="py-3 pl-4 pr-2 align-top">
                            <div className="font-bold text-foreground text-xs leading-snug break-words">
                              {item.name}
                            </div>
                            <div className="text-[10px] text-muted-foreground font-medium mt-0.5">
                              {item.sku} &bull; @Rp{' '}
                              {item.price.toLocaleString('id-ID')}
                            </div>
                          </td>
                          <td className="py-3 px-2 text-center font-bold text-muted-foreground text-xs align-top">
                            {item.clientItemCode || '-'}
                          </td>
                          <td className="py-3 px-2 text-center font-bold text-brand-800 text-sm align-top">
                            {item.quantity}
                          </td>
                          <td className="py-3 pl-2 pr-4 text-right font-bold text-foreground text-xs align-top whitespace-nowrap">
                            Rp{' '}
                            {(item.price * item.quantity).toLocaleString(
                              'id-ID',
                            )}
                          </td>
                          <td className="py-3 text-center align-top">
                            <button
                              type="button"
                              onClick={() =>
                                setCartItems(
                                  cartItems.filter((_, idx) => idx !== i),
                                )
                              }
                              className="p-1.5 hover:bg-rose-100 rounded-md transition-colors"
                              title="Hapus baris"
                            >
                              <Trash2 className="h-4 w-4 text-rose-500 mx-auto" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            {!editingId && (
              <div className="space-y-2 p-3 bg-muted rounded-xl border border-border">
                <div className="flex gap-2 items-center text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-widest">
                    Unggah Berkas PO Asli (PDF)
                  </span>
                </div>
                <Input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  required
                  className="h-10 text-xs py-2 bg-white border-none ring-1 ring-border cursor-pointer"
                />
              </div>
            )}

            <div className="flex justify-between items-center p-3 bg-brand-800 rounded-xl text-white shadow-md">
              <span className="text-xs font-bold uppercase tracking-widest opacity-90">
                Total Nilai PO
              </span>
              <span className="text-xl font-bold tracking-tight">
                Rp {calculateCartTotal().toLocaleString('id-ID')}
              </span>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 bg-foreground hover:bg-foreground/90 text-white font-bold uppercase text-sm tracking-widest border-none transition-all active:scale-95 shadow-lg"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : editingId ? 'SIMPAN PERUBAHAN PO' : 'BUAT PO BARU & UNGGAH PDF'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col bg-white rounded-xl p-0 border-none shadow-2xl">
          <div className="p-6 bg-muted border-b flex-shrink-0">
            <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-3">
              <ShoppingCart className="h-6 w-6 text-brand-800" />
              Rincian PO: {selectedOrder?.poNumber}
            </DialogTitle>
          </div>
          <div className="p-0 overflow-y-auto flex-1">
            <Table>
              <TableHeader className="bg-muted sticky top-0 z-10 shadow-sm">
                <TableRow className="font-bold text-[10px] uppercase border-none">
                  <TableHead className="pl-6 py-4 text-muted-foreground">
                    Barang
                  </TableHead>
                  <TableHead className="text-center py-4 text-muted-foreground">
                    Kode Klien
                  </TableHead>
                  <TableHead className="text-center py-4 text-muted-foreground">
                    Jumlah
                  </TableHead>
                  <TableHead className="text-right py-4 pr-6 text-muted-foreground">
                    Subtotal
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border">
                {orderItems.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center py-12 text-sm text-muted-foreground italic font-medium"
                    >
                      PO ini dibuat menggunakan versi lama (tanpa barang) atau
                      kosong.
                    </TableCell>
                  </TableRow>
                ) : (
                  orderItems.map((item) => (
                    <TableRow
                      key={item.id}
                      className="text-sm hover:bg-muted transition-colors"
                    >
                      <td className="py-4 pl-6">
                        <span className="font-bold block text-foreground">
                          {item.product.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-medium">
                          @Rp {item.priceAtBuy.toLocaleString('id-ID')}
                        </span>
                      </td>
                      <td className="py-4 text-center font-bold text-muted-foreground">
                        {item.clientItemCode || '-'}
                      </td>
                      <td className="py-4 text-center font-bold text-brand-800 text-base">
                        {item.quantity}
                      </td>
                      <td className="py-4 text-right font-bold text-foreground pr-6">
                        Rp{' '}
                        {(item.priceAtBuy * item.quantity).toLocaleString(
                          'id-ID',
                        )}
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
