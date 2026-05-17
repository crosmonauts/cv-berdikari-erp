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
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  restockProduct,
} from '@/modules/products/api';
import type { Product } from '@/modules/products/types';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  // --- STATE PAGINATION ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // 1. STATE DIALOG TAMBAH/EDIT
  const [isOpen, setIsOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({
    sku: '',
    name: '',
    barcode: '',
    defaultClientSku: '',
    buyPrice: '',
    price: '',
    stock: '',
  });

  // 2. STATE DIALOG RESTOCK (KLOTER BARU)
  const [isRestockOpen, setIsRestockOpen] = useState(false);
  const [selectedRestock, setSelectedRestock] = useState<any>(null);
  const [restockData, setRestockData] = useState<any>({
    quantity: 1,
    purchasePrice: '',
  });

  const fetchData = async () => {
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (error) {
      console.error('Gagal mengambil data produk:', error);
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
    setFormData({
      sku: '',
      name: '',
      barcode: '',
      defaultClientSku: '',
      buyPrice: '',
      price: '',
      stock: '',
    });
    setIsOpen(true);
  };

  const handleEdit = (p: Product) => {
    setIsEdit(true);
    setSelectedId(p.id);
    setFormData({
      sku: p.sku,
      name: p.name,
      barcode: p.barcode || '',
      defaultClientSku: (p as any).defaultClientSku || '',
      buyPrice: (p as any).buyPrice || '',
      price: p.price || '',
      stock: p.stock || '',
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
      window.confirm(
        'Hapus produk ini dari katalog? Data batch stok juga akan hilang.',
      )
    ) {
      try {
        await deleteProduct(id);
        fetchData();
      } catch (error) {
        alert('Gagal menghapus produk.');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const safeBarcode =
        formData.barcode.trim() === '' ? undefined : formData.barcode;

      if (isEdit && selectedId) {
        const updatePayload = {
          sku: formData.sku,
          name: formData.name,
          barcode: safeBarcode,
          defaultClientSku: formData.defaultClientSku,
          price: Number(formData.price), // Pastikan konversi ke angka
        };
        await updateProduct(selectedId, updatePayload as any);
      } else {
        const createPayload = {
          ...formData,
          barcode: safeBarcode,
          buyPrice: Number(formData.buyPrice), // Konversi ke angka
          price: Number(formData.price),
          stock: Number(formData.stock),
        };
        await createProduct(createPayload as any);
      }

      setIsOpen(false);
      fetchData();
    } catch (error) {
      alert(
        'Gagal simpan! Periksa koneksi atau pastikan SKU / Barcode tidak duplikat.',
      );
    }
  };

  const handleSubmitRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await restockProduct(
        selectedRestock.id,
        Number(restockData.quantity),
        Number(restockData.purchasePrice), // Konversi aman ke angka
      );
      setIsRestockOpen(false);
      fetchData();
      alert('Stok kloter baru berhasil ditambahkan!');
    } catch (e) {
      alert('Gagal melakukan restock!');
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

  if (isLoading)
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest text-center">
            Menyusun Katalog...
          </p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-300 px-2 pt-1 pb-10 space-y-4 font-sans">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-indigo-600 ring-1 ring-slate-200">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Katalog Produk
            </h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.1em]">
              Manajemen Stok Berdikari
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
            <Input
              placeholder="Cari SKU atau Nama..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-56 h-10 pl-9 rounded-xl bg-white border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-sm shadow-sm"
            />
          </div>

          <Button
            onClick={handleOpenAdd}
            className="h-10 px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all active:scale-95 shadow-md border-none"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5 stroke-[3px]" /> TAMBAH PRODUK
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-sm ring-1 ring-slate-200 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50 border-b border-slate-100">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="pl-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  SKU Internal
                </TableHead>
                <TableHead className="py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  SKU Klien
                </TableHead>
                <TableHead className="py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Nama Produk
                </TableHead>
                <TableHead className="py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 text-right">
                  Kulakan
                </TableHead>
                <TableHead className="py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 text-right">
                  Harga Jual
                </TableHead>
                <TableHead className="py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 text-center">
                  Stok
                </TableHead>
                <TableHead className="pr-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 text-right">
                  Aksi
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedProducts.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-24 text-xs font-medium text-slate-400 italic bg-white"
                  >
                    Katalog produk belum tersedia atau tidak ditemukan.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedProducts.map((p) => (
                  <TableRow
                    key={p.id}
                    className="group hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-none"
                  >
                    <TableCell className="pl-6 py-4 font-bold text-indigo-600 text-xs uppercase tracking-tight">
                      {p.sku}
                    </TableCell>

                    <TableCell className="py-4 font-bold text-amber-600 text-xs uppercase">
                      {(p as any).defaultClientSku || (
                        <span className="text-slate-300 font-normal italic">
                          -
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="py-4 font-semibold text-slate-700 text-xs">
                      {p.name}
                    </TableCell>

                    <TableCell className="py-4 text-right font-black text-slate-900 text-xs tracking-tight">
                      <span className="text-[9px] text-slate-400 mr-0.5 font-bold">
                        Rp
                      </span>
                      {((p as any).buyPrice || 0).toLocaleString('id-ID')}
                    </TableCell>

                    <TableCell className="py-4 text-right font-black text-slate-900 text-xs tracking-tight">
                      <span className="text-[9px] text-slate-400 mr-0.5 font-bold">
                        Rp
                      </span>
                      {p.price.toLocaleString('id-ID')}
                    </TableCell>

                    <TableCell className="py-4 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-md text-[9px] font-bold uppercase ring-1 shadow-sm ${
                          p.stock > 10
                            ? 'bg-emerald-50 text-emerald-700 ring-emerald-100'
                            : 'bg-amber-50 text-amber-700 ring-amber-100'
                        }`}
                      >
                        {p.stock} Tersedia
                      </span>
                    </TableCell>

                    <TableCell className="pr-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          onClick={() => handleOpenRestock(p)}
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-all"
                          title="Restock Kloter Baru"
                        >
                          <PackagePlus className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => handleEdit(p)}
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-all"
                          title="Edit Dasar"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => handleDelete(p.id)}
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all"
                          title="Hapus Produk"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
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
              | TOTAL {filteredProducts.length} ITEM
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

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md bg-white rounded-xl border-none shadow-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">
              {isEdit ? 'Edit Data Produk' : 'Data Produk Baru'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3 mt-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-slate-400 ml-0.5">
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
                  className="h-9 rounded-lg bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-600 font-semibold uppercase"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-slate-400 ml-0.5">
                  Barcode (Opsional)
                </Label>
                <div className="relative">
                  <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    value={formData.barcode}
                    onChange={(e) =>
                      setFormData({ ...formData, barcode: e.target.value })
                    }
                    placeholder="Scan..."
                    className="h-9 pl-9 rounded-lg bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-600 font-semibold"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] font-bold uppercase text-slate-400 ml-0.5">
                Nama Barang
              </Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                placeholder="Contoh: Kertas HVS"
                className="h-9 rounded-lg bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-600 font-semibold"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] font-bold uppercase text-slate-400 ml-0.5">
                SKU Klien (Default / Opsional)
              </Label>
              <Input
                value={formData.defaultClientSku}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    defaultClientSku: e.target.value.toUpperCase(),
                  })
                }
                placeholder="Contoh: MCD-HVS-A4"
                className="h-9 rounded-lg bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-amber-500 font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-slate-400 ml-0.5">
                  Harga Jual (Netto)
                </Label>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={formData.price}
                  onChange={(e) => {
                    // Merubah koma menjadi titik secara instan
                    const val = e.target.value.replace(/,/g, '.');
                    setFormData({ ...formData, price: val });
                  }}
                  required
                  className="h-9 rounded-lg bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-600 font-bold"
                />
              </div>
              {!isEdit && (
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold uppercase text-slate-400 ml-0.5">
                    Modal Kulak (Rp)
                  </Label>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={formData.buyPrice}
                    onChange={(e) => {
                      const val = e.target.value.replace(/,/g, '.');
                      setFormData({ ...formData, buyPrice: val });
                    }}
                    required
                    className="h-9 rounded-lg bg-indigo-50 border-none ring-1 ring-indigo-200 focus:ring-2 focus:ring-indigo-600 font-bold"
                  />
                </div>
              )}
            </div>
            {!isEdit && (
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-slate-400 ml-0.5">
                  Stok Awal
                </Label>
                <Input
                  type="number"
                  value={formData.stock}
                  onChange={(e) =>
                    setFormData({ ...formData, stock: e.target.value })
                  }
                  required
                  className="h-9 rounded-lg bg-indigo-50 border-none ring-1 ring-indigo-200 focus:ring-2 focus:ring-indigo-600 font-bold"
                />
              </div>
            )}
            <Button
              type="submit"
              className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg mt-2 text-xs uppercase tracking-widest border-none shadow-md transition-all active:scale-95"
            >
              {isEdit ? 'UPDATE PERUBAHAN' : 'SIMPAN PRODUK'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isRestockOpen} onOpenChange={setIsRestockOpen}>
        <DialogContent className="sm:max-w-sm bg-white rounded-xl border-none shadow-2xl p-6">
          <DialogHeader>
            <DialogTitle className="font-bold flex items-center gap-2 text-slate-900">
              <PackagePlus className="h-5 w-5 text-emerald-600" /> Restock
              Kloter Baru
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitRestock} className="space-y-4 mt-4">
            <div className="p-3 bg-slate-50 rounded-lg text-[11px] font-semibold text-slate-500 italic ring-1 ring-slate-100">
              Restock untuk <b>{selectedRestock?.name}</b>. Sistem FIFO akan
              mencatat ini sebagai kloter barang baru.
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-bold text-slate-400 uppercase">
                Jumlah Barang Masuk
              </Label>
              <Input
                type="number"
                min="1"
                value={restockData.quantity}
                onChange={(e) =>
                  setRestockData({
                    ...restockData,
                    quantity: e.target.value,
                  })
                }
                required
                className="h-9 font-bold bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-bold text-slate-400 uppercase">
                Harga Modal Baru (Kulakan)
              </Label>
              <Input
                type="text"
                inputMode="decimal"
                value={restockData.purchasePrice}
                onChange={(e) => {
                  // Merubah koma menjadi titik secara instan untuk Restock
                  const val = e.target.value.replace(/,/g, '.');
                  setRestockData({ ...restockData, purchasePrice: val });
                }}
                required
                className="h-9 font-bold bg-emerald-50 border-none ring-1 ring-emerald-200 focus:ring-2 focus:ring-emerald-600 text-emerald-700"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 rounded-lg border-none shadow-md uppercase text-xs tracking-widest transition-all active:scale-95 mt-2"
            >
              SIMPAN KLOTER BARU
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
