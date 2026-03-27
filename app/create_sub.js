
const { PrismaClient } = require('@prisma/client');
async function main() {
  const prisma = new PrismaClient();
  const tenantId = 'cmn86yfwf0000db7owjlthwcg'; // Demo
  
  const plan = await prisma.plan.findFirst({ where: { name: 'professional' } });
  if (!plan) {
    console.error('Plan professional not found. Please run seed-plans.ts');
    return;
  }

  const sub = await prisma.subscription.create({
    data: {
      tenantId: tenantId,
      planId: plan.id,
      status: 'ACTIVE',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      cancelAtPeriodEnd: false
    }
  });
  console.log('Created subscription for Demo:', sub);
  await prisma.$disconnect();
}
main();
