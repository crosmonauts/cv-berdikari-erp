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
exports.TaxReportsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let TaxReportsService = class TaxReportsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) {
        const invoice = await this.prisma.invoice.findUnique({
            where: { id: dto.invoiceId },
            include: {
                order: true,
            },
        });
        if (!invoice) {
            throw new common_1.NotFoundException(`Invoice dengan ID ${dto.invoiceId} tidak ditemukan.`);
        }
        const totalGross = invoice.order.totalAmount;
        const dpp = totalGross / 1.11;
        const ppn = totalGross - dpp;
        return this.prisma.taxReport.create({
            data: {
                taxFakturNum: dto.taxFakturNum,
                dpp: parseFloat(dpp.toFixed(2)),
                taxAmount: parseFloat(ppn.toFixed(2)),
                status: 'REPORTED',
                invoiceId: dto.invoiceId,
            },
            include: {
                invoice: {
                    include: {
                        order: true,
                    },
                },
            },
        });
    }
    async findAll() {
        return this.prisma.taxReport.findMany({
            include: {
                invoice: {
                    select: {
                        invoiceNumber: true,
                        issuedDate: true,
                        order: {
                            select: {
                                poNumber: true,
                                totalAmount: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                id: 'desc',
            },
        });
    }
    async findOne(id) {
        const report = await this.prisma.taxReport.findUnique({
            where: { id },
            include: {
                invoice: {
                    include: {
                        order: true,
                    },
                },
            },
        });
        if (!report)
            throw new common_1.NotFoundException('Laporan pajak tidak ditemukan.');
        return report;
    }
    async update(id, dto) {
        return this.prisma.taxReport.update({
            where: { id },
            data: dto,
        });
    }
    async remove(id) {
        return this.prisma.taxReport.delete({
            where: { id },
        });
    }
};
exports.TaxReportsService = TaxReportsService;
exports.TaxReportsService = TaxReportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TaxReportsService);
//# sourceMappingURL=tax-reports.service.js.map