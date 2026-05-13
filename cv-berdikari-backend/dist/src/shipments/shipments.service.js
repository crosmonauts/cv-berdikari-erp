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
exports.ShipmentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ShipmentsService = class ShipmentsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createShipment(createShipmentDto) {
        const order = await this.prisma.purchaseOrder.findUnique({
            where: { id: createShipmentDto.orderId },
        });
        if (!order)
            throw new common_1.NotFoundException('Pesanan (PO) tidak ditemukan');
        return this.prisma.shipment.upsert({
            where: {
                orderId: createShipmentDto.orderId,
            },
            update: {
                documentNumber: createShipmentDto.documentNumber,
                shippingCost: createShipmentDto.shippingCost,
                otherFees: createShipmentDto.otherFees,
                ...(createShipmentDto.proofUrl && {
                    proofUrl: createShipmentDto.proofUrl,
                }),
            },
            create: {
                orderId: createShipmentDto.orderId,
                type: createShipmentDto.type || 'AWB',
                documentNumber: createShipmentDto.documentNumber,
                shippingCost: createShipmentDto.shippingCost,
                otherFees: createShipmentDto.otherFees,
                proofUrl: createShipmentDto.proofUrl || null,
            },
        });
    }
    findAll() {
        return this.prisma.shipment.findMany({
            include: { order: true },
        });
    }
};
exports.ShipmentsService = ShipmentsService;
exports.ShipmentsService = ShipmentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ShipmentsService);
//# sourceMappingURL=shipments.service.js.map