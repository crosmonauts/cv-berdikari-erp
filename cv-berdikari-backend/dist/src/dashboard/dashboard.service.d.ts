import { PrismaService } from '../prisma/prisma.service';
export declare class DashboardService {
    private prisma;
    constructor(prisma: PrismaService);
    getDashboardStats(): Promise<{
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
        recentOrders: ({
            branch: {
                id: string;
                name: string;
                branchCode: string;
                address: string;
                phone: string | null;
                region: string;
                npwp: string | null;
            };
            shipment: {
                id: string;
                status: string;
                orderId: string;
                type: string;
                documentNumber: string;
                shippingCost: number | null;
                otherFees: number | null;
                proofUrl: string | null;
                shippedAt: Date;
            } | null;
            items: {
                id: string;
                productId: string;
                quantity: number;
                scannedQty: number;
                priceAtBuy: number;
                costPriceAtBuy: number;
                clientItemCode: string | null;
                orderId: string;
            }[];
        } & {
            id: string;
            createdAt: Date;
            poNumber: string;
            totalAmount: number;
            branchId: string;
            status: string;
            paymentStatus: string | null;
            poDocumentUrl: string | null;
        })[];
    }>;
}
