import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaService } from '../prisma/prisma.service';
export declare class ProductsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(createProductDto: CreateProductDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        sku: string;
        price: number;
        barcode: string | null;
        defaultClientSku: string | null;
    }>;
    restock(productId: string, data: {
        quantity: number;
        purchasePrice: number;
    }): Promise<{
        id: string;
        purchasePrice: number;
        initialQuantity: number;
        currentQuantity: number;
        receivedAt: Date;
        productId: string;
    }>;
    findAll(): Promise<{
        stock: number;
        buyPrice: number;
        batches: {
            id: string;
            purchasePrice: number;
            initialQuantity: number;
            currentQuantity: number;
            receivedAt: Date;
            productId: string;
        }[];
        id: string;
        name: string;
        createdAt: Date;
        sku: string;
        price: number;
        barcode: string | null;
        defaultClientSku: string | null;
    }[]>;
    findOne(id: string): Promise<{
        stock: number;
        batches: {
            id: string;
            purchasePrice: number;
            initialQuantity: number;
            currentQuantity: number;
            receivedAt: Date;
            productId: string;
        }[];
        id: string;
        name: string;
        createdAt: Date;
        sku: string;
        price: number;
        barcode: string | null;
        defaultClientSku: string | null;
    }>;
    deductStockFIFO(productId: string, quantityToDeduct: number): Promise<void>;
    update(id: string, updateProductDto: UpdateProductDto): import("@prisma/client").Prisma.Prisma__ProductClient<{
        id: string;
        name: string;
        createdAt: Date;
        sku: string;
        price: number;
        barcode: string | null;
        defaultClientSku: string | null;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    remove(id: string): import("@prisma/client").Prisma.Prisma__ProductClient<{
        id: string;
        name: string;
        createdAt: Date;
        sku: string;
        price: number;
        barcode: string | null;
        defaultClientSku: string | null;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
}
