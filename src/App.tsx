import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { LoginView } from './views/auth/LoginView'
import { DashboardView } from './views/dashboard/DashboardView'
import { ProductList } from './views/products/ProductList'
import { BulkUpload } from './views/sync/BulkUpload'
import { MainLayout } from './core/layouts/MainLayout'
import { useAuthStore } from './store/useAuthStore'

function App() {
  const { isAuthenticated } = useAuthStore()

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route 
          path="/login" 
          element={isAuthenticated ? <Navigate to="/" replace /> : <LoginView />} 
        />

        {/* Protected routes */}
        <Route 
          path="/" 
          element={
            isAuthenticated ? (
              <MainLayout>
                <DashboardView />
              </MainLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        <Route 
          path="/products" 
          element={
            isAuthenticated ? (
              <MainLayout>
                <ProductList />
              </MainLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        <Route 
          path="/sync" 
          element={
            isAuthenticated ? (
              <MainLayout>
                <BulkUpload />
              </MainLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
