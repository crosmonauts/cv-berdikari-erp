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
  MapPin,
  Plus,
  Search,
  Edit3,
  Trash2,
  AlertTriangle,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import {
  getRegions,
  createRegion,
  updateRegion,
  deleteRegion,
} from '@/modules/regions/api';
import type { Region } from '@/modules/regions/types';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/page-header';
import { PaginationFooter } from '@/components/shared/pagination-footer';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { Skeleton } from '@/components/shared/skeleton';

export default function RegionsPage() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
  });

  const fetchData = async () => {
    setIsError(false);
    try {
      const data = await getRegions();
      setRegions(data);
    } catch (error) {
      console.error(error);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => { setCurrentPage(1); }, [searchTerm]);

  const filtered = regions.filter(
    (r) =>
      r.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({ code: '', name: '' });
    setIsOpen(true);
  };

  const handleOpenEdit = (region: Region) => {
    setEditingId(region.id);
    setFormData({
      code: region.code,
      name: region.name,
    });
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        code: formData.code,
        name: formData.name,
      };
      if (editingId) {
        await updateRegion(editingId, payload);
        toast.success('Wilayah berhasil diperbarui');
      } else {
        await createRegion(payload);
        toast.success('Wilayah baru berhasil ditambahkan');
      }
      setIsOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Gagal menyimpan wilayah!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setPendingDelete(id);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deleteRegion(pendingDelete);
      fetchData();
    } catch (error) {
      toast.error('Gagal menghapus wilayah.');
    }
  };

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="h-14 w-14 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
          <AlertTriangle className="h-7 w-7 text-destructive" />
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-2">Gagal Memuat Wilayah</h2>
        <p className="text-sm text-muted-foreground max-w-md mb-6">
          Tidak dapat memuat data wilayah. Periksa koneksi server.
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
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20" />
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
      <PageHeader icon={MapPin} title="Wilayah" subtitle="Manajemen Wilayah & Regional">
        <Button
          onClick={handleOpenAdd}
          className="bg-brand-800 hover:bg-brand-900 text-white font-semibold text-xs rounded-xl h-11 px-5 shadow-md transition-all active:scale-95"
        >
          <Plus className="mr-2 h-4 w-4" /> Tambah Wilayah
        </Button>
      </PageHeader>

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-brand-800 transition-colors" />
        <Input
          placeholder="Cari berdasarkan kode atau nama..."
          className="pl-11 h-12 bg-white border-none ring-1 ring-border rounded-xl shadow-sm focus:ring-2 focus:ring-brand-800 transition-all font-medium text-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm ring-1 ring-border flex flex-col">
        <Table>
          <TableHeader className="bg-muted">
            <TableRow className="border-b border-border">
              <TableHead className="pl-4 py-2.5 w-[1%] whitespace-nowrap text-xs font-semibold uppercase text-muted-foreground">Kode</TableHead>
              <TableHead className="py-2.5 px-4 text-center text-xs font-semibold uppercase text-muted-foreground">Nama Wilayah</TableHead>
              <TableHead className="pr-4 py-2.5 w-[1%] whitespace-nowrap text-xs font-semibold uppercase text-muted-foreground text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="py-24 text-center">
                  <div className="flex flex-col items-center gap-2 opacity-40">
                    <MapPin className="h-10 w-10 text-muted-foreground" />
                    <p className="text-xs font-bold uppercase italic text-muted-foreground">
                      Tidak ada wilayah ditemukan.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((region) => (
                <TableRow key={region.id} className="hover:bg-muted/50 border-b border-border/50 last:border-none transition-colors">
                  <TableCell className="pl-4 py-2.5 w-[1%] whitespace-nowrap">
                    <span className="font-bold text-foreground uppercase tracking-tight">{region.code}</span>
                  </TableCell>
                  <TableCell className="py-2.5 px-4 text-center">
                    <span className="font-bold text-muted-foreground text-xs">{region.name}</span>
                  </TableCell>
                  <TableCell className="pr-4 py-2.5 w-[1%] whitespace-nowrap text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(region)}
                        className="h-8 w-8 text-muted-foreground hover:text-amber-600 hover:bg-amber-50 rounded-lg">
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(region.id)}
                        className="h-8 w-8 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 rounded-lg">
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
          totalItems={filtered.length}
          onPageChange={setCurrentPage}
          label="WILAYAH"
        />
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Hapus Wilayah"
        description="Hapus wilayah ini? Data terkait (cabang, harga) akan terpengaruh."
        onConfirm={handleConfirmDelete}
      />

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md bg-white rounded-xl p-6 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="font-bold text-xl text-foreground">
              {editingId ? 'Ubah Wilayah' : 'Tambah Wilayah Baru'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-1">
              <Label className="text-xs font-semibold uppercase text-muted-foreground">Kode Wilayah</Label>
              <Input value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                required disabled={!!editingId}
                className="h-10 font-bold bg-muted uppercase border-none ring-1 ring-border focus:ring-2 focus:ring-brand-800" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold uppercase text-muted-foreground">Nama Wilayah</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="h-10 font-bold bg-muted border-none ring-1 ring-border focus:ring-2 focus:ring-brand-800" />
            </div>
            <Button type="submit" disabled={isSubmitting}
              className="w-full h-12 bg-foreground hover:bg-foreground/90 text-white font-bold uppercase text-sm tracking-widest border-none transition-all active:scale-95 shadow-lg">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : editingId ? 'SIMPAN PERUBAHAN' : 'TAMBAH WILAYAH'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
