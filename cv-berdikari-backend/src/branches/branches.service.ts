import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BranchesService {
  constructor(private prisma: PrismaService) {}

  async create(createBranchDto: CreateBranchDto) {
    return this.prisma.branch.create({
      data: {
        branchCode: createBranchDto.branchCode,
        name: createBranchDto.name,
        // Tambahkan || '' agar Prisma tidak protes jika undefined
        address: createBranchDto.address || '',
        phone: createBranchDto.phone || '',
        regionId: (createBranchDto as any).regionId || null,
      },
    });
  }

  async findAll() {
    return this.prisma.branch.findMany({
      orderBy: { id: 'desc' },
      include: { region: true },
    });
  }

  async findOne(id: string) {
    const branch = await this.prisma.branch.findUnique({
      where: { id },
      include: { region: true },
    });
    if (!branch)
      throw new NotFoundException(`Cabang dengan ID ${id} tidak ditemukan`);
    return branch;
  }

  async update(id: string, updateBranchDto: UpdateBranchDto) {
    return this.prisma.branch.update({
      where: { id },
      data: {
        branchCode: updateBranchDto.branchCode,
        name: updateBranchDto.name,
        // Tambahkan || '' agar Prisma tidak protes jika undefined
        address: updateBranchDto.address || '',
        phone: updateBranchDto.phone || '',
        regionId: (updateBranchDto as any).regionId || null,
      },
    });
  }

  async remove(id: string) {
    return this.prisma.branch.delete({
      where: { id },
    });
  }
}
