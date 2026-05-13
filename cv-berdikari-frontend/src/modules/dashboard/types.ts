import type { Order } from "../orders/types";

export interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalBranches: number;
  totalRevenue: number;
  // Meminjam tipe data Order yang sudah kita buat sebelumnya
  recentOrders: Order[]; 
}