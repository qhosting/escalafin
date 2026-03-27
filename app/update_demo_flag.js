
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  try {
    await prisma.tenant.update({ where: { id: 'cmn86yfwf0000db7owjlthwcg' }, data: { isDemo: true } });
    console.log('Update Success');
  } catch(e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
run();
