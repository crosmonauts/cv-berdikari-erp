import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { UpdateShipmentDto } from './dto/update-shipment.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

@Injectable()
export class ShipmentsService {
  constructor(private prisma: PrismaService) {}

  async createShipment(createShipmentDto: CreateShipmentDto) {
    const order = await this.prisma.purchaseOrder.findUnique({
      where: { id: createShipmentDto.orderId },
    });

    if (!order) throw new NotFoundException('Pesanan (PO) tidak ditemukan');

    return this.prisma.shipment.upsert({
      where: {
        orderId: createShipmentDto.orderId,
      },
      update: {
        documentNumber: createShipmentDto.documentNumber,
        shippingCost: createShipmentDto.shippingCost,
        otherFees: createShipmentDto.otherFees,
        ...(createShipmentDto.proofUrl && {
          proofUrl: createShipmentDto.proofUrl,
        }),
      },
      create: {
        orderId: createShipmentDto.orderId,
        type: createShipmentDto.type || 'AWB',
        documentNumber: createShipmentDto.documentNumber,
        shippingCost: createShipmentDto.shippingCost,
        otherFees: createShipmentDto.otherFees,
        proofUrl: createShipmentDto.proofUrl || null,
      },
    });
  }

  async findAll(query: PaginationQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.shipment.findMany({
        skip,
        take: limit,
        include: { order: true },
      }),
      this.prisma.shipment.count(),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const shipment = await this.prisma.shipment.findUnique({
      where: { id },
      include: { order: { select: { poNumber: true } } },
    });
    if (!shipment) throw new NotFoundException('Shipment tidak ditemukan!');
    return shipment;
  }

  async update(id: string, updateShipmentDto: UpdateShipmentDto) {
    const existing = await this.prisma.shipment.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Shipment tidak ditemukan!');
    return this.prisma.shipment.update({
      where: { id },
      data: updateShipmentDto,
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.shipment.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Shipment tidak ditemukan!');
    return this.prisma.shipment.delete({ where: { id } });
  }
}
