import { useState, useEffect } from 'react';
import {
  User,
  Mail,
  ShieldCheck,
  Briefcase,
  Camera,
  Building2,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

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
      const parsedUser = JSON.parse(storedUser);
      setUserData((prevData) => ({
        ...prevData,
        name: parsedUser.name || prevData.name,
        email: parsedUser.email || prevData.email,
        role: parsedUser.role || prevData.role,
      }));
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-300 px-2 pt-1 pb-10 space-y-4">
      {/* HEADER SECTION */}
      <div className="max-w-6xl flex items-center gap-3 py-2">
        <div className="h-10 w-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-indigo-600 ring-1 ring-slate-200">
          <User className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Profil Pengguna
          </h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
            Identitas Pegawai CV Berdikari
          </p>
        </div>
      </div>

      {/* CONTENT GRID */}
      <div className="max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* LEFT COLUMN: AVATAR & STATUS */}
        <div className="space-y-6">
          <Card className="border-none shadow-sm ring-1 ring-slate-200 rounded-xl overflow-hidden bg-white">
            <CardContent className="p-6 flex flex-col items-center">
              <div className="relative group">
                <div className="h-24 w-24 bg-indigo-50 rounded-full flex items-center justify-center ring-4 ring-white shadow-md">
                  <User className="h-12 w-12 text-indigo-400" />
                </div>
                <button className="absolute bottom-0 right-0 h-8 w-8 bg-white rounded-full shadow-lg border border-slate-100 flex items-center justify-center text-slate-500 hover:text-indigo-600 transition-colors">
                  <Camera className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 text-center">
                <h2 className="text-lg font-bold text-slate-900">
                  {userData.name}
                </h2>
                <div className="mt-1 inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[9px] font-bold uppercase ring-1 ring-emerald-100">
                  <CheckCircle2 className="h-3 w-3" /> {userData.status}
                </div>
              </div>

              <div className="w-full border-t border-slate-50 mt-6 pt-6 space-y-3">
                <div className="flex items-center gap-3 text-slate-500">
                  <ShieldCheck className="h-4 w-4 text-slate-300" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    {userData.role}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-slate-500">
                  <Building2 className="h-4 w-4 text-slate-300" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    Kantor Pusat
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: DETAILS ONLY */}
        <div className="md:col-span-2 space-y-6">
          {/* PERSONAL INFO */}
          <Card className="border-none shadow-sm ring-1 ring-slate-200 rounded-xl bg-white">
            <CardHeader className="px-6 py-4 border-b border-slate-50 bg-slate-50/50">
              <CardTitle className="text-sm font-bold text-slate-800 uppercase tracking-tight flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-indigo-500" /> Informasi
                Pekerjaan
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold uppercase text-slate-400">
                    Jabatan
                  </Label>
                  <p className="text-sm font-semibold text-slate-700">
                    {userData.role}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold uppercase text-slate-400">
                    Email Kantor
                  </Label>
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <Mail className="h-3.5 w-3.5 text-slate-300" />{' '}
                    {userData.email}
                  </div>
                </div>
                <div className="sm:col-span-2 space-y-1 border-t border-slate-50 pt-4">
                  <Label className="text-[10px] font-bold uppercase text-slate-400">
                    Organisasi
                  </Label>
                  <p className="text-sm font-semibold text-slate-700">
                    {userData.office}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* FOOTER INFO */}
      <div className="max-w-6xl text-left pl-1">
        <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">
          Sesi aktif: {new Date().toLocaleDateString('id-ID')} • Berdikari ERP
          v2.0
        </p>
      </div>
    </div>
  );
}
