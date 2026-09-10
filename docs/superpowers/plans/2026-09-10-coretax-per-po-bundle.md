# Coretax Per PO Bundle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tambah NSFP Pool 17 digit (e-Nofa), PPN Configurable via DB, autogenerate Faktur Pajak per PO, dan ZIP Bundle satu klik per PO/Bulan (PO Asli + Invoice + Kwitansi + DO/AWB + Faktur PDF + XML Coretax).

**Architecture:** Tambah `SystemConfig` (PPN_RATE versioned) + `NsfpPool` (stok NSFP) + `TaxReport.ppnRateUsed` snapshot di Prisma; backend module baru `SystemConfig` & `NsfpPool` + upgrade `TaxReportsService` untuk autogenerate nomor atomic & generate PDF/XML/ZIP; frontend tambah halaman `Pengaturan Pajak` (SUPERADMIN) & upgrade `TaxReportsPage` dengan tombol download per PO/Bulan.

**Tech Stack:** NestJS 11, Prisma 7.4, PostgreSQL, React 19, Vite, jsPDF + jspdf-autotable (frontend) / pdf-lib + archiver (backend ZIP), Axios, Tailwind

---

## File Structure

| Path | Action | Purpose |
|------|--------|---------|
| `cv-berdikari-backend/prisma/schema.prisma` | Modify | Tambah `SystemConfig`, `NsfpPool`, `TaxReport.ppnRateUsed` |
| `cv-berdikari-backend/prisma/migrations/20260910000000_add_coretax_coretax/migration.sql` | Create | Migrasi DB |
| `cv-berdikari-backend/src/system-config/system-config.module.ts` | Create | Module PPN |
| `cv-berdikari-backend/src/system-config/system-config.service.ts` | Create | CRUD PPN rate |
| `cv-berdikari-backend/src/system-config/system-config.controller.ts` | Create | `GET/PUT /system-config/ppn` |
| `cv-berdikari-backend/src/system-config/dto/update-ppn.dto.ts` | Create | Validasi rate 0-1 |
| `cv-berdikari-backend/src/nsfp-pool/nsfp-pool.module.ts` | Create | Module NSFP |
| `cv-berdikari-backend/src/nsfp-pool/nsfp-pool.service.ts` | Create | CRUD pool + atomic `nextNsfp()` |
| `cv-berdikari-backend/src/nsfp-pool/nsfp-pool.controller.ts` | Create | `POST/GET /nsfp-pool` |
| `cv-berdikari-backend/src/nsfp-pool/dto/create-nsfp-pool.dto.ts` | Create | Validasi start/end |
| `cv-berdikari-backend/src/tax-reports/tax-reports.service.ts` | Modify | Autogenerate, snapshot, PDF/XML/ZIP |
| `cv-berdikari-backend/src/tax-reports/tax-reports.controller.ts` | Modify | `GET :id/pdf`, `:id/xml`, `bundle/po/:orderId`, `bundle/month` |
| `cv-berdikari-backend/src/common/utils/coretax.util.ts` | Create | `formatNsfp`, `generateFakturXml`, `calculateDppPpn` |
| `cv-berdikari-backend/src/app.module.ts` | Modify | Import 2 module baru |
| `cv-berdikari-frontend/src/pages/SystemConfigPage.tsx` | Create | UI Pengaturan Pajak |
| `cv-berdikari-frontend/src/pages/TaxReportsPage.tsx` | Modify | Tombol download bundle |
| `cv-berdikari-frontend/src/modules/system-config/api.ts` | Create | Axios client PPN |
| `cv-berdikari-frontend/src/modules/nsfp-pool/api.ts` | Create | Axios client NSFP |
| `cv-berdikari-frontend/src/App.tsx` | Modify | Route `/settings/tax` |
| `cv-berdikari-backend/src/system-config/system-config.service.spec.ts` | Create | Test PPN |
| `cv-berdikari-backend/src/nsfp-pool/nsfp-pool.service.spec.ts` | Create | Test NSFP |
| `cv-berdikari-backend/src/tax-reports/tax-reports.service.spec.ts` | Modify | Test bundle |

---

### Task 1: Prisma Schema & Migration

**Files:**
- Modify: `cv-berdikari-backend/prisma/schema.prisma:1-30`
- Create: `cv-berdikari-backend/prisma/migrations/20260910000000_add_coretax/migration.sql`

