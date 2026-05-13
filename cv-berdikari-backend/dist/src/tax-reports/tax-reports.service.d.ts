import { PrismaService } from '../prisma/prisma.service';
export declare class TaxReportsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(dto: {
        invoiceId: string;
        taxFakturNum: string;
    }): Promise<{
        invoice: {
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
            orderId: string;
            invoiceNumber: string;
            issuedDate: Date;
            dueDate: Date;
        };
    } & {
        id: string;
        status: string;
        taxFakturNum: string;
        dpp: number;
        taxAmount: number;
        invoiceId: string;
    }>;
    findAll(): Promise<({
        invoice: {
            order: {
                poNumber: string;
                totalAmount: number;
            };
            invoiceNumber: string;
            issuedDate: Date;
        };
    } & {
        id: string;
        status: string;
        taxFakturNum: string;
        dpp: number;
        taxAmount: number;
        invoiceId: string;
    })[]>;
    findOne(id: string): Promise<{
        invoice: {
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
            orderId: string;
            invoiceNumber: string;
            issuedDate: Date;
            dueDate: Date;
        };
    } & {
        id: string;
        status: string;
        taxFakturNum: string;
        dpp: number;
        taxAmount: number;
        invoiceId: string;
    }>;
    update(id: string, dto: {
        taxFakturNum?: string;
        status?: string;
    }): Promise<{
        id: string;
        status: string;
        taxFakturNum: string;
        dpp: number;
        taxAmount: number;
        invoiceId: string;
    }>;
    remove(id: string): Promise<{
        id: string;
        status: string;
        taxFakturNum: string;
        dpp: number;
        taxAmount: number;
        invoiceId: string;
    }>;
}
