import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import MainLayout from "@/components/layout/MainLayout";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import RouteRoleGuard from "@/components/layout/RouteRoleGuard";
import { ErrorBoundary } from "@/components/shared/error-boundary";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import ProductsPage from "@/pages/ProductsPage";
import BranchesPage from "@/pages/BranchesPage";
import RegionsPage from "@/pages/RegionsPage";
import UsersPage from "@/pages/UsersPage";
import ProductCategoriesPage from "@/pages/product-categories/ProductCategoriesPage";
import OrdersPage from "@/pages/OrdersPage";
import InvoicesPage from "@/pages/InvoicesPage";
import WarehousePage from "@/pages/WarehousePage";
import TaxReportsPage from "@/pages/TaxReportsPage";
import ShipmentsPage from "@/pages/ShipmentsPage";
import ProfilePage from "./pages/ProfilPage";

function RouteGuard({ allowedRoles, children }: { allowedRoles: string[]; children: React.ReactNode }) {
  return <RouteRoleGuard allowedRoles={allowedRoles}>{children}</RouteRoleGuard>;
}

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors closeButton />
      <Routes>
        <Route path="/login" element={<ErrorBoundary><LoginPage /></ErrorBoundary>} />

        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<ErrorBoundary><DashboardPage /></ErrorBoundary>} />
            <Route path="/products" element={
              <RouteGuard allowedRoles={['SUPERADMIN', 'ADMIN', 'GUDANG']}>
                <ErrorBoundary><ProductsPage /></ErrorBoundary>
              </RouteGuard>
            } />
            <Route path="/branches" element={
              <RouteGuard allowedRoles={['SUPERADMIN', 'ADMIN']}>
                <ErrorBoundary><BranchesPage /></ErrorBoundary>
              </RouteGuard>
            } />
            <Route path="/regions" element={
              <RouteGuard allowedRoles={['SUPERADMIN', 'ADMIN']}>
                <ErrorBoundary><RegionsPage /></ErrorBoundary>
              </RouteGuard>
            } />
            <Route path="/users" element={
              <RouteGuard allowedRoles={['SUPERADMIN']}>
                <ErrorBoundary><UsersPage /></ErrorBoundary>
              </RouteGuard>
            } />
            <Route path="/product-categories" element={
              <RouteGuard allowedRoles={['SUPERADMIN', 'ADMIN']}>
                <ErrorBoundary><ProductCategoriesPage /></ErrorBoundary>
              </RouteGuard>
            } />
            <Route path="/orders" element={<ErrorBoundary><OrdersPage /></ErrorBoundary>} />
            <Route path="/invoices" element={
              <RouteGuard allowedRoles={['SUPERADMIN', 'ADMIN', 'EKSPEDISI']}>
                <ErrorBoundary><InvoicesPage /></ErrorBoundary>
              </RouteGuard>
            } />
            <Route path="/warehouse" element={
              <RouteGuard allowedRoles={['SUPERADMIN', 'ADMIN', 'GUDANG']}>
                <ErrorBoundary><WarehousePage /></ErrorBoundary>
              </RouteGuard>
            } />
            <Route path="/shipments" element={
              <RouteGuard allowedRoles={['SUPERADMIN', 'ADMIN', 'EKSPEDISI']}>
                <ErrorBoundary><ShipmentsPage /></ErrorBoundary>
              </RouteGuard>
            } />
            <Route path="/tax-reports" element={
              <RouteGuard allowedRoles={['SUPERADMIN', 'ADMIN']}>
                <ErrorBoundary><TaxReportsPage /></ErrorBoundary>
              </RouteGuard>
            } />
            <Route path="/profile" element={<ErrorBoundary><ProfilePage /></ErrorBoundary>} />
          </Route>
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;