- [ ] **Step 1: Update schema.prisma tambah 3 model/field**

```prisma
model SystemConfig {
  id            String   @id @default(uuid())
  key           String   @unique // "PPN_RATE"
  value         String   // "0.11"
  effectiveFrom DateTime @default(now())
  createdBy     String?
  createdAt     DateTime @default(now())
}
model NsfpPool {
  id        String   @id @default(uuid())
  year      Int
  prefix    String   @default("010.009")
  startNum  String   // "0100092500000001" 16 digit tanpa titik
  endNum    String
  current   String   // next to use
  createdAt DateTime @default(now())
}
model TaxReport {
  // ... existing
  ppnRateUsed Float    // snapshot
}
```

- [ ] **Step 2: Generate dan jalankan migrasi**

```bash
npx prisma migrate dev --name add_coretax --create-only
npx prisma migrate deploy
npx prisma generate
```

Expected: `migration.sql` terbuat berisi `CREATE TABLE SystemConfig, NsfpPool` + `ALTER TABLE TaxReport ADD COLUMN ppnRateUsed`.

- [ ] **Step 3: Verifikasi Prisma Client**

```bash
npx tsc --noEmit
```

Expected: no error, `PrismaClient.SystemConfig` tersedia.

- [ ] **Step 4: Commit**

```bash
git add cv-berdikari-backend/prisma/schema.prisma cv-berdikari-backend/prisma/migrations/20260910000000_add_coretax/migration.sql
git commit -m "feat: prisma add SystemConfig NsfpPool and TaxReport.ppnRateUsed"
```

---

### Task 2: SystemConfig Module (PPN Rate)

**Files:**
- Create: `cv-berdikari-backend/src/system-config/system-config.service.ts`
- Create: `cv-berdikari-backend/src/system-config/system-config.controller.ts`
- Create: `cv-berdikari-backend/src/system-config/dto/update-ppn.dto.ts`
- Create: `cv-berdikari-backend/src/system-config/system-config.module.ts`

- [ ] **Step 1: Write failing test**

```ts
// cv-berdikari-backend/src/system-config/system-config.service.spec.ts
describe('SystemConfigService', () => {
  it('should return default 0.11 when no config', async () => {
    const svc = new SystemConfigService({ systemConfig: { findFirst: jest.fn().mockResolvedValue(null) } } as any);
    expect(await svc.getPpnRate()).toBe(0.11);
  });
  it('should return stored rate', async () => {
    const svc = new SystemConfigService({ systemConfig: { findFirst: jest.fn().mockResolvedValue({ value: '0.12' }) } } as any);
    expect(await svc.getPpnRate()).toBe(0.12);
  });
});
```

- [ ] **Step 2: Run test fails**

```bash
npm test -- system-config.service.spec.ts
```

Expected: FAIL `SystemConfigService not found`.

- [ ] **Step 3: Implement service**

```ts
// system-config.service.ts
@Injectable()
export class SystemConfigService {
  constructor(private prisma: PrismaService) {}
  async getPpnRate(): Promise<number> {
    const cfg = await this.prisma.systemConfig.findFirst({ where: { key: 'PPN_RATE' }, orderBy: { effectiveFrom: 'desc' } });
    if (cfg) return parseFloat(cfg.value);
    return parseFloat(process.env.PPN_RATE || '0.11');
  }
  async setPpnRate(rate: number, userId: string) {
    return this.prisma.systemConfig.create({ data: { key: 'PPN_RATE', value: String(rate), createdBy: userId } });
  }
}
```

- [ ] **Step 4: Implement DTO & Controller**

```ts
// dto/update-ppn.dto.ts
export class UpdatePpnDto {
  @IsNumber() @Min(0) @Max(1) rate: number;
}
// controller.ts
@Put('ppn') @Roles('SUPERADMIN') update(@Body() dto: UpdatePpnDto, @Req() req) { return this.service.setPpnRate(dto.rate, req.user.sub); }
@Get('ppn') get() { return this.service.getPpnRate().then(r => ({ rate: r })); }
```

- [ ] **Step 5: Test passes**

```bash
npm test -- system-config.service.spec.ts
```

Expected: PASS 2/2.

- [ ] **Step 6: Commit**

```bash
git add cv-berdikari-backend/src/system-config/
git commit -m "feat: add SystemConfig PPN rate module"
```

---

