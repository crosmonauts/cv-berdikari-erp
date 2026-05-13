import { ShipmentsService } from './shipments.service';
export declare class ShipmentsController {
    private readonly shipmentsService;
    constructor(shipmentsService: ShipmentsService);
    create(createShipmentDto: any, file: Express.Multer.File): Promise<{
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
