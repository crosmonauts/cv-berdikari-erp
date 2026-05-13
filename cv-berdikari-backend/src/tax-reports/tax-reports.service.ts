import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TaxReportsService {
  constructor(private prisma: PrismaService) {}

  /**
   * MEMBUAT LAPORAN PAJAK (CORE TAX)
   * Otomatis menghitung DPP dan PPN 11% berdasarkan total di PO
   */
  async create(dto: { invoiceId: string; taxFakturNum: string }) {
    // 1. Cari data Invoice dan tarik totalAmount dari PurchaseOrder-nya
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: dto.invoiceId },
      include: {
        order: true, // Untuk ambil totalAmount
      },
    });

    // Validasi jika invoice tidak ada
    if (!invoice) {
      throw new NotFoundException(`Invoice dengan ID ${dto.invoiceId} tidak ditemukan.`);
    }

    // 2. JALANKAN RUMUS (Sesuai catatan manual Mas Nanda)
    const totalGross = invoice.order.totalAmount; 
    
    // Rumus: DPP = Total / 1.11
    const dpp = totalGross / 1.11;
    
    // Rumus: PPN = Total - DPP
    const ppn = totalGross - dpp;

    // 3. Simpan ke Database
    return this.prisma.taxReport.create({
      data: {
        taxFakturNum: dto.taxFakturNum,
        dpp: parseFloat(dpp.toFixed(2)),       // Simpan 2 angka di belakang koma
        taxAmount: parseFloat(ppn.toFixed(2)), // Nilai PPN 11%
        status: 'REPORTED',
        invoiceId: dto.invoiceId,
      },
      include: {
        invoice: {
          include: {
            order: true,
          },
        },
      },
    });
  }

  /**
   * MENAMPILKAN SEMUA LAPORAN PAJAK
   */
  async findAll() {
    return this.prisma.taxReport.findMany({
      include: {
        invoice: {
          select: {
            invoiceNumber: true,
            issuedDate: true,
            order: {
              select: {
                poNumber: true,
                totalAmount: true,
              },
            },
          },
        },
      },
      orderBy: {
        id: 'desc',
      },
    });
  }

  /**
   * DETAIL LAPORAN PAJAK TERTENTU
   */
  async findOne(id: string) {
    const report = await this.prisma.taxReport.findUnique({
      where: { id },
      include: {
        invoice: {
          include: {
            order: true,
          },
        },
      },
    });

    if (!report) throw new NotFoundException('Laporan pajak tidak ditemukan.');
    return report;
  }

  /**
   * UPDATE NOMOR FAKTUR ATAU STATUS
   */
  async update(id: string, dto: { taxFakturNum?: string; status?: string }) {
    return this.prisma.taxReport.update({
      where: { id },
      data: dto,
    });
  }

  /**
   * HAPUS LAPORAN PAJAK
   */
  async remove(id: string) {
    return this.prisma.taxReport.delete({
      where: { id },
    });
  }
}