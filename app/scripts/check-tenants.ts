
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const tenants = await prisma.tenant.findMany();

  console.log('--- Tenants Encontrados ---');
  tenants.forEach(t => {
    console.log(`ID: ${t.id}, Name: ${t.name}, Slug: ${t.slug}, Status: ${t.status}`);
  });
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
