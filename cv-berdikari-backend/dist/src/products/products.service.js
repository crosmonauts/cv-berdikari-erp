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
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ProductsService = class ProductsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createProductDto) {
        return this.prisma.$transaction(async (tx) => {
            const product = await tx.product.create({
                data: {
                    sku: createProductDto.sku,
                    name: createProductDto.name,
                    defaultClientSku: createProductDto.defaultClientSku || null,
                    price: createProductDto.price,
                    barcode: createProductDto.barcode,
                },
            });
            await tx.stockBatch.create({
                data: {
                    productId: product.id,
                    purchasePrice: createProductDto.buyPrice,
                    initialQuantity: createProductDto.stock,
                    currentQuantity: createProductDto.stock,
                    receivedAt: new Date(),
                },
            });
            return product;
        });
    }
    async restock(productId, data) {
        return this.prisma.stockBatch.create({
            data: {
                productId: productId,
                initialQuantity: Number(data.quantity),
                currentQuantity: Number(data.quantity),
                purchasePrice: Number(data.purchasePrice),
                receivedAt: new Date(),
            },
        });
    }
    async findAll() {
        const products = await this.prisma.product.findMany({
            include: {
                batches: {
                    where: { currentQuantity: { gt: 0 } },
                    orderBy: { receivedAt: 'asc' },
                },
            },
        });
        return products.map((p) => {
            const totalStock = p.batches.reduce((sum, b) => sum + b.currentQuantity, 0);
            const currentBuyPrice = p.batches.length > 0 ? p.batches[0].purchasePrice : 0;
            return {
                ...p,
                stock: totalStock,
                buyPrice: currentBuyPrice,
            };
        });
    }
    async findOne(id) {
        const product = await this.prisma.product.findUnique({
            where: { id },
            include: { batches: true },
        });
        if (!product)
            throw new common_1.NotFoundException('Produk tidak ditemukan!');
        return {
            ...product,
            stock: product.batches.reduce((sum, b) => sum + b.currentQuantity, 0),
        };
    }
    async deductStockFIFO(productId, quantityToDeduct) {
        return this.prisma.$transaction(async (tx) => {
            let remainingNeed = quantityToDeduct;
            const activeBatches = await tx.stockBatch.findMany({
                where: { productId: productId, currentQuantity: { gt: 0 } },
                orderBy: { receivedAt: 'asc' },
            });
            for (const batch of activeBatches) {
                if (remainingNeed <= 0)
                    break;
                if (batch.currentQuantity >= remainingNeed) {
                    await tx.stockBatch.update({
                        where: { id: batch.id },
                        data: { currentQuantity: batch.currentQuantity - remainingNeed },
                    });
                    remainingNeed = 0;
                }
                else {
                    remainingNeed -= batch.currentQuantity;
                    await tx.stockBatch.update({
                        where: { id: batch.id },
                        data: { currentQuantity: 0 },
                    });
                }
            }
            if (remainingNeed > 0) {
                throw new Error(`Stok gudang tidak mencukupi! Kurang ${remainingNeed} unit.`);
            }
        });
    }
    update(id, updateProductDto) {
        return this.prisma.product.update({
            where: { id },
            data: updateProductDto,
        });
    }
    remove(id) {
        return this.prisma.product.delete({
            where: { id },
        });
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProductsService);
//# sourceMappingURL=products.service.js.map