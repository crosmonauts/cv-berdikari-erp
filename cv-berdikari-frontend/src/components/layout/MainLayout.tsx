import { useState, useRef, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Store,
  FileText,
  Receipt,
  LogOut,
  PackageOpen,
  Truck,
  ChevronDown,
  User,
} from 'lucide-react';

export default function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // STATE BARU: Untuk menyimpan data user yang sedang login
  const [userData, setUserData] = useState<{
    name: string;
    email: string;
    role: string;
  } | null>(null);

  const navigation = [
    { name: 'Beranda', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Produk', href: '/products', icon: Package },
    { name: 'Cabang', href: '/branches', icon: Store },
    { name: 'Pesanan (PO)', href: '/orders', icon: FileText },
    { name: 'Tagihan', href: '/invoices', icon: Receipt },
    { name: 'Gudang', href: '/warehouse', icon: PackageOpen },
    { name: 'Pengiriman', href: '/shipments', icon: Truck },
  ];

  // Mengambil data user dari LocalStorage saat layout pertama kali dimuat
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUserData(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user'); // Bersihkan juga data user saat logout
    navigate('/login');
  };

  // FUNGSI BARU: Membuat inisial 2 huruf otomatis dari nama
  const getInitials = (name: string) => {
    if (!name) return 'AD';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="flex h-screen w-full bg-slate-300 font-sans overflow-hidden">
      <div className="w-64 shrink-0 bg-slate-950 flex flex-col shadow-2xl z-30">
        <div className="flex h-20 items-center px-8 border-b border-slate-800/50 shrink-0">
          <span className="text-xl font-bold tracking-tight text-white">
            Sistem <span className="text-indigo-500">Berdikari</span>
          </span>
        </div>

        <nav className="p-4 space-y-2 flex-1 mt-4 overflow-y-auto custom-scrollbar">
          {navigation.map((item) => {
            const isActive = location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/30'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <item.icon
                  className={`mr-3 h-5 w-5 transition-colors ${
                    isActive
                      ? 'text-white'
                      : 'text-slate-500 group-hover:text-white'
                  }`}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex-1 flex flex-col min-w-0 h-screen relative">
        <header className="h-20 shrink-0 bg-white border-b border-slate-200 shadow-sm z-20 flex items-center px-8 justify-end">
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-3 p-1.5 pr-3 rounded-full hover:bg-slate-100 transition-all border border-transparent hover:border-slate-200 group"
            >
              {/* INISIAL AVATAR DINAMIS */}
              <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white font-bold text-sm shadow-md group-hover:scale-105 transition-transform">
                {getInitials(userData?.name || '')}
              </div>
              <div className="text-left hidden sm:block">
                {/* ROLE & NAMA DINAMIS */}
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mb-1">
                  {userData?.role || 'User'}
                </p>
                <p className="text-sm font-bold text-slate-700 leading-none">
                  {userData?.name || 'Administrator'}
                </p>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-slate-400 transition-transform duration-300 ${isProfileOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in duration-200 origin-top-right">
                <div className="px-4 py-3 border-b border-slate-50 mb-1">
                  {/* NAMA & EMAIL DINAMIS DI DROPDOWN */}
                  <p className="text-sm font-bold text-slate-800">
                    {userData?.name || 'Admin Utama'}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {userData?.email || 'admin@berdikari.com'}
                  </p>
                </div>

                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    navigate('/profile');
                  }}
                  className="w-full flex items-center px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <User className="mr-3 h-4 w-4 text-slate-400" />
                  Profil Saya
                </button>

                <div className="h-px bg-slate-100 my-1 mx-2"></div>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 font-bold transition-colors"
                >
                  <LogOut className="mr-3 h-4 w-4 text-red-400" />
                  Keluar Sistem
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-300">
          <div className="p-8 min-h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
