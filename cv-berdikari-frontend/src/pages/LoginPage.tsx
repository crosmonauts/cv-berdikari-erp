import { useState } from 'react';
import { toast } from 'sonner';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import api from '@/lib/api';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const redirectTo = searchParams.get('redirect') || '/dashboard';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await api.post(`/auth/login`, { email, password });
      const data = response.data;

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      navigate(redirectTo);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-foreground font-sans">
      <div className="bg-white p-10 rounded-3xl shadow-2xl w-full max-w-md border border-border animate-in fade-in zoom-in duration-500">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 text-white shadow-lg mb-5">
            <span className="text-2xl font-bold">B</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-1 tracking-tight">
            Berdikari ERP
          </h1>
          <p className="text-sm text-muted-foreground font-medium">
            Masuk ke akun Anda untuk melanjutkan
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-semibold text-foreground ml-1">
              Alamat Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@berdikari.com"
              required
              className="h-11 bg-muted border-border rounded-xl focus:ring-2 focus:ring-brand-600 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-1">
              <Label htmlFor="password" className="text-xs font-semibold text-foreground">
                Kata Sandi
              </Label>
              <button
                type="button"
                onClick={() =>
                  toast.error('Silakan hubungi Super Admin untuk reset password.')
                }
                className="text-[11px] font-semibold text-brand-800 hover:text-brand-600 hover:underline transition-all"
              >
                Lupa kata sandi?
              </button>
            </div>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan kata sandi"
              required
              className="h-11 bg-muted border-border rounded-xl focus:ring-2 focus:ring-brand-600 transition-all"
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 bg-brand-800 hover:bg-brand-900 text-white font-semibold rounded-xl mt-2 shadow-lg shadow-brand-200 active:scale-[0.98] transition-all"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Memproses...
              </div>
            ) : (
              'Masuk ke Sistem'
            )}
          </Button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-[11px] text-muted-foreground font-medium">
            &copy; {new Date().getFullYear()} CV Berdikari. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
