import { TaxReportsService } from './tax-reports.service';
import { CreateTaxReportDto } from './dto/create-tax-report.dto';
import { UpdateTaxReportDto } from './dto/update-tax-report.dto';
export declare class TaxReportsController {
    private readonly taxReportsService;
    constructor(taxReportsService: TaxReportsService);
    create(createTaxReportDto: CreateTaxReportDto): Promise<{
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
    update(id: string, updateTaxReportDto: UpdateTaxReportDto): Promise<{
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
