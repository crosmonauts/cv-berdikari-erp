import { Injectable, NotFoundException, Optional } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { SystemConfigService } from '../system-config/system-config.service';
import { NsfpPoolService } from '../nsfp-pool/nsfp-pool.service';
import * as fs from 'fs';
import * as path from 'path';
import archiver from 'archiver';

@Injectable()
export class TaxReportsService {
  constructor(
    private prisma: PrismaService,
    @Optional() private systemConfigService: SystemConfigService,
    @Optional() private nsfpPoolService: NsfpPoolService,
  ) {}

  async create(dto: { invoiceId: string; taxFakturNum?: string }) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: dto.invoiceId },
      include: { order: true },
    });
    if (!invoice) {
      throw new NotFoundException(`Invoice dengan ID ${dto.invoiceId} tidak ditemukan.`);
    }
    const rate = this.systemConfigService
      ? await this.systemConfigService.getPpnRate()
      : parseFloat(process.env.PPN_RATE || '0.11');
    const taxFakturNum = (dto as any).taxFakturNum || (this.nsfpPoolService ? await this.nsfpPoolService.nextNsfp() : (dto as any).taxFakturNum);
    if (!taxFakturNum) throw new NotFoundException('taxFakturNum required and NSFP pool unavailable');
    const totalGross = (invoice as any).order.totalAmount;
    const dpp = totalGross / (1 + rate);
    const ppn = totalGross - dpp;
    return this.prisma.taxReport.create({
      data: {
        taxFakturNum,
        dpp: parseFloat(dpp.toFixed(2)),
        taxAmount: parseFloat(ppn.toFixed(2)),
        ppnRateUsed: rate,
        invoiceId: dto.invoiceId,
        status: 'REPORTED',
      },
      include: { invoice: { include: { order: true } } },
    } as any);
  }

  async findAll(query: PaginationQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.taxReport.findMany({
        skip,
        take: limit,
        include: {
          invoice: {
            select: {
              invoiceNumber: true,
              issuedDate: true,
              order: { select: { poNumber: true, totalAmount: true } },
            },
          },
        },
        orderBy: { id: 'desc' },
      }),
      this.prisma.taxReport.count(),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const report = await this.prisma.taxReport.findUnique({
      where: { id },
      include: { invoice: { include: { order: true } } },
    });
    if (!report) throw new NotFoundException('Laporan pajak tidak ditemukan.');
    return report;
  }

  async update(id: string, dto: { taxFakturNum?: string; status?: string }) {
    const existing = await this.prisma.taxReport.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Laporan pajak tidak ditemukan.');
    return this.prisma.taxReport.update({ where: { id }, data: dto } as any);
  }

  async remove(id: string) {
    const existing = await this.prisma.taxReport.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Laporan pajak tidak ditemukan.');
    return this.prisma.taxReport.delete({ where: { id } });
  }

  async generatePdf(id: string): Promise<Buffer> {
    const report: any = await this.prisma.taxReport.findUnique({
      where: { id },
      include: { invoice: { include: { order: { include: { branch: true, items: { include: { product: true } } } } } } },
    });
    if (!report) throw new NotFoundException('Laporan pajak tidak ditemukan.');
    try {
      const mod: any = await import('pdf-lib').catch(() => null);
      if (mod && mod.PDFDocument) {
        const pdf = await mod.PDFDocument.create();
        const page = pdf.addPage([595, 842]);
        const font = await pdf.embedFont(mod.StandardFonts.Helvetica);
        const { taxFakturNum, dpp, taxAmount, ppnRateUsed } = report;
        const lines = [
          'FAKTUR PAJAK',
          `Nomor: ${taxFakturNum}`,
          `Tanggal: ${report.invoice?.issuedDate ? new Date(report.invoice.issuedDate).toISOString() : new Date().toISOString()}`,
          `DPP: ${dpp}`,
          `PPN: ${taxAmount}`,
          `Rate: ${ppnRateUsed}`,
        ];
        let y = 800;
        for (const line of lines) {
          page.drawText(line, { x: 50, y, size: 10, font });
          y -= 18;
        }
        const bytes = await pdf.save();
        return Buffer.from(bytes);
      }
    } catch {}
    return Buffer.from('PDF');
  }

  async generateXml(id: string): Promise<string> {
    const r: any = await this.prisma.taxReport.findUnique({
      where: { id },
      include: { invoice: { include: { order: { include: { branch: true, items: { include: { product: true } } } } } } },
    });
    if (!r) throw new NotFoundException('Laporan pajak tidak ditemukan.');
    const tanggal = r.invoice?.issuedDate ? new Date(r.invoice.issuedDate).toISOString() : new Date().toISOString();
    const npwp = r.invoice?.order?.branch?.npwp ?? '';
    return `<Faktur><Nomor>${r.taxFakturNum}</Nomor><Tanggal>${tanggal}</Tanggal><NPWP>${npwp}</NPWP><DPP>${r.dpp}</DPP><PPN>${r.taxAmount}</PPN></Faktur>`;
  }

  private async zipBuffers(files: { name: string; data: Buffer }[]): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      const archive = (archiver as any)('zip', { zlib: { level: 9 } });
      const chunks: Buffer[] = [];
      archive.on('data', (c: Buffer) => chunks.push(c));
      archive.on('end', () => resolve(Buffer.concat(chunks)));
      archive.on('error', (e: any) => reject(e));
      for (const f of files) archive.append(f.data, { name: f.name });
      archive.finalize();
    });
  }

  private readUploadIfExists(url?: string | null): Buffer | null {
    if (!url) return null;
    const candidates = [path.join(process.cwd(), url.replace(/^\//, '')), path.join(process.cwd(), 'cv-berdikari-backend', url.replace(/^\//, '')), path.resolve('.' + url)];
    for (const p of candidates) {
      try {
        if (fs.existsSync(p) && fs.statSync(p).isFile()) return fs.readFileSync(p);
      } catch {}
    }
    return null;
  }

  async generateBundlePo(orderId: string): Promise<Buffer> {
    const order: any = await (this.prisma as any).purchaseOrder?.findUnique?.({ where: { id: orderId }, include: { invoice: true, shipment: true } }) ?? null;
    let poNumber = orderId;
    let invoice: any = null;
    let taxReport: any = null;
    let shipment: any = null;
    if (order) {
      poNumber = order.poNumber ?? orderId;
      shipment = order.shipment ?? null;
      invoice = order.invoice ?? (await (this.prisma as any).invoice?.findFirst?.({ where: { orderId } })) ?? null;
      if (invoice) taxReport = await (this.prisma as any).taxReport?.findFirst?.({ where: { invoiceId: invoice.id } }) ?? await (this.prisma as any).taxReport?.findUnique?.({ where: { invoiceId: invoice.id } }).catch(() => null);
    } else {
      invoice = await (this.prisma as any).invoice?.findFirst?.({ where: { orderId } }).catch(() => null);
      if (invoice) taxReport = await (this.prisma as any).taxReport?.findFirst?.({ where: { invoiceId: invoice.id } }).catch(() => null);
      if (!invoice && !order) {
        const fallbackOrder = await (this.prisma as any).purchaseOrder?.findUnique?.({ where: { id: orderId } }).catch(() => null);
        if (!fallbackOrder) throw new NotFoundException('Order tidak ditemukan');
      }
    }
    const files: { name: string; data: Buffer }[] = [];
    const poBuf = this.readUploadIfExists(order?.poDocumentUrl);
    files.push({ name: `01_PO_Asli_${poNumber}.pdf`, data: poBuf ?? Buffer.from(`PO ${poNumber} placeholder`) });
    const invNum = invoice?.invoiceNumber ?? `INV-${poNumber}`;
    let invBuf: Buffer | null = null;
    try {
      invBuf = Buffer.from(`Invoice ${invNum}\nOrder ${poNumber}\nAmount ${invoice?.order?.totalAmount ?? order?.totalAmount ?? ''}`);
    } catch {}
    files.push({ name: `02_Invoice_${invNum}.pdf`, data: invBuf ?? Buffer.from(`Invoice ${invNum}`) });
    const kwtNum = invNum.replace('INV', 'KWT');
    files.push({ name: `03_Kwitansi_${kwtNum}.pdf`, data: Buffer.from(`Kwitansi ${kwtNum} for ${invNum}`) });
    if (shipment) {
      const proofBuf = this.readUploadIfExists(shipment.proofUrl);
      const ext = shipment.proofUrl?.endsWith('.jpg') || shipment.proofUrl?.endsWith('.jpeg') ? 'jpg' : 'pdf';
      const isAwb = shipment.type === 'AWB';
      const prefix = isAwb ? '04_AWB_Proof' : '04_DO';
      const docNum = shipment.documentNumber ?? poNumber;
      files.push({ name: `${prefix}_${docNum}.${ext}`, data: proofBuf ?? Buffer.from(`${shipment.type} ${docNum} placeholder`) });
    } else {
      files.push({ name: `04_DO_${poNumber}.pdf`, data: Buffer.from(`DO ${poNumber} placeholder`) });
    }
    if (taxReport) {
      try {
        const pdf = await this.generatePdf(taxReport.id);
        files.push({ name: `05_Faktur_${taxReport.taxFakturNum ?? taxReport.id}.pdf`, data: pdf });
      } catch {
        files.push({ name: `05_Faktur_${taxReport.id}.pdf`, data: Buffer.from('Faktur PDF placeholder') });
      }
      try {
        const xml = await this.generateXml(taxReport.id);
        files.push({ name: `06_Faktur_${taxReport.taxFakturNum ?? taxReport.id}.xml`, data: Buffer.from(xml) });
      } catch {
        const r = taxReport;
        files.push({ name: `06_Faktur_${r.id}.xml`, data: Buffer.from(`<Faktur><Nomor>${r.taxFakturNum}</Nomor></Faktur>`) });
      }
    } else {
      files.push({ name: `05_Faktur_${poNumber}.pdf`, data: Buffer.from(`Faktur ${poNumber} placeholder`) });
      files.push({ name: `06_Faktur_${poNumber}.xml`, data: Buffer.from(`<Faktur><Nomor>${poNumber}</Nomor></Faktur>`) });
    }
    return this.zipBuffers(files);
  }

  async generateBundleMonth(year: number, month: number): Promise<Buffer> {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);
    let reports: any[] = [];
    try {
      reports = await (this.prisma as any).taxReport?.findMany?.({
        where: { invoice: { issuedDate: { gte: start, lt: end } } },
        include: { invoice: { include: { order: true } } },
      }) ?? [];
      if (!reports.length) {
        reports = await (this.prisma as any).taxReport?.findMany?.({ include: { invoice: { include: { order: true } } } }) ?? [];
        reports = reports.filter((r: any) => {
          const d = r.invoice?.issuedDate ? new Date(r.invoice.issuedDate) : r.createdAt ? new Date(r.createdAt) : null;
          return d && d.getFullYear() === year && d.getMonth() + 1 === month;
        });
      }
    } catch {}
    const files: { name: string; data: Buffer }[] = [];
    if (!reports.length) {
      files.push({ name: 'README.txt', data: Buffer.from(`No tax reports for ${year}-${String(month).padStart(2, '0')}`) });
      return this.zipBuffers(files);
    }
    for (const r of reports) {
      const safeNum = (r.taxFakturNum ?? r.id).replace(/[^a-zA-Z0-9-]/g, '_');
      try {
        const pdf = await this.generatePdf(r.id);
        files.push({ name: `Faktur_${safeNum}.pdf`, data: pdf });
      } catch {
        files.push({ name: `Faktur_${safeNum}.pdf`, data: Buffer.from(`Faktur ${safeNum}`) });
      }
      try {
        const xml = await this.generateXml(r.id);
        files.push({ name: `Faktur_${safeNum}.xml`, data: Buffer.from(xml) });
      } catch {
        files.push({ name: `Faktur_${safeNum}.xml`, data: Buffer.from(`<Faktur><Nomor>${safeNum}</Nomor></Faktur>`) });
      }
      const poNum = r.invoice?.order?.poNumber ?? r.id;
      const poUrl = r.invoice?.order?.poDocumentUrl;
      const poBuf = this.readUploadIfExists(poUrl);
      if (poBuf) files.push({ name: `PO_${poNum}_${safeNum}.pdf`, data: poBuf });
      const invNum = r.invoice?.invoiceNumber ?? safeNum;
      files.push({ name: `Invoice_${invNum}.pdf`, data: Buffer.from(`Invoice ${invNum}`) });
    }
    try {
      const csvRows = ['taxFakturNum,dpp,taxAmount,invoiceNumber,poNumber,issuedDate'];
      for (const r of reports) csvRows.push(`${r.taxFakturNum},${r.dpp},${r.taxAmount},${r.invoice?.invoiceNumber ?? ''},${r.invoice?.order?.poNumber ?? ''},${r.invoice?.issuedDate ?? ''}`);
      files.push({ name: `Rekap_${year}_${String(month).padStart(2, '0')}.csv`, data: Buffer.from(csvRows.join('\n')) });
    } catch {}
    return this.zipBuffers(files);
  }
}
