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
  FileText,
  Edit3,
  Trash2,
  AlertTriangle,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import {
  getBranches,
  createBranch,
  updateBranch,
  deleteBranch,
} from '@/modules/branches/api';
import { getRegions } from '@/modules/regions/api';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/page-header';
import { PaginationFooter } from '@/components/shared/pagination-footer';
import { Skeleton } from '@/components/shared/skeleton';

export default function BranchesPage() {
  const [branches, setBranches] = useState<any[]>([]);
  const [regions, setRegions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    branchCode: '',
    name: '',
    address: '',
    phone: '',
    regionId: '',
  });

  const fetchData = async () => {
    setIsError(false);
    try {
      const [branchesData, regionsData] = await Promise.all([
        getBranches(),
        getRegions().catch(() => []),
      ]);
      setBranches(branchesData);
      setRegions(regionsData);
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
  }, [searchTerm, sortOrder]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({ branchCode: '', name: '', address: '', phone: '', regionId: '' });
    setIsOpen(true);
  };

  const handleOpenEdit = (branch: any) => {
    setEditingId(branch.id);
    setFormData({
      branchCode: branch.branchCode,
      name: branch.name,
      address: branch.address || '',
      phone: branch.phone || '',
      regionId: branch.regionId || '',
    });
    setIsOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Hapus cabang ini? Data PO terkait mungkin terpengaruh.')) {
      try {
        await deleteBranch(id);
        toast.success('Cabang berhasil dihapus');
        fetchData();
      } catch (error) {
        toast.error('Gagal menghapus cabang. Mungkin cabang ini sudah memiliki PO.');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingId) {
        await updateBranch(editingId, formData);
        toast.success('Cabang berhasil diperbarui');
      } else {
        await createBranch(formData);
        toast.success('Cabang baru berhasil ditambahkan');
      }
      setIsOpen(false);
      fetchData();
    } catch (error) {
      console.error('Gagal menyimpan cabang:', error);
      toast.error('Gagal simpan! Pastikan Kode Cabang belum digunakan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredAndSortedBranches = branches
    .filter((b) => {
      const searchLower = searchTerm.toLowerCase();
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

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="h-14 w-14 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
          <AlertTriangle className="h-7 w-7 text-destructive" />
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-2">Gagal Memuat Cabang</h2>
        <p className="text-sm text-muted-foreground max-w-md mb-6">
          Tidak dapat memuat data cabang. Periksa koneksi server atau coba lagi.
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
                <Skeleton className="h-4 w-32" />
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
      <PageHeader icon={Store} title="Daftar Cabang" subtitle="Manajemen Jaringan CV Berdikari">
        <Button
          variant="outline"
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          className="h-9 bg-white ring-1 ring-border text-xs font-semibold text-muted-foreground px-4 rounded-xl hover:bg-muted"
        >
          <ArrowUpDown className="h-3.5 w-3.5 mr-2 text-brand-800" />
          {sortOrder === 'asc' ? 'A - Z' : 'Z - A'}
        </Button>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Cari Cabang..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-44 h-9 pl-9 rounded-xl bg-white ring-1 ring-border focus:ring-2 focus:ring-brand-600 transition-all text-sm"
          />
        </div>

        <Button
          onClick={handleOpenAdd}
          className="h-9 px-5 bg-brand-800 hover:bg-brand-900 text-white font-semibold rounded-xl text-xs transition-all active:scale-95 shadow-md"
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Tambah Cabang
        </Button>
      </PageHeader>

      <div className="bg-white rounded-xl shadow-sm ring-1 ring-border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Kode</TableHead>
                <TableHead>Wilayah</TableHead>
                <TableHead>Nama Cabang</TableHead>
                <TableHead>Kontak</TableHead>
                <TableHead>Alamat</TableHead>
                <TableHead className="pr-6 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedBranches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-24 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <FileText className="h-10 w-10 opacity-40" />
                      <p className="text-xs font-medium italic">
                        Tidak ada cabang ditemukan.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedBranches.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="pl-6 font-semibold text-brand-800 text-sm tracking-tight uppercase font-mono">
                      {b.branchCode}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider ${
                          b.region
                            ? 'bg-brand-50 text-brand-800 ring-1 ring-brand-200'
                            : 'bg-muted text-muted-foreground ring-1 ring-border'
                        }`}
                      >
                        {b.region ? b.region.name : 'BELUM DIATUR'}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {b.name}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                        <Phone className="h-3 w-3" /> {b.phone || '-'}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs max-w-[200px]">
                      <div className="flex items-center gap-1.5 truncate" title={b.address}>
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">{b.address || '-'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(b)}
                          className="h-8 w-8 text-muted-foreground hover:text-amber-600 hover:bg-amber-50 rounded-lg"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(b.id)}
                          className="h-8 w-8 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 rounded-lg"
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

        <PaginationFooter
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredAndSortedBranches.length}
          onPageChange={setCurrentPage}
          label="CABANG"
        />
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md bg-white rounded-xl border-none shadow-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              <Store className="h-5 w-5 text-brand-800" />
              {editingId ? 'Edit Data Cabang' : 'Registrasi Cabang Baru'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold uppercase text-muted-foreground">
                  Kode Cabang
                </Label>
                <Input
                  value={formData.branchCode}
                  onChange={(e) =>
                    setFormData({ ...formData, branchCode: e.target.value.toUpperCase() })
                  }
                  required
                  placeholder="MCD-001"
                  className="h-9 rounded-lg bg-muted ring-1 ring-border focus:ring-2 focus:ring-brand-800 font-semibold uppercase"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold uppercase text-brand-800">
                  Wilayah
                </Label>
                <Select
                  value={formData.regionId}
                  onValueChange={(val) => setFormData({ ...formData, regionId: val })}
                  required
                >
                  <SelectTrigger className="h-9 font-semibold text-xs bg-brand-50 text-brand-900 ring-1 ring-brand-200 focus:ring-2 focus:ring-brand-800">
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
                          className="font-semibold text-xs uppercase text-foreground"
                        >
                          {r.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1 border-t border-border pt-3">
              <Label className="text-xs font-semibold uppercase text-muted-foreground">
                Nama Cabang
              </Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="Contoh: McD Kelapa Dua"
                className="h-9 rounded-lg bg-muted ring-1 ring-border focus:ring-2 focus:ring-brand-800"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold uppercase text-muted-foreground">
                Telepon / Kontak
              </Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="021-xxxxxxx"
                className="h-9 rounded-lg bg-muted ring-1 ring-border focus:ring-2 focus:ring-brand-800"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold uppercase text-muted-foreground">
                Alamat Lengkap
              </Label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Jl. Raya Utama No.123..."
                className="h-9 rounded-lg bg-muted ring-1 ring-border focus:ring-2 focus:ring-brand-800"
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-10 mt-2 bg-brand-800 hover:bg-brand-900 text-white font-semibold rounded-lg text-xs uppercase tracking-wider shadow-md transition-all active:scale-95"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : editingId ? 'Update Data Cabang' : 'Simpan Cabang Baru'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