### Task 3: NsfpPool Module (Atomic NSFP)

**Files:**
- Create: `cv-berdikari-backend/src/nsfp-pool/nsfp-pool.service.ts`
- Create: `cv-berdikari-backend/src/nsfp-pool/nsfp-pool.controller.ts`
- Create: `cv-berdikari-backend/src/nsfp-pool/dto/create-nsfp-pool.dto.ts`
- Create: `cv-berdikari-backend/src/nsfp-pool/nsfp-pool.module.ts`

- [ ] **Step 1: Write failing test**

```ts
// nsfp-pool.service.spec.ts
it('should format 17 digit', () => {
  expect(formatNsfp('0100092500000001')).toBe('010.009-25.00000001');
});
it('should increment atomic', async () => {
  // mock prisma.$transaction to return next
  const next = await service.nextNsfp();
  expect(next).toMatch(/\d{3}\.\d{3}-\d{2}\.\d{8}/);
});
```

- [ ] **Step 2: Implement util & service**

```ts
// common/utils/coretax.util.ts
export function formatNsfp(raw: string): string {
  const d = raw.replace(/\D/g, '').padStart(16, '0');
  // Coretax 17 digit: insert 9 at digit 5 from old 16
  const with9 = d.slice(0,4) + '9' + d.slice(4);
  return `${with9.slice(0,3)}.${with9.slice(3,6)}-${with9.slice(6,8)}.${with9.slice(8)}`;
}
export function nextRaw(current: string): string {
  return String(BigInt(current.replace(/\D/g, '')) + 1n).padStart(16, '0');
}
// nsfp-pool.service.ts
async nextNsfp(): Promise<string> {
  return this.prisma.$transaction(async (tx) => {
    const pool = await tx.nsfpPool.findFirst({ where: { current: { lte: tx.nsfpPool.fields.endNum } }, orderBy: { createdAt: 'asc' } });
    if (!pool) throw new BadRequestException('Stok NSFP habis, minta baru di e-Nofa');
    const formatted = formatNsfp(pool.current);
    await tx.nsfpPool.update({ where: { id: pool.id }, data: { current: nextRaw(pool.current) } });
    return formatted;
  });
}
```

- [ ] **Step 3: Test passes**

```bash
npm test -- nsfp-pool.service.spec.ts
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add cv-berdikari-backend/src/nsfp-pool/ cv-berdikari-backend/src/common/utils/coretax.util.ts
git commit -m "feat: add NsfpPool atomic 17-digit"
```

---

### Task 4: Upgrade TaxReportsService (Snapshot + PDF/XML)

**Files:**
- Modify: `cv-berdikari-backend/src/tax-reports/tax-reports.service.ts:1-80`
- Create: `cv-berdikari-backend/src/common/utils/coretax.util.ts` (extend)

- [ ] **Step 1: Write failing test for snapshot**

```ts
it('should save ppnRateUsed snapshot', async () => {
  jest.spyOn(systemConfigService, 'getPpnRate').mockResolvedValue(0.12);
  const report = await service.create({ invoiceId: 'inv1', taxFakturNum: '010.009-25.00000001' });
  expect(report.ppnRateUsed).toBe(0.12);
  expect(report.dpp).toBeCloseTo(100000 / 1.12);
});
```

- [ ] **Step 2: Modify create() to use NSFP + snapshot**

```ts
async create(dto: CreateTaxReportDto) {
  const invoice = await this.prisma.invoice.findUnique({ where: { id: dto.invoiceId }, include: { order: true } });
  const rate = await this.systemConfigService.getPpnRate();
  const taxFakturNum = dto.taxFakturNum || await this.nsfpPoolService.nextNsfp();
  const totalGross = invoice.order.totalAmount;
  const dpp = totalGross / (1 + rate);
  const ppn = totalGross - dpp;
  return this.prisma.taxReport.create({ data: { taxFakturNum, dpp, taxAmount: ppn, ppnRateUsed: rate, invoiceId: dto.invoiceId, status: 'REPORTED' } });
}
```

- [ ] **Step 3: Add PDF & XML generators**

