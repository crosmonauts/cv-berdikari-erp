import { PrismaService } from '../prisma/prisma.service';
export declare class ShipmentsService {
    private prisma;
    constructor(prisma: PrismaService);
    createShipment(createShipmentDto: any): Promise<{
        id: string;
        status: string;
        orderId: string;
        type: string;
        documentNumber: string;
        shippingCost: number | null;
        otherFees: number | null;
        proofUrl: string | null;
        shippedAt: Date;
    }>;
    findAll(): import("@prisma/client").Prisma.PrismaPromise<({
        order: {
            id: string;
            createdAt: Date;
            poNumber: string;
            totalAmount: number;
            branchId: string;
            status: string;
            paymentStatus: string | null;
            poDocumentUrl: string | null;
        };
    } & {
        id: string;
        status: string;
        orderId: string;
        type: string;
        documentNumber: string;
        shippingCost: number | null;
        otherFees: number | null;
        proofUrl: string | null;
        shippedAt: Date;
    })[]>;
}
