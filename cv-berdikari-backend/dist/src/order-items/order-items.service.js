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
exports.OrderItemsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const products_service_1 = require("../products/products.service");
let OrderItemsService = class OrderItemsService {
    prisma;
    productsService;
    constructor(prisma, productsService) {
        this.prisma = prisma;
        this.productsService = productsService;
    }
    async create(createOrderItemDto) {
        const product = await this.prisma.product.findUnique({
            where: { id: createOrderItemDto.productId },
        });
        if (!product) {
            throw new common_1.NotFoundException('Produk tidak ditemukan di katalog!');
        }
        return this.prisma.orderItem.create({
            data: {
                orderId: createOrderItemDto.orderId,
                productId: createOrderItemDto.productId,
                quantity: Number(createOrderItemDto.quantity),
                priceAtBuy: product.price,
                scannedQty: 0,
            },
        });
    }
    findByOrderId(orderId) {
        return this.prisma.orderItem.findMany({
            where: { orderId: orderId },
            include: {
                product: true,
            },
        });
    }
    remove(id) {
        return this.prisma.orderItem.delete({
            where: { id },
        });
    }
    async scanBarcode(orderId, barcode, qty = 1) {
        return this.prisma.$transaction(async (tx) => {
            const product = await tx.product.findUnique({
                where: { barcode: barcode },
            });
            if (!product) {
                throw new Error('Barcode tidak ditemukan di sistem!');
            }
            const orderItem = await tx.orderItem.findFirst({
                where: {
                    orderId: orderId,
                    productId: product.id,
                },
            });
            if (!orderItem) {
                throw new Error('Barang ini tidak ada di dalam Purchase Order!');
            }
            if (orderItem.scannedQty >= orderItem.quantity) {
                throw new Error('Barang ini sudah selesai disiapkan (Memenuhi PO).');
            }
            const sisaDibutuhkan = orderItem.quantity - orderItem.scannedQty;
            if (qty > sisaDibutuhkan) {
                throw new Error(`Kelebihan jumlah! Anda memasukkan ${qty}, tapi sisa yang dibutuhkan hanya ${sisaDibutuhkan} barang lagi.`);
            }
            const updatedItem = await tx.orderItem.update({
                where: { id: orderItem.id },
                data: { scannedQty: { increment: qty } },
                include: { product: true },
            });
            await this.productsService.deductStockFIFO(product.id, qty);
            return updatedItem;
        });
    }
};
exports.OrderItemsService = OrderItemsService;
exports.OrderItemsService = OrderItemsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        products_service_1.ProductsService])
], OrderItemsService);
//# sourceMappingURL=order-items.service.js.map