import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { formatNsfp, nextRaw } from '../common/utils/coretax.util';
import { CreateNsfpPoolDto } from './dto/create-nsfp-pool.dto';

@Injectable()
export class NsfpPoolService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateNsfpPoolDto) {
    if (BigInt(dto.startNum) > BigInt(dto.endNum)) {
      throw new BadRequestException('startNum must be <= endNum');
    }
    return this.prisma.nsfpPool.create({
      data: {
        year: dto.year,
        startNum: dto.startNum,
        endNum: dto.endNum,
        current: dto.startNum,
      },
    });
  }

  async findAll() {
    return this.prisma.nsfpPool.findMany({ orderBy: { createdAt: 'asc' } });
  }

  async nextNsfp(): Promise<string> {
    return this.prisma.$transaction(async (tx: any) => {
      let pool: any = null;
      if (typeof tx.nsfpPool.findMany === 'function') {
        try {
          const pools = await tx.nsfpPool.findMany({ orderBy: { createdAt: 'asc' } });
          if (Array.isArray(pools) && pools.length > 0) {
            pool = pools.find((p: any) => {
              try {
                return BigInt(String(p.current).replace(/\D/g, '')) <= BigInt(String(p.endNum).replace(/\D/g, ''));
              } catch {
                return false;
              }
            }) || null;
          }
        } catch {}
      }
      if (!pool) {
        pool = await tx.nsfpPool.findFirst({ orderBy: { createdAt: 'asc' } });
        if (pool) {
          try {
            if (BigInt(String(pool.current).replace(/\D/g, '')) > BigInt(String(pool.endNum).replace(/\D/g, ''))) {
              pool = null;
            }
          } catch {
            pool = null;
          }
        }
      }
      if (!pool) throw new BadRequestException('Stok NSFP habis, minta baru di e-Nofa');
      const formatted = formatNsfp(pool.current);
      await tx.nsfpPool.update({ where: { id: pool.id }, data: { current: nextRaw(pool.current) } });
      return formatted;
    });
  }
}
