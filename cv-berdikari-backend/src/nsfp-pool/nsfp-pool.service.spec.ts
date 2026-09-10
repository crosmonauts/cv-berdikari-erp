import { BadRequestException } from '@nestjs/common';
import { NsfpPoolService } from './nsfp-pool.service';
import { formatNsfp } from '../common/utils/coretax.util';

describe('NsfpPoolService', () => {
  let service: NsfpPoolService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      nsfpPool: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn((cb: any) => cb(prisma)),
    };
    prisma.$transaction.mockImplementation((cb: any) => cb(prisma));
    prisma.nsfpPool.findMany.mockResolvedValue([]);
    service = new NsfpPoolService(prisma as any);
  });

  it('should format 17 digit', () => {
    expect(formatNsfp('0100092500000001')).toBe('010.009-25.00000001');
  });

  it('should format with insert 9 at digit5', () => {
    expect(formatNsfp('0100092500000002')).toBe('010.009-25.00000002');
  });

  it('should increment atomic', async () => {
    prisma.nsfpPool.findFirst.mockResolvedValue({ id: '1', current: '0100092500000001', endNum: '0100092500000010' });
    prisma.nsfpPool.findMany.mockResolvedValue([{ id: '1', current: '0100092500000001', endNum: '0100092500000010' }]);
    prisma.nsfpPool.update.mockResolvedValue({});
    const next = await service.nextNsfp();
    expect(next).toMatch(/\d{3}\.\d{3}-\d{2}\.\d{8}/);
    expect(next).toBe('010.009-25.00000001');
    expect(prisma.nsfpPool.update).toHaveBeenCalledWith({
      where: { id: '1' },
      data: { current: '0100092500000002' },
    });
  });

  it('should throw when stok habis', async () => {
    prisma.nsfpPool.findFirst.mockResolvedValue(null);
    prisma.nsfpPool.findMany.mockResolvedValue([]);
    await expect(service.nextNsfp()).rejects.toThrow(BadRequestException);
    await expect(service.nextNsfp()).rejects.toThrow('Stok NSFP habis, minta baru di e-Nofa');
  });

  it('should throw when current > endNum', async () => {
    prisma.nsfpPool.findMany.mockResolvedValue([{ id: '1', current: '0100092500000011', endNum: '0100092500000010' }]);
    prisma.nsfpPool.findFirst.mockResolvedValue({ id: '1', current: '0100092500000011', endNum: '0100092500000010' });
    await expect(service.nextNsfp()).rejects.toThrow('Stok NSFP habis');
  });
});
