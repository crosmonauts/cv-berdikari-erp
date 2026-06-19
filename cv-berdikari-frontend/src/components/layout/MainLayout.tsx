import { useState, useRef, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  LayoutDashboard,
  Package,
  Store,
  MapPin,
  FileText,
  Receipt,
  LogOut,
  PackageOpen,
  Truck,
  ChevronDown,
  ChevronRight,
  User,
  FolderTree,
  Database,
  Menu,
  X,
} from 'lucide-react';
import { getOrderCounts } from '@/modules/orders/api';

type NavItem = { name: string; href: string; icon: any };
type NavGroup = { name: string; icon: any; children: NavItem[] };

const allNav: (NavItem | NavGroup)[] = [
  { name: 'Beranda', href: '/dashboard', icon: LayoutDashboard },
  {
    name: 'Master Data',
    icon: Database,
    children: [
      { name: 'Produk', href: '/products', icon: Package },
      { name: 'Cabang', href: '/branches', icon: Store },
      { name: 'Wilayah', href: '/regions', icon: MapPin },
      { name: 'Kategori', href: '/product-categories', icon: FolderTree },
      { name: 'Pengguna', href: '/users', icon: User },
    ],
  },
  { name: 'Pesanan (PO)', href: '/orders', icon: FileText },
  { name: 'Tagihan', href: '/invoices', icon: Receipt },
  { name: 'Gudang', href: '/warehouse', icon: PackageOpen },
  { name: 'Pengiriman', href: '/shipments', icon: Truck },
];

function filterNavByRole(nav: (NavItem | NavGroup)[], role: string): (NavItem | NavGroup)[] {
  return nav.filter((item) => {
    if ('children' in item) {
      if (item.name === 'Master Data') {
        const allowedChildren: Record<string, string[]> = {
          SUPERADMIN: ['Produk', 'Cabang', 'Wilayah', 'Kategori', 'Pengguna'],
          ADMIN: ['Produk', 'Cabang', 'Wilayah', 'Kategori'],
          GUDANG: ['Produk'],
          EKSPEDISI: [],
        };
        const visible = (allowedChildren[role] || []);
        item.children = item.children.filter((c) => visible.includes(c.name));
        return item.children.length > 0;
      }
      return true;
    }
    const flatItem = item as NavItem;
    const routeAccess: Record<string, string[]> = {
      '/invoices': ['SUPERADMIN', 'ADMIN', 'EKSPEDISI'],
      '/warehouse': ['SUPERADMIN', 'ADMIN', 'GUDANG'],
      '/shipments': ['SUPERADMIN', 'ADMIN', 'EKSPEDISI'],
      '/products': ['SUPERADMIN', 'ADMIN', 'GUDANG'],
    };
    const allowed = routeAccess[flatItem.href];
    return !allowed || allowed.includes(role);
  });
}

