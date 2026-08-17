import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  const LOCAL_REGION_CODES = ['JATENG', 'SEMARANG', 'SMG'];

  const shipments = await prisma.shipment.findMany({
    where: {
      type: 'AWB',
      order: {
        branch: {
          region: {
            code: { in: LOCAL_REGION_CODES },
          },
        },
      },
    },
    include: {
      order: {
        include: {
          branch: { include: { region: true } },
        },
      },
    },
  });

  console.log(
    `Ditemukan ${shipments.length} shipment AWB untuk wilayah lokal (${LOCAL_REGION_CODES.join(', ')}):`,
  );
  for (const s of shipments) {
    console.log(
      `- id=${s.id} po=${s.order.poNumber} branch=${s.order.branch.name} region=${s.order.branch.region?.code} doc=${s.documentNumber}`,
    );
  }

  let updated = 0;
  for (const s of shipments) {
    const newDoc = s.documentNumber?.startsWith('DO-')
      ? s.documentNumber
      : `DO-${s.documentNumber ?? ''}`;
    await prisma.shipment.update({
      where: { id: s.id },
      data: { type: 'DO', documentNumber: newDoc },
    });
    updated++;
    console.log(`  -> diubah ke DO, documentNumber="${newDoc}"`);
  }

  console.log(`Selesai. ${updated} shipment diperbarui menjadi DO.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
