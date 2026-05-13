import { OrderItemsService } from './order-items.service';
export declare class OrderItemsController {
    private readonly orderItemsService;
    constructor(orderItemsService: OrderItemsService);
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
    scanBarcode(body: {
        orderId: string;
        barcode: string;
        qty?: number;
    }): Promise<{
        success: boolean;
        data: {
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
        };
        message?: undefined;
    } | {
        success: boolean;
        message: any;
        data?: undefined;
    }>;
}
