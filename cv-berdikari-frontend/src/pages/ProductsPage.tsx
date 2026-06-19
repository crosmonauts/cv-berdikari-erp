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
  Package,
  Plus,
  Search,
  Edit3,
  Trash2,
  PackagePlus,
  Barcode,
  MapPin,
  Info,
  AlertTriangle,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  restockProduct,
} from '@/modules/products/api';
import { getRegions } from '@/modules/regions/api';
import { getProductCategories } from '@/modules/product-categories/api';
import type { Product } from '@/modules/products/types';
import type { ProductCategory as ProductCategoryType } from '@/modules/product-categories/types';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/page-header';
import { PaginationFooter } from '@/components/shared/pagination-footer';
import { Skeleton } from '@/components/shared/skeleton';
import { useUserRole } from '@/hooks/useUserRole';

export default function ProductsPage() {
  const { canManage } = useUserRole();
  const [products, setProducts] = useState<Product[]>([]);
  const [regions, setRegions] = useState<any[]>([]);
  const [categories, setCategories] = useState<ProductCategoryType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [search, setSearch] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [isOpen, setIsOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'utama' | 'wilayah'>('utama');

  const [formData, setFormData] = useState<any>({
    sku: '',
    name: '',
    barcode: '',
    buyPrice: '',
    price: '',
    stock: '',
    categoryId: '',
    regionPrices: {},
    regionClientSkus: {},
  });

  const [isRestockOpen, setIsRestockOpen] = useState(false);
  const [selectedRestock, setSelectedRestock] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [restockData, setRestockData] = useState<any>({
    quantity: 1,
    purchasePrice: '',
  });

  const fetchData = async () => {
    setIsError(false);
    try {
      const p = await getProducts();
      const r = await getRegions().catch(() => []);
      const c = await getProductCategories().catch(() => []);
      setProducts(p);
      setRegions(r);
      setCategories(c);
    } catch (error) {
      console.error('Gagal mengambil data:', error);
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
  }, [search]);

  const handleOpenAdd = () => {
    setIsEdit(false);
    setSelectedId(null);
    setActiveTab('utama');
    setFormData({
      sku: '',
      name: '',
      barcode: '',
      buyPrice: '',
      price: '',
      stock: '',
      categoryId: '',
      regionPrices: {},
      regionClientSkus: {},
    });
    setIsOpen(true);
  };

  const handleEdit = (p: Product) => {
    setIsEdit(true);
    setSelectedId(p.id);
    setActiveTab('utama');

    const mappedPrices: Record<string, string> = {};
    const mappedSkus: Record<string, string> = {};
    if ((p as any).regionPrices) {
      (p as any).regionPrices.forEach((rp: any) => {
        mappedPrices[rp.regionId] = rp.price.toString();
        if (rp.clientSku) mappedSkus[rp.regionId] = rp.clientSku;
      });
    }

    setFormData({
      sku: p.sku,
      name: p.name,
      barcode: p.barcode || '',
      buyPrice: (p as any).buyPrice || '',
      price: p.price || '',
      stock: p.stock || '',
      categoryId: (p as any).categoryId || '',
      regionPrices: mappedPrices,
      regionClientSkus: mappedSkus,
    });
    setIsOpen(true);
  };

  const handleOpenRestock = (p: Product) => {
    setSelectedRestock(p);
    setRestockData({ quantity: 1, purchasePrice: (p as any).buyPrice || '' });
    setIsRestockOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (
      window.confirm('Hapus produk ini dari katalog? Data stok juga hilang.')
    ) {
      try {
        await deleteProduct(id);
        fetchData();
      } catch (error) {
        toast.error('Gagal menghapus produk.');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const safeBarcode =
        formData.barcode.trim() === '' ? undefined : formData.barcode;

      const formattedRegionPrices = Object.entries(formData.regionPrices)
        .filter(([_, price]) => price !== '' && price !== undefined)
        .map(([regionId, price]) => ({
          regionId,
          price: Number(price),
          clientSku: (formData.regionClientSkus?.[regionId] || '').trim() || null,
        }));

      if (isEdit && selectedId) {
        const updatePayload = {
          sku: formData.sku,
          name: formData.name,
          barcode: safeBarcode,
          price: Number(formData.price),
          categoryId: formData.categoryId || null,
          regionPrices: formattedRegionPrices,
        };
        await updateProduct(selectedId, updatePayload as any);
        toast.success('Data produk berhasil diperbarui');
      } else {
        const createPayload = {
          sku: formData.sku,
          name: formData.name,
          barcode: safeBarcode,
          buyPrice: Number(formData.buyPrice),
          price: Number(formData.price),
          stock: Number(formData.stock),
          categoryId: formData.categoryId || null,
          regionPrices: formattedRegionPrices,
        };
        await createProduct(createPayload as any);
        toast.success('Data produk berhasil disimpan');
      }

      setIsOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Gagal simpan! Periksa koneksi atau pastikan SKU tidak duplikat.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await restockProduct(
        selectedRestock.id,
        Number(restockData.quantity),
        Number(restockData.purchasePrice),
      );
      setIsRestockOpen(false);
      fetchData();
      toast.success('Stok kloter baru berhasil ditambahkan!');
    } catch (e) {
      toast.error('Gagal melakukan restock!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.name.toLowerCase().includes(search.toLowerCase()),
  );

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="h-14 w-14 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
          <AlertTriangle className="h-7 w-7 text-destructive" />
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-2">Gagal Memuat Produk</h2>
        <p className="text-sm text-muted-foreground max-w-md mb-6">
          Tidak dapat memuat data produk. Periksa koneksi server atau coba lagi.
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
        <div className="bg-white rounded-xl shadow-sm ring-1 ring-border overflow-hidden">
          <div className="p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-16" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full space-y-6">
      <PageHeader icon={Package} title="Katalog Produk" subtitle="Manajemen Stok Berdikari">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Cari SKU atau Nama..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-48 h-9 pl-9 rounded-xl bg-white ring-1 ring-border focus:ring-2 focus:ring-brand-600 transition-all text-sm"
          />
        </div>
        {canManage && (
          <Button
            onClick={handleOpenAdd}
            className="h-9 px-5 bg-brand-800 hover:bg-brand-900 text-white font-semibold rounded-xl text-xs transition-all active:scale-95 shadow-md"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Tambah Produk
          </Button>
        )}
      </PageHeader>

      <div className="bg-white rounded-xl shadow-sm ring-1 ring-border flex flex-col overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50 border-b border-border">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="pl-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Produk
                </TableHead>
                <TableHead className="py-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Kategori
                </TableHead>
                <TableHead className="py-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-right">
                  Harga Kulakan
                </TableHead>
                <TableHead className="py-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-right">
                  Harga Jual
                </TableHead>
                <TableHead className="py-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-center">
                  Stok
                </TableHead>
                <TableHead className="pr-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-right">
                  Aksi
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedProducts.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-24 text-xs font-medium text-muted-foreground italic bg-white"
                  >
                    Katalog produk belum tersedia.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedProducts.map((p) => (
                  <TableRow
                    key={p.id}
                    className="group hover:bg-muted/50 transition-colors border-b border-border/50 last:border-none"
                  >
                    <TableCell className="pl-4 py-2.5">
                      <div className="flex flex-col">
                        <span className="font-bold text-brand-800 text-[11px] uppercase tracking-tight leading-tight">
                          {p.sku}
                        </span>
                        <span className="font-semibold text-foreground text-xs leading-tight mt-0.5">
                          {p.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-2.5">
                      {p.category ? (
                        <span className="inline-block px-1.5 py-0.5 rounded-full bg-brand-50 text-brand-700 text-[9px] font-semibold leading-tight">
                          {p.category.name}
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell className="py-2.5 text-right">
                      <span className="text-xs font-semibold text-foreground">
                        Rp {((p as any).buyPrice || 0).toLocaleString('id-ID')}
                      </span>
                    </TableCell>
                    <TableCell className="py-2.5 text-right">
                      <span className="text-xs font-bold text-foreground">
                        Rp {p.price.toLocaleString('id-ID')}
                      </span>
                    </TableCell>
                    <TableCell className="py-2.5 text-center align-middle">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ring-1 ${p.stock > 10 ? 'bg-success/10 text-success ring-success/20' : 'bg-warning/10 text-warning ring-warning/20'}`}
                      >
                        {p.stock} Pcs
                      </span>
                    </TableCell>
                    <TableCell className="pr-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1 flex-nowrap">
                        {canManage && (
                          <Button
                            onClick={() => handleOpenRestock(p)}
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-lg text-success hover:bg-success/10 transition-all"
                            title="Restock"
                          >
                            <PackagePlus className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {canManage && (
                          <Button
                            onClick={() => handleEdit(p)}
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-lg text-muted-foreground hover:bg-brand-50 hover:text-brand-800 transition-all"
                            title="Edit"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {canManage && (
                          <Button
                            onClick={() => handleDelete(p.id)}
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
                            title="Hapus"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        <PaginationFooter
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredProducts.length}
          onPageChange={setCurrentPage}
          label="PRODUK"
        />
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-xl bg-white rounded-xl border-none shadow-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              <Package className="h-5 w-5 text-brand-800" />
              {isEdit ? 'Edit Data Produk & Harga' : 'Tambah Produk Baru'}
            </DialogTitle>
          </DialogHeader>

          <div className="flex bg-accent/10 p-1 rounded-lg mt-2 mb-4">
            <button
              type="button"
              onClick={() => setActiveTab('utama')}
              className={`flex flex-1 items-center justify-center gap-2 py-2 text-xs font-semibold uppercase tracking-widest rounded-md transition-all ${
                activeTab === 'utama'
                  ? 'bg-white shadow-sm text-brand-800 ring-1 ring-border/50'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Info className="h-3 w-3" /> Info Utama
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('wilayah')}
              className={`flex flex-1 items-center justify-center gap-2 py-2 text-xs font-semibold uppercase tracking-widest rounded-md transition-all ${
                activeTab === 'wilayah'
                  ? 'bg-white shadow-sm text-brand-800 ring-1 ring-border/50'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <MapPin className="h-3 w-3" /> Harga Wilayah
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {activeTab === 'utama' && (
              <div className="animate-in fade-in zoom-in-95 duration-200 space-y-3">
                {/* BARIS 1: Kode SKU */}
                <div className="space-y-1">
                  <Label className="text-xs font-semibold uppercase text-muted-foreground">
                    Kode SKU
                  </Label>
                  <Input
                    value={formData.sku}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        sku: e.target.value.toUpperCase(),
                      })
                    }
                    required
                    placeholder="ATK-001"
                    className="h-9 font-semibold uppercase bg-muted border-none ring-1 ring-border focus:ring-2 focus:ring-brand-800"
                  />
                </div>

                {/* BARIS 2: Nama Barang */}
                <div className="space-y-1">
                  <Label className="text-xs font-semibold uppercase text-muted-foreground">
                    Nama Barang
                  </Label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                    placeholder="Contoh: Kertas HVS"
                    className="h-9 font-semibold bg-muted border-none ring-1 ring-border focus:ring-2 focus:ring-brand-800"
                  />
                </div>

                {/* BARIS 3: Kategori */}
                <div className="space-y-1">
                  <Label className="text-xs font-semibold uppercase text-muted-foreground">
                    Kategori
                  </Label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) =>
                      setFormData({ ...formData, categoryId: e.target.value })
                    }
                    className="h-9 w-full font-semibold bg-muted border-none ring-1 ring-border focus:ring-2 focus:ring-brand-800 rounded-lg px-3 text-sm"
                  >
                    <option value="">-- Tanpa Kategori --</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* BARIS 4: Barcode (Di bawah Nama Barang) */}
                <div className="space-y-1">
                  <Label className="text-xs font-semibold uppercase text-muted-foreground">
                    Barcode
                  </Label>
                  <div className="relative">
                    <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      value={formData.barcode}
                      onChange={(e) =>
                        setFormData({ ...formData, barcode: e.target.value })
                      }
                      placeholder="Scan Barcode / Biarkan kosong"
                      className="h-9 pl-9 font-semibold bg-muted border-none ring-1 ring-border focus:ring-2 focus:ring-brand-800"
                    />
                  </div>
                </div>

                {/* BARIS 5: Kulakan, Harga Jual Dasar, Stok Awal (Sejajar) */}
                <div className="grid grid-cols-3 gap-3 border-t border-border pt-4 mt-2">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold uppercase text-muted-foreground">
                      Harga Kulakan
                    </Label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={formData.buyPrice}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          buyPrice: e.target.value.replace(/,/g, '.'),
                        })
                      }
                      required
                    disabled={isEdit}
                    title={
                      isEdit
                        ? 'Terkunci: Harga modal awal dijaga oleh sistem FIFO. Gunakan tombol Restock untuk kloter harga baru.'
                        : ''
                    }
                    className="h-9 font-semibold bg-brand-50 border-none ring-1 ring-brand-200 focus:ring-2 focus:ring-brand-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold uppercase text-muted-foreground">
                      Harga Jual Dasar
                    </Label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          price: e.target.value.replace(/,/g, '.'),
                        })
                      }
                      required
                      className="h-9 font-semibold bg-muted border-none ring-1 ring-border focus:ring-2 focus:ring-brand-800"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold uppercase text-muted-foreground">
                      Stok Awal
                    </Label>
                    <Input
                      type="number"
                      value={formData.stock}
                      onChange={(e) =>
                        setFormData({ ...formData, stock: e.target.value })
                      }
                      required
                    disabled={isEdit}
                    title={
                      isEdit
                        ? 'Terkunci: Penambahan stok hanya bisa dilakukan lewat tombol Restock.'
                        : ''
                    }
                    className="h-9 font-semibold bg-brand-50 border-none ring-1 ring-brand-200 focus:ring-2 focus:ring-brand-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'wilayah' && (
              <div className="animate-in fade-in zoom-in-95 duration-200 space-y-3">
                <div className="bg-warning/10 p-3 rounded-lg border border-warning/20 mb-2">
                  <p className="text-[10px] font-semibold text-warning leading-relaxed">
                    <strong>Penting:</strong> Jika harga wilayah dibiarkan
                    kosong, maka sistem PO akan otomatis menggunakan{' '}
                    <strong>Harga Jual Default</strong> saat cabang di wilayah
                    tersebut melakukan pemesanan.
                  </p>
                </div>

                {regions.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic text-center py-4">
                    Data wilayah belum tersedia dari server.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[220px] overflow-y-auto pr-2 pb-2">
                    {regions.map((region) => (
                      <div key={region.id} className="flex flex-col space-y-1">
                        <Label className="text-[10px] font-semibold text-muted-foreground uppercase">
                          {region.name}
                        </Label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                            Rp
                          </span>
                          <Input
                            type="text"
                            inputMode="decimal"
                            placeholder=""
                            value={formData.regionPrices[region.id] || ''}
                            onChange={(e) => {
                              const val = e.target.value.replace(/,/g, '.');
                              setFormData({
                                ...formData,
                                regionPrices: {
                                  ...formData.regionPrices,
                                  [region.id]: val,
                                },
                              });
                            }}
                            className="h-8 pl-7 text-xs font-semibold bg-white border-none ring-1 ring-border focus:ring-2 focus:ring-brand-800"
                          />
                        </div>
                        <Input
                          placeholder="Kode Klien (Ops)"
                          value={formData.regionClientSkus[region.id] || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              regionClientSkus: {
                                ...formData.regionClientSkus,
                                [region.id]: e.target.value,
                              },
                            })
                          }
                          className="h-7 text-[10px] font-medium bg-white border-none ring-1 ring-border focus:ring-2 focus:ring-brand-800"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-10 bg-brand-800 hover:bg-brand-900 text-white font-semibold rounded-lg mt-2 text-xs uppercase tracking-widest border-none shadow-md transition-all active:scale-95"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : isEdit ? 'UPDATE PERUBAHAN' : 'SIMPAN PRODUK'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isRestockOpen} onOpenChange={setIsRestockOpen}>
        <DialogContent className="sm:max-w-sm bg-white rounded-xl border-none shadow-2xl p-6">
          <DialogHeader>
            <DialogTitle className="font-bold flex items-center gap-2 text-foreground">
              <PackagePlus className="h-5 w-5 text-success" /> Restock
              Kloter Baru
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitRestock} className="space-y-4 mt-4">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-muted-foreground uppercase">
                Jumlah Barang Masuk
              </Label>
              <Input
                type="number"
                min="1"
                value={restockData.quantity}
                onChange={(e) =>
                  setRestockData({ ...restockData, quantity: e.target.value })
                }
                required
                className="h-9 font-semibold bg-muted border-none ring-1 ring-border"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-muted-foreground uppercase">
                Harga Modal Kulakan
              </Label>
              <Input
                type="text"
                inputMode="decimal"
                value={restockData.purchasePrice}
                onChange={(e) =>
                  setRestockData({
                    ...restockData,
                    purchasePrice: e.target.value.replace(/,/g, '.'),
                  })
                }
                required
                className="h-9 font-semibold bg-success/10 border-none ring-1 ring-success/20 text-success"
              />
            </div>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-success hover:bg-success/90 text-white font-semibold h-10 rounded-lg border-none shadow-md uppercase text-xs"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'SIMPAN KLOTER'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
