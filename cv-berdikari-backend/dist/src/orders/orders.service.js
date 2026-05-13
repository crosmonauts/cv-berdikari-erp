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
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let OrdersService = class OrdersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createOrderDto) {
        return this.prisma.$transaction(async (tx) => {
            let parsedItems = [];
            try {
                if (createOrderDto.items) {
                    parsedItems =
                        typeof createOrderDto.items === 'string'
                            ? JSON.parse(createOrderDto.items)
                            : createOrderDto.items;
                }
            }
            catch (error) {
                throw new common_1.BadRequestException('Format daftar barang gagal diproses');
            }
            const itemsWithCost = await Promise.all(parsedItems.map(async (item) => {
                const activeBatches = await tx.stockBatch.findMany({
                    where: { productId: item.productId, currentQuantity: { gt: 0 } },
                    orderBy: { receivedAt: 'asc' },
                });
                const modalSaatIni = activeBatches.length > 0 ? activeBatches[0].purchasePrice : 0;
                return {
                    productId: item.productId,
                    quantity: Number(item.quantity),
                    priceAtBuy: Number(item.price),
                    costPriceAtBuy: modalSaatIni,
                    clientItemCode: item.clientItemCode || null,
                };
            }));
            const newOrder = await tx.purchaseOrder.create({
                data: {
                    poNumber: createOrderDto.poNumber,
                    totalAmount: Number(createOrderDto.totalAmount),
                    branchId: createOrderDto.branchId,
                    status: 'PENDING',
                    paymentStatus: 'BELUM',
                    poDocumentUrl: createOrderDto.poDocumentUrl || null,
                    items: {
                        create: itemsWithCost,
                    },
                },
            });
            return newOrder;
        });
    }
    findAll() {
        return this.prisma.purchaseOrder.findMany({
            include: {
                branch: true,
                invoice: { include: { receipt: true } },
                shipment: true,
                items: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    findOne(id) {
        return this.prisma.purchaseOrder.findUnique({
            where: { id },
            include: { items: { include: { product: true } }, branch: true },
        });
    }
    async update(id, updateOrderDto) {
        return this.prisma.$transaction(async (tx) => {
            const oldOrder = await tx.purchaseOrder.findUnique({
                where: { id },
                include: { items: true },
            });
            if (!oldOrder)
                throw new common_1.NotFoundException('PO tidak ditemukan');
            if (updateOrderDto.items) {
                const parsedItems = typeof updateOrderDto.items === 'string'
                    ? JSON.parse(updateOrderDto.items)
                    : updateOrderDto.items;
                const itemsWithCost = await Promise.all(parsedItems.map(async (item) => {
                    const activeBatches = await tx.stockBatch.findMany({
                        where: { productId: item.productId, currentQuantity: { gt: 0 } },
                        orderBy: { receivedAt: 'asc' },
                    });
                    return {
                        productId: item.productId,
                        quantity: Number(item.quantity),
                        priceAtBuy: Number(item.price),
                        costPriceAtBuy: activeBatches.length > 0 ? activeBatches[0].purchasePrice : 0,
                        clientItemCode: item.clientItemCode || null,
                    };
                }));
                await tx.orderItem.deleteMany({ where: { orderId: id } });
                await tx.orderItem.createMany({
                    data: itemsWithCost.map((i) => ({ ...i, orderId: id })),
                });
            }
            const updatedOrder = await tx.purchaseOrder.update({
                where: { id },
                data: {
                    status: updateOrderDto.status || oldOrder.status,
                    paymentStatus: updateOrderDto.paymentStatus || oldOrder.paymentStatus,
                    totalAmount: updateOrderDto.totalAmount
                        ? Number(updateOrderDto.totalAmount)
                        : oldOrder.totalAmount,
                },
                include: { items: true },
            });
            return updatedOrder;
        });
    }
    remove(id) {
        return this.prisma.purchaseOrder.delete({ where: { id } });
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OrdersService);
//# sourceMappingURL=orders.service.js.map