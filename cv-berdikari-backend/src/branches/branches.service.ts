import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BranchesService {
  constructor(private prisma: PrismaService) {}

  async create(createBranchDto: CreateBranchDto) {
    // Kita petakan datanya secara manual agar tidak ada field 'gaib' yang ikut terkirim
    return this.prisma.branch.create({
      data: {
        branchCode: createBranchDto.branchCode,
        name: createBranchDto.name,
        address: createBranchDto.address,
        phone: createBranchDto.phone,
        region: createBranchDto.region,
      },
    });
  }

  async findAll() {
    return this.prisma.branch.findMany({
      orderBy: { id: 'desc' },
    });
  }

  async findOne(id: string) {
    const branch = await this.prisma.branch.findUnique({
      where: { id },
    });
    if (!branch) throw new NotFoundException(`Cabang dengan ID ${id} tidak ditemukan`);
    return branch;
  }

  async update(id: string, updateBranchDto: UpdateBranchDto) {
    // CARA PALING AMAN: Sebutkan field yang boleh di-update saja.
    // Ini menghilangkan error 'createdAt' karena kita tidak menyertakannya di sini.
    return this.prisma.branch.update({
      where: { id },
      data: {
        branchCode: updateBranchDto.branchCode,
        name: updateBranchDto.name,
        address: updateBranchDto.address,
        phone: updateBranchDto.phone,
        region: updateBranchDto.region,
      },
    });
  }

  async remove(id: string) {
    return this.prisma.branch.delete({
      where: { id },
    });
  }
}