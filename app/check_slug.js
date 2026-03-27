
const { PrismaClient } = require('@prisma/client');
async function main() {
  const prisma = new PrismaClient();
  const tenant = await prisma.tenant.findUnique({
    where: { id: 'cmn86yfwf0000db7owjlthwcg' },
    select: { slug: true }
  });
  console.log('Tenant Slug:', tenant?.slug);
  await prisma.$disconnect();
}
main();