export default function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [userData, setUserData] = useState<{
    name: string;
    email: string;
    role: string;
  } | null>(null);

  const [warehouseCount, setWarehouseCount] = useState(0);
  const [isMasterOpen, setIsMasterOpen] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const visibleNav = userData?.role
    ? filterNavByRole(allNav, userData.role)
    : allNav;

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUserData(JSON.parse(storedUser));
      } catch {
        setUserData(null);
      }
    }
  }, []);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const counts = await getOrderCounts();
        setWarehouseCount(counts.warehouseQueue);
      } catch {
        // siluman
      }
    };
    fetchCounts();
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
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
    localStorage.removeItem('user');
    navigate('/login');
  };

  const getInitials = (name: string) => {
    if (!name) return 'AD';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const isActivePath = (href: string) => {
    if (href === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(href);
  };

  return (
    <div className="flex h-screen w-full bg-background font-sans overflow-hidden selection:bg-primary/15 selection:text-primary">
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:relative inset-y-0 left-0 w-64 shrink-0 bg-foreground flex flex-col shadow-2xl z-30 transition-transform duration-300`}>
        <div className="flex h-20 items-center px-8 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-brand-500 flex items-center justify-center text-white font-bold text-sm">
              B
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-white leading-none block">
                Berdikari
              </span>
              <span className="text-[10px] font-medium text-brand-400 uppercase tracking-widest leading-none">
                Enterprise
              </span>
            </div>
          </div>
        </div>

        <nav className="p-3 space-y-0.5 flex-1 overflow-y-auto">
          {visibleNav.map((item) => {
            if ('children' in item) {
              const isGroupActive = item.children.some((c) => isActivePath(c.href));
              return (
                <div key={item.name} className="space-y-0.5">
                  <button
                    onClick={() => setIsMasterOpen(!isMasterOpen)}
                    className={`flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group relative ${
                      isGroupActive
                        ? 'text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {isGroupActive && (
                      <motion.div
                        layoutId="nav-active"
                        className="absolute inset-0 bg-brand-800 rounded-lg"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                    <div className={`relative z-10 mr-3 flex items-center justify-center w-5 h-5 transition-colors ${
                      isGroupActive
                        ? 'text-brand-300'
                        : 'text-slate-500 group-hover:text-slate-300'
                    }`}>
                      <item.icon className="h-5 w-5" />
                    </div>
                    <span className="relative z-10 flex-1 text-left">{item.name}</span>
                    {isMasterOpen ? (
                      <ChevronDown className="relative z-10 h-4 w-4 text-slate-500" />
                    ) : (
                      <ChevronRight className="relative z-10 h-4 w-4 text-slate-500" />
                    )}
                    {isGroupActive && (
                      <div className="relative z-10 ml-2 w-1.5 h-1.5 rounded-full bg-brand-400" />
                    )}
                  </button>
                  <AnimatePresence initial={false}>
                    {isMasterOpen && (
                      <motion.div
                        key="master-children"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        {item.children.map((child) => {
                          const isChildActive = isActivePath(child.href);
                          return (
                            <Link
                              key={child.name}
                              to={child.href}
                              className={`flex items-center pl-10 pr-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 group relative ${
                                isChildActive
                                  ? 'text-white'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              {isChildActive && (
                                <motion.div
                                  layoutId="nav-active"
                                  className="absolute inset-0 bg-brand-800/70 rounded-lg"
                                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                />
                              )}
                              <div className={`relative z-10 mr-2.5 flex items-center justify-center w-4 h-4 transition-colors ${
                                isChildActive
                                  ? 'text-brand-300'
                                  : 'text-slate-500 group-hover:text-slate-300'
                              }`}>
                                <child.icon className="h-4 w-4" />
                              </div>
                              <span className="relative z-10 text-xs">{child.name}</span>
                              {isChildActive && (
                                <div className="relative z-10 ml-auto w-1.5 h-1.5 rounded-full bg-brand-400" />
                              )}
                            </Link>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            }
            const flatItem = item as NavItem;
            const isActive = isActivePath(flatItem.href);
            return (
              <Link
                key={flatItem.name}
                to={flatItem.href}
                className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group relative ${
                  isActive
                    ? 'text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-active"
                    className="absolute inset-0 bg-brand-800 rounded-lg"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <div className={`relative z-10 mr-3 flex items-center justify-center w-5 h-5 transition-colors ${
                  isActive
                    ? 'text-brand-300'
                    : 'text-slate-500 group-hover:text-slate-300'
                }`}>
                  <flatItem.icon className="h-5 w-5" />
                </div>
                <span className="relative z-10">{flatItem.name}</span>
                {flatItem.name === 'Gudang' && warehouseCount > 0 && (
                  <span className="relative z-10 ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand-600 px-1.5 text-[10px] font-bold text-white leading-none">
                    {warehouseCount > 99 ? '99+' : warehouseCount}
                  </span>
                )}
                {isActive && flatItem.name !== 'Gudang' && (
                  <div className="relative z-10 ml-auto w-1.5 h-1.5 rounded-full bg-brand-400" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5 shrink-0">
          <p className="text-[10px] text-slate-600 font-medium text-center">
            &copy; {new Date().getFullYear()} Berdikari ERP
          </p>
        </div>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0 h-screen relative">
        <header className="h-16 shrink-0 bg-white border-b border-border z-20 flex items-center px-8 justify-end">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 mr-auto text-muted-foreground hover:text-foreground transition-colors"
            aria-label={sidebarOpen ? 'Tutup sidebar' : 'Buka sidebar'}
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-3 p-1.5 pr-3 rounded-full hover:bg-muted transition-all border border-transparent hover:border-border group"
            >
              <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-brand-800 to-brand-600 flex items-center justify-center text-white font-semibold text-sm shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all">
                {getInitials(userData?.name || '')}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider leading-none mb-1">
                  {userData?.role || 'User'}
                </p>
                <p className="text-sm font-semibold text-foreground leading-none">
                  {userData?.name || 'Administrator'}
                </p>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-muted-foreground transition-transform duration-300 ${isProfileOpen ? 'rotate-180' : ''}`}
              />
            </button>

            <AnimatePresence>
              {isProfileOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-2xl border border-border py-2 z-50 origin-top-right"
                >
                  <div className="px-4 py-3 border-b border-border mb-1">
                    <p className="text-sm font-semibold text-foreground">
                      {userData?.name || 'Admin Utama'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {userData?.email || 'admin@berdikari.com'}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      navigate('/profile');
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted transition-colors"
                  >
                    <User className="h-4 w-4" />
                    Profil Saya
                  </button>

                  <div className="h-px bg-border my-1 mx-2" />

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/5 font-semibold transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Keluar Sistem
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-background">
          <div className="p-6 lg:p-8 min-h-full">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Outlet />
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}
