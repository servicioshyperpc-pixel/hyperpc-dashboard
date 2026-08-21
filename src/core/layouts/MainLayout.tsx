import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  LogOut,
  User,
  Bell,
  Menu,
  X,
  CircleAlert,
  ClipboardList,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import axiosInstance from '../../api/axiosInstance';

interface MainLayoutProps {
  children: ReactNode;
}

interface LogEntry {
  _id?: string;
  id?: string;
  service?: string;
  action?: string;
  status?: string;
  orderId?: string;
  productSku?: string;
  marketplace?: string;
  createdAt?: string;
}

const menuItems = [
  { path: '/', label: 'Inicio', icon: LayoutDashboard },
  { path: '/products', label: 'Productos', icon: Package },
  { path: '/orders', label: 'Órdenes', icon: ClipboardList },
  { path: '/errors', label: 'Historial', icon: CircleAlert },
];

const ERROR_STATUSES = new Set(['error', 'warning', 'partial']);
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export function MainLayout({ children }: MainLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    let mounted = true;

    const loadNotifications = async () => {
      try {
        const response = await axiosInstance.get<LogEntry[]>('/logs');
        if (mounted) {
          setLogs(Array.isArray(response.data) ? response.data : []);
        }
      } catch {
        if (mounted) {
          setLogs([]);
        }
      }
    };

    loadNotifications();
    const interval = window.setInterval(loadNotifications, 60000);

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  const notificationCount = useMemo(() => {
    const now = Date.now();
    return logs.filter((log) => {
      if (!log.status || !ERROR_STATUSES.has(log.status)) return false;
      if (!log.createdAt) return true;
      return now - new Date(log.createdAt).getTime() <= SEVEN_DAYS_MS;
    }).length;
  }, [logs]);

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen bg-[#f6f3ee] text-gray-900">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={closeSidebar} />
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-[#111827] text-white border-r border-white/10 flex flex-col shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#d6b77a] to-[#a06d2c] flex items-center justify-center shadow-lg">
                <span className="text-white text-lg font-bold">H</span>
              </div>
              <div>
                <h1 className="text-lg font-bold">HyperPC</h1>
                <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Operations</p>
              </div>
            </div>
            <button onClick={closeSidebar} className="lg:hidden p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={closeSidebar}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 ${
                  isActive
                    ? 'bg-white text-gray-950 font-medium shadow-sm'
                    : 'text-gray-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="rounded-2xl bg-white/5 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-gray-200" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.name || 'Usuario'}</p>
                <p className="text-xs text-gray-400 truncate">{user?.email || ''}</p>
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            className="mt-3 flex items-center gap-3 px-4 py-2.5 w-full text-gray-300 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm">Cerrar sesión</span>
          </button>
        </div>
      </aside>

      <main className="lg:ml-72 min-h-screen">
        <header className="sticky top-0 z-30 border-b border-black/5 bg-[#f6f3ee]/90 backdrop-blur-md">
          <div className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-black/5 rounded-lg mr-3"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* El título del módulo ya lo muestra cada vista con su propio encabezado;
                aquí solo dejamos el espaciador para empujar las acciones a la derecha. */}
            <div className="min-w-0 flex-1" />

            <button
              onClick={() => navigate('/errors')}
              className="relative p-2.5 text-gray-500 hover:text-gray-700 hover:bg-black/5 rounded-xl transition-all duration-200"
              title={notificationCount > 0 ? `${notificationCount} incidentes recientes` : 'Sin incidentes recientes'}
            >
              <Bell className="w-5 h-5" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-[11px] font-semibold text-white flex items-center justify-center ring-2 ring-[#f6f3ee]">
                  {notificationCount > 99 ? '99+' : notificationCount}
                </span>
              )}
            </button>
          </div>
        </header>

        <div className="p-3 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
