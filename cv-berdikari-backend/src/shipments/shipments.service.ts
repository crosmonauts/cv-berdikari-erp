import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ShipmentsService {
  constructor(private prisma: PrismaService) {}

  async createShipment(createShipmentDto: any) {
    // 1. Cek apakah PO-nya benar-benar ada
    const order = await this.prisma.purchaseOrder.findUnique({
      where: { id: createShipmentDto.orderId },
    });

    if (!order) throw new NotFoundException('Pesanan (PO) tidak ditemukan');

    // 2. Gunakan UPSERT: Solusi cerdas untuk error "Unique Constraint Violation"
    // Jika orderId sudah punya shipment, dia akan UPDATE. Jika belum, dia akan CREATE.
    return this.prisma.shipment.upsert({
      where: {
        orderId: createShipmentDto.orderId,
      },
      update: {
        documentNumber: createShipmentDto.documentNumber,
        shippingCost: createShipmentDto.shippingCost,
        otherFees: createShipmentDto.otherFees,
        // Update URL bukti resi hanya jika ada file baru yang diunggah
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

  findAll() {
    return this.prisma.shipment.findMany({
      include: { order: true },
    });
  }
}
