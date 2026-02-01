import type { ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Upload,
  Package,
  LogOut,
  User,
  Bell
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

interface MainLayoutProps {
  children: ReactNode;
}

const menuItems = [
  { path: '/', label: 'Inicio', icon: LayoutDashboard },
  { path: '/sync', label: 'Carga Masiva', icon: Upload },
  { path: '/products', label: 'Productos', icon: Package },
];

export function MainLayout({ children }: MainLayoutProps) {
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const getPageTitle = () => {
    const item = menuItems.find(item => item.path === location.pathname);
    return item?.label || 'Dashboard';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col fixed h-full shadow-sm">
        {/* Logo */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#dbdbdb] rounded-xl flex items-center justify-center shadow-sm">
              <span className="text-gray-700 text-lg font-bold">H</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">HyperPC</h1>
              <p className="text-xs text-gray-500">Dashboard</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                  ? 'bg-gray-100 text-gray-900 font-medium shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-gray-700' : ''}`} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <User className="w-4 h-4 text-gray-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.name || 'Usuario'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.email || ''}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-2.5 w-full text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 mt-2"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm">Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-64">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-10">
          <div className="px-8 py-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              {getPageTitle()}
            </h2>

            <div className="flex items-center gap-3">
              <button className="relative p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all duration-200">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
