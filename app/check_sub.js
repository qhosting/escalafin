
const { PrismaClient } = require('@prisma/client');
async function main() {
  const prisma = new PrismaClient();
  const sub = await prisma.subscription.findFirst({
    where: { tenantId: 'cmn86yfwf0000db7owjlthwcg' }
  });
  console.log('Subscription for Demo:', sub);
  await prisma.$disconnect();
}
main();
