import { useState, useEffect } from 'react';
import {
  User,
  Mail,
  ShieldCheck,
  Briefcase,
  Camera,
  Building2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';

export default function ProfilePage() {
  const [userData, setUserData] = useState({
    name: 'Administrator',
    email: 'admin@berdikari.com',
    role: 'Admin',
    office: 'CV Berdikari - Kantor Pusat',
    status: 'Active',
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUserData((prevData) => ({
          ...prevData,
          name: parsedUser.name || prevData.name,
          email: parsedUser.email || prevData.email,
          role: parsedUser.role || prevData.role,
        }));
      } catch (e) {
        console.error('Failed to parse stored user', e);
      }
    }
  }, []);

  return (
    <div className="min-h-full space-y-6">
      <PageHeader icon={User} title="Profil Pengguna" subtitle="Identitas Pegawai CV Berdikari" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6 flex flex-col items-center">
              <div className="relative group">
                <div className="h-24 w-24 bg-gradient-to-br from-brand-50 to-brand-100 rounded-full flex items-center justify-center ring-4 ring-white shadow-md">
                  <User className="h-12 w-12 text-brand-600" />
                </div>
                <button className="absolute bottom-0 right-0 h-8 w-8 bg-white rounded-full shadow-lg border border-border flex items-center justify-center text-muted-foreground hover:text-brand-800 transition-colors">
                  <Camera className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 text-center">
                <h2 className="text-lg font-bold text-foreground">
                  {userData.name}
                </h2>
                <div className="mt-1.5">
                  <StatusBadge variant="success" label={userData.status} />
                </div>
              </div>

              <div className="w-full border-t border-border/50 mt-6 pt-6 space-y-3">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <ShieldCheck className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    {userData.role}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Kantor Pusat
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="px-6 py-4 border-b bg-muted/30">
              <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-brand-600" /> Informasi Pekerjaan
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold uppercase text-muted-foreground">
                    Jabatan
                  </Label>
                  <p className="text-sm font-medium text-foreground">
                    {userData.role}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold uppercase text-muted-foreground">
                    Email Kantor
                  </Label>
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" /> {userData.email}
                  </div>
                </div>
                <div className="sm:col-span-2 space-y-1 border-t border-border/50 pt-4">
                  <Label className="text-xs font-semibold uppercase text-muted-foreground">
                    Organisasi
                  </Label>
                  <p className="text-sm font-medium text-foreground">
                    {userData.office}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="text-left">
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          Sesi aktif: {new Date().toLocaleDateString('id-ID')} &middot; Berdikari ERP v2.0
        </p>
      </div>
    </div>
  );
}
