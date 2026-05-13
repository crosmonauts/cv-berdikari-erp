import { PrismaService } from '../prisma/prisma.service';
export declare class OrdersService {
    private prisma;
    constructor(prisma: PrismaService);
    create(createOrderDto: any): Promise<{
        id: string;
        createdAt: Date;
        poNumber: string;
        totalAmount: number;
        branchId: string;
        status: string;
        paymentStatus: string | null;
        poDocumentUrl: string | null;
    }>;
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
        invoice: ({
            receipt: {
                id: string;
                issuedDate: Date;
                invoiceId: string;
                receiptNumber: string;
            } | null;
        } & {
            id: string;
            orderId: string;
            invoiceNumber: string;
            issuedDate: Date;
            dueDate: Date;
        }) | null;
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
        items: ({
            product: {
                id: string;
                name: string;
                createdAt: Date;
                sku: string;
                price: number;
                barcode: string | null;
                defaultClientSku: string | null;
            };
        } & {
            id: string;
            productId: string;
            quantity: number;
            scannedQty: number;
            priceAtBuy: number;
            costPriceAtBuy: number;
            clientItemCode: string | null;
            orderId: string;
        })[];
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
    update(id: string, updateOrderDto: any): Promise<{
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
    }>;
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
