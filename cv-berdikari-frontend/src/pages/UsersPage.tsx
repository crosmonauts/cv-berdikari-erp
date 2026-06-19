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
  User,
  Plus,
  Search,
  Edit3,
  Trash2,
  AlertTriangle,
  RefreshCw,
  Shield,
  Loader2,
} from 'lucide-react';
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} from '@/modules/users/api';
import type { User as UserType } from '@/modules/users/types';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/page-header';
import { PaginationFooter } from '@/components/shared/pagination-footer';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { Skeleton } from '@/components/shared/skeleton';

const roleColors: Record<string, string> = {
  SUPERADMIN: 'bg-purple-50 text-purple-700 ring-purple-200',
  ADMIN: 'bg-brand-50 text-brand-900 ring-brand-200',
  GUDANG: 'bg-amber-50 text-amber-700 ring-amber-200',
  EKSPEDISI: 'bg-cyan-50 text-cyan-700 ring-cyan-200',
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserType[]>([]);
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
    name: '',
    email: '',
    password: '',
    role: 'ADMIN',
  });

  const fetchData = async () => {
    setIsError(false);
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (error) {
      console.error(error);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => { setCurrentPage(1); }, [searchTerm]);

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({ name: '', email: '', password: '', role: 'ADMIN' });
    setIsOpen(true);
  };

  const handleOpenEdit = (user: UserType) => {
    setEditingId(user.id);
    setFormData({ name: user.name, email: user.email, password: '', role: user.role });
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingId) {
        const payload: any = { name: formData.name, email: formData.email, role: formData.role };
        await updateUser(editingId, payload);
        toast.success('Data pengguna berhasil diperbarui');
      } else {
        await createUser({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
        });
        toast.success('Pengguna baru berhasil ditambahkan');
      }
      setIsOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Gagal menyimpan pengguna!');
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
      await deleteUser(pendingDelete);
      toast.success('Pengguna berhasil dihapus');
      fetchData();
    } catch (error) {
      toast.error('Gagal menghapus pengguna.');
    }
  };

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="h-14 w-14 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
          <AlertTriangle className="h-7 w-7 text-destructive" />
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-2">Gagal Memuat Pengguna</h2>
        <p className="text-sm text-muted-foreground max-w-md mb-6">Tidak dapat memuat data pengguna.</p>
        <Button onClick={fetchData} className="gap-2"><RefreshCw className="h-4 w-4" /> Coba Lagi</Button>
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
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-40" />
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
      <PageHeader icon={User} title="Pengguna" subtitle="Manajemen Akun & Hak Akses">
        <Button onClick={handleOpenAdd}
          className="bg-brand-800 hover:bg-brand-900 text-white font-semibold text-xs rounded-xl h-11 px-5 shadow-md transition-all active:scale-95">
          <Plus className="mr-2 h-4 w-4" /> Tambah Pengguna
        </Button>
      </PageHeader>

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-brand-800 transition-colors" />
        <Input placeholder="Cari berdasarkan nama atau email..."
          className="pl-11 h-12 bg-white border-none ring-1 ring-border rounded-xl shadow-sm focus:ring-2 focus:ring-brand-800 transition-all font-medium text-sm"
          value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>

      <div className="bg-white rounded-xl shadow-sm ring-1 ring-border flex flex-col">
        <Table>
          <TableHeader className="bg-muted">
            <TableRow className="border-b border-border">
              <TableHead className="pl-6 py-4 text-xs font-semibold uppercase text-muted-foreground">Nama</TableHead>
              <TableHead className="py-4 text-xs font-semibold uppercase text-muted-foreground">Email</TableHead>
              <TableHead className="py-4 text-xs font-semibold uppercase text-muted-foreground text-center">Role</TableHead>
              <TableHead className="py-4 text-xs font-semibold uppercase text-muted-foreground">Dibuat</TableHead>
              <TableHead className="pr-6 py-4 text-xs font-semibold uppercase text-muted-foreground text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-24 text-center">
                  <div className="flex flex-col items-center gap-2 opacity-40">
                    <User className="h-10 w-10 text-muted-foreground" />
                    <p className="text-xs font-bold uppercase italic text-muted-foreground">Tidak ada pengguna ditemukan.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((user) => (
                <TableRow key={user.id} className="hover:bg-muted/50 border-b border-border/50 last:border-none transition-colors">
                  <TableCell className="pl-6 py-4">
                    <span className="font-bold text-foreground">{user.name}</span>
                  </TableCell>
                  <TableCell className="py-4">
                    <span className="font-medium text-muted-foreground text-xs">{user.email}</span>
                  </TableCell>
                  <TableCell className="py-4 text-center">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase ring-1 ${roleColors[user.role] || 'bg-muted text-muted-foreground ring-border'}`}>
                      <Shield className="h-3 w-3" /> {user.role}
                    </span>
                  </TableCell>
                  <TableCell className="py-4">
                    <span className="text-xs text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </TableCell>
                  <TableCell className="pr-6 py-4 text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(user)}
                        className="h-8 w-8 text-muted-foreground hover:text-amber-600 hover:bg-amber-50 rounded-lg">
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(user.id)}
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
          currentPage={currentPage} totalPages={totalPages}
          totalItems={filtered.length} onPageChange={setCurrentPage} label="PENGGUNA"         />
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Hapus Pengguna"
        description="Hapus pengguna ini? Tindakan ini tidak bisa dibatalkan."
        onConfirm={handleConfirmDelete}
      />

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md bg-white rounded-xl p-6 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="font-bold text-xl text-foreground">
              {editingId ? 'Ubah Pengguna' : 'Tambah Pengguna Baru'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-1">
              <Label className="text-xs font-semibold uppercase text-muted-foreground">Nama</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required className="h-10 font-bold bg-muted border-none ring-1 ring-border focus:ring-2 focus:ring-brand-800" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold uppercase text-muted-foreground">Email</Label>
              <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required className="h-10 bg-muted border-none ring-1 ring-border focus:ring-2 focus:ring-brand-800" />
            </div>
            {!editingId && (
              <div className="space-y-1">
                <Label className="text-xs font-semibold uppercase text-muted-foreground">Password</Label>
                <Input type="password" value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required minLength={6}
                  className="h-10 bg-muted border-none ring-1 ring-border focus:ring-2 focus:ring-brand-800" />
              </div>
            )}
            <div className="space-y-1">
              <Label className="text-xs font-semibold uppercase text-muted-foreground">Role / Hak Akses</Label>
              <Select value={formData.role} onValueChange={(val) => setFormData({ ...formData, role: val })} required>
                <SelectTrigger className="h-10 font-bold bg-muted border-none ring-1 ring-border focus:ring-2 focus:ring-brand-800 shadow-none">
                  <SelectValue placeholder="Pilih Role..." />
                </SelectTrigger>
                <SelectContent position="popper" className="bg-white">
                  <SelectItem value="SUPERADMIN">SUPERADMIN</SelectItem>
                  <SelectItem value="ADMIN">ADMIN</SelectItem>
                  <SelectItem value="GUDANG">GUDANG</SelectItem>
                  <SelectItem value="EKSPEDISI">EKSPEDISI</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={isSubmitting}
              className="w-full h-12 bg-foreground hover:bg-foreground/90 text-white font-bold uppercase text-sm tracking-widest border-none transition-all active:scale-95 shadow-lg">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : editingId ? 'SIMPAN PERUBAHAN' : 'TAMBAH PENGGUNA'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
