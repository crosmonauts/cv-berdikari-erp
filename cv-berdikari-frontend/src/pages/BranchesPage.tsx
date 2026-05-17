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
  Store,
  Plus,
  Search,
  MapPin,
  Phone,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  Edit3,
  Trash2,
} from 'lucide-react';
// --- TAMBAHAN: Import API Edit, Delete, dan Region ---
import {
  getBranches,
  createBranch,
  updateBranch,
  deleteBranch,
} from '@/modules/branches/api';
import { getRegions } from '@/modules/regions/api';

export default function BranchesPage() {
  const [branches, setBranches] = useState<any[]>([]);
  const [regions, setRegions] = useState<any[]>([]); // --- STATE BARU: Untuk daftar wilayah ---
  const [isLoading, setIsLoading] = useState(true);

  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null); // --- STATE BARU: Penanda mode edit ---

  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // --- STATE PAGINATION ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // --- REVISI: region diganti menjadi regionId ---
  const [formData, setFormData] = useState({
    branchCode: '',
    name: '',
    address: '',
    phone: '',
    regionId: '',
  });

  const fetchData = async () => {
    try {
      // --- REVISI: Ambil data cabang dan wilayah secara bersamaan ---
      const [branchesData, regionsData] = await Promise.all([
        getBranches(),
        getRegions().catch(() => []),
      ]);
      setBranches(branchesData);
      setRegions(regionsData);
    } catch (error) {
      console.error('Gagal mengambil data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Reset pagination ke halaman 1 saat pencarian atau urutan berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortOrder]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      branchCode: '',
      name: '',
      address: '',
      phone: '',
      regionId: '',
    });
    setIsOpen(true);
  };

  const handleOpenEdit = (branch: any) => {
    setEditingId(branch.id);
    setFormData({
      branchCode: branch.branchCode,
      name: branch.name,
      address: branch.address || '',
      phone: branch.phone || '',
      regionId: branch.regionId || '', // Tarik regionId dari database
    });
    setIsOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (
      window.confirm('Hapus cabang ini? Data PO terkait mungkin terpengaruh.')
    ) {
      try {
        await deleteBranch(id);
        fetchData();
      } catch (error) {
        alert('Gagal menghapus cabang. Mungkin cabang ini sudah memiliki PO.');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateBranch(editingId, formData);
      } else {
        await createBranch(formData);
      }
      setIsOpen(false);
      fetchData();
    } catch (error) {
      console.error('Gagal menyimpan cabang:', error);
      alert('Gagal simpan! Pastikan Kode Cabang belum digunakan.');
    }
  };

  // --- LOGIKA FILTER, SORTING, & PAGINATION ---
  const filteredAndSortedBranches = branches
    .filter((b) => {
      const searchLower = searchTerm.toLowerCase();
      // Mengambil nama wilayah (jika ada) untuk fitur pencarian
      const regionName = b.region ? b.region.name.toLowerCase() : '';
      return (
        b.branchCode.toLowerCase().includes(searchLower) ||
        b.name.toLowerCase().includes(searchLower) ||
        regionName.includes(searchLower)
      );
    })
    .sort((a, b) => {
      if (sortOrder === 'asc') return a.branchCode.localeCompare(b.branchCode);
      return b.branchCode.localeCompare(a.branchCode);
    });

  const totalPages = Math.ceil(filteredAndSortedBranches.length / itemsPerPage);
  const paginatedBranches = filteredAndSortedBranches.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  if (isLoading)
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            Menyusun Jaringan...
          </p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-300 px-2 pt-1 pb-10 space-y-4 font-sans">
      {/* HEADER SECTION */}
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-indigo-600 ring-1 ring-slate-200">
            <Store className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Daftar Cabang
            </h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.1em]">
              Manajemen Jaringan CV Berdikari
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="h-10 bg-white border-none ring-1 ring-slate-200 shadow-sm text-xs font-bold text-slate-600 px-4 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <ArrowUpDown className="h-3.5 w-3.5 mr-2 text-indigo-600" />
            {sortOrder === 'asc' ? 'A - Z' : 'Z - A'}
          </Button>

          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
            <Input
              placeholder="Cari Cabang..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-48 h-10 pl-9 rounded-xl bg-white border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-sm shadow-sm"
            />
          </div>

          <Button
            onClick={handleOpenAdd}
            className="h-10 px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all active:scale-95 shadow-md border-none"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5 stroke-[3px]" /> TAMBAH CABANG
          </Button>
        </div>
      </div>

      {/* TABLE SECTION */}
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-sm ring-1 ring-slate-200 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50 border-b border-slate-100">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="pl-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Kode
                </TableHead>
                <TableHead className="py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Wilayah (Region)
                </TableHead>
                <TableHead className="py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Nama Cabang
                </TableHead>
                <TableHead className="py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Kontak
                </TableHead>
                <TableHead className="py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Alamat Lengkap
                </TableHead>
                <TableHead className="pr-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 text-right">
                  Aksi
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedBranches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-24 text-center">
                    <div className="flex flex-col items-center gap-2 opacity-40">
                      <FileText className="h-10 w-10 text-slate-400" />
                      <p className="text-xs font-bold uppercase italic text-slate-500">
                        Tidak ada cabang ditemukan.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedBranches.map((b) => (
                  <TableRow
                    key={b.id}
                    className="group hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-none"
                  >
                    <TableCell className="pl-6 py-4 font-bold text-indigo-600 text-sm tracking-tight uppercase">
                      {b.branchCode}
                    </TableCell>
                    <TableCell className="py-4">
                      {/* --- TAMPILKAN NAMA WILAYAH DARI DATABASE --- */}
                      <span
                        className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase ring-1 shadow-sm ${
                          b.region
                            ? 'bg-indigo-50 text-indigo-700 ring-indigo-200'
                            : 'bg-rose-50 text-rose-700 ring-rose-200'
                        }`}
                      >
                        {b.region ? b.region.name : 'BELUM DIATUR'}
                      </span>
                    </TableCell>
                    <TableCell className="py-4 font-semibold text-slate-700 text-sm">
                      {b.name}
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-1.5 text-slate-500 font-medium text-xs">
                        <Phone className="h-3 w-3 text-slate-300" />{' '}
                        {b.phone || '-'}
                      </div>
                    </TableCell>
                    <TableCell className="py-4 text-slate-500 font-medium text-xs max-w-[250px] truncate">
                      <div
                        className="flex items-center gap-1.5"
                        title={b.address}
                      >
                        <MapPin className="h-3 w-3 shrink-0 text-slate-300" />{' '}
                        <span className="truncate">{b.address || '-'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="pr-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(b)}
                          className="h-8 w-8 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(b.id)}
                          className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Hapus"
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
              | TOTAL {filteredAndSortedBranches.length} CABANG
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

      {/* DIALOG FORM CABANG */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md bg-white rounded-xl border-none shadow-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Store className="h-5 w-5 text-indigo-600" />
              {editingId ? 'Edit Data Cabang' : 'Registrasi Cabang Baru'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-slate-400">
                  Kode Cabang
                </Label>
                <Input
                  value={formData.branchCode}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      branchCode: e.target.value.toUpperCase(),
                    })
                  }
                  required
                  placeholder="MCD-001"
                  className="h-9 rounded-lg bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-600 font-bold uppercase"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-indigo-600">
                  Pilih Wilayah (Region)
                </Label>
                {/* --- MENGGANTI INPUT TEKS DENGAN DROPDOWN --- */}
                <Select
                  value={formData.regionId}
                  onValueChange={(val) =>
                    setFormData({ ...formData, regionId: val })
                  }
                  required
                >
                  <SelectTrigger className="h-9 font-bold text-xs bg-indigo-50 text-indigo-700 border-none ring-1 ring-indigo-200 focus:ring-2 focus:ring-indigo-600 shadow-none">
                    <SelectValue placeholder="Pilih Wilayah..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white max-h-48">
                    {regions.length === 0 ? (
                      <SelectItem value="empty" disabled>
                        Memuat wilayah...
                      </SelectItem>
                    ) : (
                      regions.map((r) => (
                        <SelectItem
                          key={r.id}
                          value={r.id}
                          className="font-bold text-xs uppercase text-slate-700"
                        >
                          {r.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1 border-t border-slate-100 pt-3">
              <Label className="text-[10px] font-bold uppercase text-slate-400">
                Nama Cabang
              </Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                placeholder="Contoh: McD Kelapa Dua"
                className="h-9 rounded-lg bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-600 font-semibold"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-bold uppercase text-slate-400">
                Telepon / Kontak
              </Label>
              <Input
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="021-xxxxxxx"
                className="h-9 rounded-lg bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-600 font-semibold"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-bold uppercase text-slate-400">
                Alamat Lengkap
              </Label>
              <Input
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                placeholder="Jl. Raya Utama No.123..."
                className="h-9 rounded-lg bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-600 font-semibold"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-10 mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs uppercase tracking-widest shadow-md border-none transition-all active:scale-95"
            >
              {editingId ? 'UPDATE DATA CABANG' : 'SIMPAN CABANG BARU'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
