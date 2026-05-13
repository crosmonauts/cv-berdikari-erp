"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let DashboardService = class DashboardService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getDashboardStats() {
        const products = await this.prisma.product.findMany({
            include: {
                batches: {
                    where: { currentQuantity: { gt: 0 } },
                },
            },
        });
        const completedOrders = await this.prisma.purchaseOrder.findMany({
            where: {
                status: { in: ['SELESAI', 'DIKIRIM'] },
            },
            include: {
                items: true,
                shipment: true,
            },
        });
        const allOrders = await this.prisma.purchaseOrder.findMany();
        const branchCount = await this.prisma.branch.count();
        const recentOrders = await this.prisma.purchaseOrder.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
                branch: true,
                shipment: true,
                items: true,
            },
        });
        let totalNetRevenue = 0;
        let totalCOGS = 0;
        let totalShippingCosts = 0;
        completedOrders.forEach((order) => {
            order.items.forEach((item) => {
                const revenueNetto = item.priceAtBuy / 1.11;
                const modal = item.costPriceAtBuy || 0;
                totalNetRevenue += revenueNetto * item.quantity;
                totalCOGS += modal * item.quantity;
            });
            if (order.shipment) {
                const ongkir = Number(order.shipment.shippingCost || 0);
                const biayaLain = Number(order.shipment.otherFees || 0);
                totalShippingCosts += ongkir + biayaLain;
            }
        });
        const totalNetProfit = totalNetRevenue - totalCOGS - totalShippingCosts;
        const totalInventoryValue = products.reduce((acc, product) => {
            return (acc +
                product.batches.reduce((sum, b) => sum + b.currentQuantity * b.purchasePrice, 0));
        }, 0);
        const totalItemsInStock = products.reduce((acc, p) => acc + p.batches.reduce((s, b) => s + b.currentQuantity, 0), 0);
        const totalSalesGross = allOrders.reduce((acc, order) => acc + order.totalAmount, 0);
        const activeOrdersCount = await this.prisma.purchaseOrder.count({
            where: {
                status: { in: ['PENDING', 'DIPROSES', 'PROSES_KIRIM', 'DIKIRIM'] },
            },
        });
        return {
            totalProfit: totalNetProfit,
            totalNetRevenue,
            totalCOGS,
            totalShippingCosts,
            totalInventoryValue,
            totalItemsInStock,
            totalSales: totalSalesGross,
            activeOrdersCount,
            productCount: products.length,
            branchCount,
            recentOrders,
        };
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map