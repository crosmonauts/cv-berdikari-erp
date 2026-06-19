import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReceiptDto } from './dto/create-receipt.dto';
import { UpdateReceiptDto } from './dto/update-receipt.dto';
import { ReceiptQueryDto } from './dto/receipt-query.dto';

@Injectable()
export class ReceiptsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateReceiptDto) {
    return this.prisma.receipt.create({
      data: {
        receiptNumber: dto.receiptNumber,
        issuedDate: dto.issuedDate ? new Date(dto.issuedDate) : new Date(),
        invoiceId: dto.invoiceId,
      },
      include: { invoice: true },
    });
  }

  async findAll(query: ReceiptQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const where = query.invoiceId ? { invoiceId: query.invoiceId } : {};
    const [data, total] = await Promise.all([
      this.prisma.receipt.findMany({
        skip,
        take: limit,
        where,
        include: { invoice: true },
        orderBy: { issuedDate: 'desc' },
      }),
      this.prisma.receipt.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const receipt = await this.prisma.receipt.findUnique({
      where: { id },
      include: { invoice: true },
    });
    if (!receipt) throw new NotFoundException('Kwitansi tidak ditemukan');
    return receipt;
  }

  async findByInvoiceId(invoiceId: string) {
    return this.prisma.receipt.findUnique({
      where: { invoiceId },
      include: { invoice: true },
    });
  }

  async update(id: string, dto: UpdateReceiptDto) {
    await this.findOne(id);
    return this.prisma.receipt.update({
      where: { id },
      data: dto,
      include: { invoice: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.receipt.delete({ where: { id } });
  }
}
