import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import ProductsPage from "@/pages/ProductsPage";
import BranchesPage from "@/pages/BranchesPage";
import OrdersPage from "@/pages/OrdersPage";
import InvoicesPage from "@/pages/InvoicesPage";
import WarehousePage from "@/pages/WarehousePage";
import ShipmentsPage from "@/pages/ShipmentsPage"; // <--- Import Halaman Ekspedisi
import ProfilePage from "./pages/ProfilPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/branches" element={<BranchesPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/invoices" element={<InvoicesPage />} />
            <Route path="/warehouse" element={<WarehousePage />} />
            <Route path="/shipments" element={<ShipmentsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;