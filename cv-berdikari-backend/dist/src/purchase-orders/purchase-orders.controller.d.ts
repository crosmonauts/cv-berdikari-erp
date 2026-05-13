import { PurchaseOrdersService } from './purchase-orders.service';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';
export declare class PurchaseOrdersController {
    private readonly purchaseOrdersService;
    constructor(purchaseOrdersService: PurchaseOrdersService);
    create(createPurchaseOrderDto: CreatePurchaseOrderDto): import("@prisma/client").Prisma.Prisma__PurchaseOrderClient<{
        id: string;
        createdAt: Date;
        poNumber: string;
        totalAmount: number;
        branchId: string;
        status: string;
        paymentStatus: string | null;
        poDocumentUrl: string | null;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    findAll(): import("@prisma/client").Prisma.PrismaPromise<({
        branch: {
            id: string;
            name: string;
            branchCode: string;
            address: string;
            phone: string | null;
            region: string;
            npwp: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        poNumber: string;
        totalAmount: number;
        branchId: string;
        status: string;
        paymentStatus: string | null;
        poDocumentUrl: string | null;
    })[]>;
    findOne(id: string): import("@prisma/client").Prisma.Prisma__PurchaseOrderClient<({
        branch: {
            id: string;
            name: string;
            branchCode: string;
            address: string;
            phone: string | null;
            region: string;
            npwp: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        poNumber: string;
        totalAmount: number;
        branchId: string;
        status: string;
        paymentStatus: string | null;
        poDocumentUrl: string | null;
    }) | null, null, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    update(id: string, updatePurchaseOrderDto: UpdatePurchaseOrderDto): import("@prisma/client").Prisma.Prisma__PurchaseOrderClient<{
        id: string;
        createdAt: Date;
        poNumber: string;
        totalAmount: number;
        branchId: string;
        status: string;
        paymentStatus: string | null;
        poDocumentUrl: string | null;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    remove(id: string): import("@prisma/client").Prisma.Prisma__PurchaseOrderClient<{
        id: string;
        createdAt: Date;
        poNumber: string;
        totalAmount: number;
        branchId: string;
        status: string;
        paymentStatus: string | null;
        poDocumentUrl: string | null;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
}
