import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute() {
  // Solusi anti-blank screen: Pengecekan token sederhana dan langsung
  const token = localStorage.getItem("token");

  // Jika tidak ada token (belum login), lempar paksa ke halaman login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Jika token ada, izinkan masuk ke rute aplikasi (Dashboard, dsb)
  return <Outlet />;
}