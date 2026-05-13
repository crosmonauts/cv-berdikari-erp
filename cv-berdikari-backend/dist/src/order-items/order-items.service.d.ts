import { PrismaService } from '../prisma/prisma.service';
import { ProductsService } from '../products/products.service';
export declare class OrderItemsService {
    private prisma;
    private productsService;
    constructor(prisma: PrismaService, productsService: ProductsService);
    create(createOrderItemDto: any): Promise<{
        id: string;
        productId: string;
        quantity: number;
        scannedQty: number;
        priceAtBuy: number;
        costPriceAtBuy: number;
        clientItemCode: string | null;
        orderId: string;
    }>;
    findByOrderId(orderId: string): import("@prisma/client").Prisma.PrismaPromise<({
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
    })[]>;
    remove(id: string): import("@prisma/client").Prisma.Prisma__OrderItemClient<{
        id: string;
        productId: string;
        quantity: number;
        scannedQty: number;
        priceAtBuy: number;
        costPriceAtBuy: number;
        clientItemCode: string | null;
        orderId: string;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    scanBarcode(orderId: string, barcode: string, qty?: number): Promise<{
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
    }>;
}
