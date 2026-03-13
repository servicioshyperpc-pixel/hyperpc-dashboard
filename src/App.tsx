import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginView } from './views/auth/LoginView';
import { DashboardView } from './views/dashboard/DashboardView';
import { ProductList } from './views/products/ProductList';
import { MainLayout } from './core/layouts/MainLayout';
import { OrdersView } from './views/orders/OrdersView';
import { ErrorsView } from './views/errors/ErrorsView';
import { useAuthStore } from './store/useAuthStore';

const ProtectedLayout = ({ children }: { children: React.ReactNode }) => (
  <MainLayout>{children}</MainLayout>
);

function App() {
  const { isAuthenticated, isBootstrapping, bootstrapAuth } = useAuthStore();

  useEffect(() => {
    bootstrapAuth();
  }, [bootstrapAuth]);

  if (isBootstrapping) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-gray-700" />
          <p className="mt-4 text-sm uppercase tracking-[0.2em] text-gray-500">Cargando sesión</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/" replace /> : <LoginView />}
        />

        <Route
          path="/"
          element={isAuthenticated ? <ProtectedLayout><DashboardView /></ProtectedLayout> : <Navigate to="/login" replace />}
        />
        <Route
          path="/products"
          element={isAuthenticated ? <ProtectedLayout><ProductList /></ProtectedLayout> : <Navigate to="/login" replace />}
        />
        <Route
          path="/orders"
          element={isAuthenticated ? <ProtectedLayout><OrdersView /></ProtectedLayout> : <Navigate to="/login" replace />}
        />
        <Route
          path="/errors"
          element={isAuthenticated ? <ProtectedLayout><ErrorsView /></ProtectedLayout> : <Navigate to="/login" replace />}
        />

        <Route path="*" element={<Navigate to={isAuthenticated ? '/' : '/login'} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
