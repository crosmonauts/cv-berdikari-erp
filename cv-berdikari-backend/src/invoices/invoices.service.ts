import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

@Injectable()
export class InvoicesService {
  constructor(private prisma: PrismaService) {}

  create(createInvoiceDto: CreateInvoiceDto) {
    return this.prisma.invoice.create({
      data: {
        invoiceNumber: createInvoiceDto.invoiceNumber,
        dueDate: createInvoiceDto.dueDate,
        orderId: createInvoiceDto.orderId,
      },
    });
  }

  async findAll(query: PaginationQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.invoice.findMany({
        skip,
        take: limit,
        include: {
          order: {
            select: {
              poNumber: true,
              totalAmount: true,
              branch: { select: { name: true } },
            },
          },
        },
        orderBy: { issuedDate: 'desc' },
      }),
      this.prisma.invoice.count(),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        order: {
          select: {
            poNumber: true,
            totalAmount: true,
            branch: { select: { name: true } },
          },
        },
      },
    });
    if (!invoice) throw new NotFoundException('Invoice tidak ditemukan!');
    return invoice;
  }

  async update(id: string, updateInvoiceDto: UpdateInvoiceDto) {
    const existing = await this.prisma.invoice.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Invoice tidak ditemukan!');
    return this.prisma.invoice.update({ where: { id }, data: updateInvoiceDto });
  }

  async remove(id: string) {
    const existing = await this.prisma.invoice.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Invoice tidak ditemukan!');
    return this.prisma.invoice.delete({ where: { id } });
  }
}