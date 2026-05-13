import { InvoicesService } from './invoices.service';
export declare class InvoicesController {
    private readonly invoicesService;
    constructor(invoicesService: InvoicesService);
    create(createInvoiceDto: any): import("@prisma/client").Prisma.Prisma__InvoiceClient<{
        id: string;
        orderId: string;
        invoiceNumber: string;
        issuedDate: Date;
        dueDate: Date;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    findAll(): import("@prisma/client").Prisma.PrismaPromise<{
        id: string;
        orderId: string;
        invoiceNumber: string;
        issuedDate: Date;
        dueDate: Date;
    }[]>;
    findOne(id: string): import("@prisma/client").Prisma.Prisma__InvoiceClient<{
        id: string;
        orderId: string;
        invoiceNumber: string;
        issuedDate: Date;
        dueDate: Date;
    } | null, null, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    update(id: string, updateInvoiceDto: any): import("@prisma/client").Prisma.Prisma__InvoiceClient<{
        id: string;
        orderId: string;
        invoiceNumber: string;
        issuedDate: Date;
        dueDate: Date;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    remove(id: string): import("@prisma/client").Prisma.Prisma__InvoiceClient<{
        id: string;
        orderId: string;
        invoiceNumber: string;
        issuedDate: Date;
        dueDate: Date;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
}
