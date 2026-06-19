import type { Order } from "../orders/types";

export interface DashboardStats {
  totalProfit: number;
  totalNetRevenue: number;
  totalCOGS: number;
  totalShippingCosts: number;
  totalInventoryValue: number;
  totalItemsInStock: number;
  totalSales: number;
  activeOrdersCount: number;
  productCount: number;
  branchCount: number;
  recentOrders: Order[];
}
