import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RegionsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    // Mengambil semua wilayah urut berdasarkan nama
    return this.prisma.region.findMany({
      orderBy: { name: 'asc' },
    });
  }
}
