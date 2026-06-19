import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

@Injectable()
export class BranchesService {
  constructor(private prisma: PrismaService) {}

  async create(createBranchDto: CreateBranchDto) {
    return this.prisma.branch.create({
      data: {
        branchCode: createBranchDto.branchCode,
        name: createBranchDto.name,
        address: createBranchDto.address ?? '',
        phone: createBranchDto.phone ?? null,
        regionId: createBranchDto.regionId ?? null,
      },
    });
  }

  async findAll(query: PaginationQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.branch.findMany({
        skip,
        take: limit,
        orderBy: { id: 'desc' },
        include: { region: true },
      }),
      this.prisma.branch.count(),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
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
    const existing = await this.prisma.branch.findUnique({ where: { id } });
    if (!existing)
      throw new NotFoundException(`Cabang dengan ID ${id} tidak ditemukan`);
    return this.prisma.branch.update({
      where: { id },
      data: {
        branchCode: updateBranchDto.branchCode,
        name: updateBranchDto.name,
        address: updateBranchDto.address ?? '',
        phone: updateBranchDto.phone ?? null,
        regionId: updateBranchDto.regionId ?? null,
      },
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.branch.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Cabang dengan ID ${id} tidak ditemukan`);
    return this.prisma.branch.delete({
      where: { id },
    });
  }
}