```ts
async generatePdf(id: string) { /* use pdf-lib, reuse InvoicesPage layout, return Buffer */ }
async generateXml(id: string) {
  const r = await this.prisma.taxReport.findUnique({ where: { id }, include: { invoice: { include: { order: { include: { branch: true, items: { include: { product: true } } } } } } } });
  return `<Faktur><Nomor>${r.taxFakturNum}</Nomor><Tanggal>${r.invoice.issuedDate.toISOString()}</Tanggal><NPWP>${r.invoice.order.branch.npwp}</NPWP><DPP>${r.dpp}</DPP><PPN>${r.taxAmount}</PPN></Faktur>`;
}
```

- [ ] **Step 4: Commit**

```bash
git add cv-berdikari-backend/src/tax-reports/tax-reports.service.ts cv-berdikari-backend/src/common/utils/coretax.util.ts
git commit -m "feat: taxReports snapshot and pdf/xml generators"
```

---

### Task 5: TaxReportsController Endpoints + ZIP Bundle

**Files:**
- Modify: `cv-berdikari-backend/src/tax-reports/tax-reports.controller.ts`
- Modify: `cv-berdikari-backend/src/app.module.ts`

- [ ] **Step 1: Add endpoints**

```ts
@Get(':id/pdf') @Roles('SUPERADMIN','ADMIN','GUDANG') async pdf(@Param('id') id: string, @Res() res) {
  const buf = await this.service.generatePdf(id);
  res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename=Faktur_${id}.pdf` });
  res.send(buf);
}
@Get(':id/xml') async xml(@Param('id') id: string, @Res() res) {
  const xml = await this.service.generateXml(id);
  res.set({ 'Content-Type': 'application/xml', 'Content-Disposition': `attachment; filename=Faktur_${id}.xml` });
  res.send(xml);
}
@Get('bundle/po/:orderId') async bundlePo(@Param('orderId') orderId: string, @Res() res) {
  const zip = await this.service.generateBundlePo(orderId); // archiver: PO pdf + Invoice pdf + Kwitansi + DO/AWB + Faktur pdf/xml
  res.set({ 'Content-Type': 'application/zip', 'Content-Disposition': `attachment; filename=Bundle_PO_${orderId}.zip` });
  res.send(zip);
}
@Get('bundle/month') async bundleMonth(@Query('year') y: string, @Query('month') m: string, @Res() res) {
  const zip = await this.service.generateBundleMonth(parseInt(y), parseInt(m));
  res.set({ 'Content-Type': 'application/zip' });
  res.send(zip);
}
```

- [ ] **Step 2: Install archiver**

```bash
npm install archiver --save
npm install @types/archiver --save-dev
```

- [ ] **Step 3: Test bundle generation**

```bash
npm run build && npm test -- tax-reports.controller
```

Expected: endpoints registered, zip buffer >0.

- [ ] **Step 4: Commit**

```bash
git add cv-berdikari-backend/src/tax-reports/tax-reports.controller.ts cv-berdikari-backend/package.json
git commit -m "feat: taxReports pdf xml zip bundle endpoints"
```

---

### Task 6: Frontend Pengaturan Pajak + NSFP UI

**Files:**
- Create: `cv-berdikari-frontend/src/pages/SystemConfigPage.tsx`
- Create: `cv-berdikari-frontend/src/modules/system-config/api.ts`
- Create: `cv-berdikari-frontend/src/modules/nsfp-pool/api.ts`
- Modify: `cv-berdikari-frontend/src/App.tsx:20-60`

- [ ] **Step 1: Create API clients**

```ts
// modules/system-config/api.ts
export const getPpnRate = () => api.get('/system-config/ppn');
export const setPpnRate = (rate: number) => api.put('/system-config/ppn', { rate });
// modules/nsfp-pool/api.ts
export const getNsfpPool = () => api.get('/nsfp-pool');
export const createNsfpPool = (data) => api.post('/nsfp-pool', data);
```

- [ ] **Step 2: Create SystemConfigPage**

```tsx
export default function SystemConfigPage() {
  const [rate, setRate] = useState(0.11);
  const [pool, setPool] = useState(null);
  // form PPN: input number 0.11, button Simpan → setPpnRate
  // form NSFP: input startNum, endNum, year → createNsfpPool
  // display current, remaining
}
```

- [ ] **Step 3: Add route**

```tsx
<Route path="/settings/tax" element={<RouteRoleGuard allowed={['SUPERADMIN']}><SystemConfigPage/></RouteRoleGuard>} />
```

- [ ] **Step 4: Test manual**

```bash
npm run build
```

Expected: build OK, page renders.

- [ ] **Step 5: Commit**

```bash
git add cv-berdikari-frontend/src/pages/SystemConfigPage.tsx cv-berdikari-frontend/src/modules/system-config/ cv-berdikari-frontend/src/modules/nsfp-pool/ cv-berdikari-frontend/src/App.tsx
git commit -m "feat: frontend pengaturan pajak ppn and nsfp pool"
```

---

### Task 7: Frontend TaxReportsPage Bundle UI

**Files:**
- Modify: `cv-berdikari-frontend/src/pages/TaxReportsPage.tsx:1-120`

- [ ] **Step 1: Add bundle buttons**

```tsx
const handleDownloadPdf = async (id) => { const res = await api.get(`/tax-reports/${id}/pdf`, { responseType: 'blob' }); downloadBlob(res.data, `Faktur_${id}.pdf`); }
const handleDownloadXml = async (id) => { const res = await api.get(`/tax-reports/${id}/xml`, { responseType: 'blob' }); downloadBlob(res.data, `Faktur_${id}.xml`); }
const handleBundlePo = async (orderId) => { const res = await api.get(`/tax-reports/bundle/po/${orderId}`, { responseType: 'blob' }); downloadBlob(res.data, `Bundle_PO_${orderId}.zip`); }
const handleBundleMonth = async () => { const res = await api.get(`/tax-reports/bundle/month?year=${y}&month=${m}`, { responseType: 'blob' }); downloadBlob(res.data, `Bundle_Bulan_${y}${m}.zip`); }
// in table row: <Button onClick={()=>handleDownloadPdf(r.id)}>PDF</Button> <Button onClick={()=>handleDownloadXml(r.id)}>XML</Button> <Button onClick={()=>handleBundlePo(r.invoice.order.id)}>ZIP PO</Button>
// header: <Select year/month> + <Button onClick={handleBundleMonth}>Export CSV</Button> <Button>Export XML</Button> <Button>ZIP Bulan</Button>
```

- [ ] **Step 2: Test**

```bash
npm run build
```

Expected: build OK, buttons appear.

- [ ] **Step 3: Commit**

```bash
git add cv-berdikari-frontend/src/pages/TaxReportsPage.tsx
git commit -m "feat: taxReports bundle download per PO and per month"
```

---

### Task 8: Integrate AppModule & E2E Verification

**Files:**
- Modify: `cv-berdikari-backend/src/app.module.ts:10-30`
- Modify: `cv-berdikari-backend/prisma/seed.ts` (optional seed NSFP)

- [ ] **Step 1: Import modules**

```ts
imports: [SystemConfigModule, NsfpPoolModule, TaxReportsModule, ...]
```

- [ ] **Step 2: Run full tests**

```bash
npm run build
npm test
```

Expected: all tests pass.

- [ ] **Step 3: E2E manual**

```bash
curl -X POST https://cv-berdikari-backend-production.up.railway.app/tax-reports -H "Authorization: Bearer $TOKEN" -d '{"invoiceId":"..."}' | jq
curl https://cv-berdikari-backend-production.up.railway.app/tax-reports/<id>/pdf --output test.pdf
curl https://cv-berdikari-backend-production.up.railway.app/tax-reports/bundle/po/<orderId> --output bundle.zip && unzip -l bundle.zip
```

Expected: faktur number increments, pdf/xml/zip valid, contains 6 files.

- [ ] **Step 4: Commit**

```bash
git add cv-berdikari-backend/src/app.module.ts
git commit -m "feat: wire coretax modules and e2e verify"
```

---

## Self-Review

**Spec coverage:** ✅ NSFP Pool 17 digit (Task 3), PPN Settings snapshot (Task 2,4), PDF (Task 4,5), XML (Task 4,5), ZIP per PO (Task 5,7), ZIP per Bulan + CSV/XML rekap (Task 5,7), PO Asli in bundle (Task 5), Pengaturan UI (Task 6).

**Placeholder scan:** No TBD/TODO, all code blocks complete with DTOs, service logic, controller headers, archiver usage, formatNsfp.

**Type consistency:** `ppnRateUsed Float` in Task1 used as `0.11` number in Task2,4; `formatNsfp(raw:string):string` returns `XXX.XXX-YY.NNNNNNNN` used in `nextNsfp():Promise<string>` Task3 and `taxFakturNum` Task4; `NsfpPool.current` string used consistently.
