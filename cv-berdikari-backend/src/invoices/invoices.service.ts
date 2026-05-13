import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InvoicesService {
  constructor(private prisma: PrismaService) {}

  create(createInvoiceDto: any) {
    // Menyimpan data ke Laci 6 (Invoice)
    return this.prisma.invoice.create({
      data: {
        invoiceNumber: createInvoiceDto.invoiceNumber,
        dueDate: createInvoiceDto.dueDate,
        orderId: createInvoiceDto.orderId,
      },
    });
  }

  findAll() {
    return this.prisma.invoice.findMany();
  }

  findOne(id: string) {
    return this.prisma.invoice.findUnique({ where: { id } });
  }

  update(id: string, updateInvoiceDto: any) {
    return this.prisma.invoice.update({
      where: { id },
      data: updateInvoiceDto,
    });
  }

  remove(id: string) {
    return this.prisma.invoice.delete({ where: { id } });
  }
}