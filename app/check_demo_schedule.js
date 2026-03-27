
const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: "postgres://postgres:7fc6f898f29e38e2ea54@100.75.220.89:1088/escalafin-db?sslmode=disable"
      }
    }
  });

  const loanId = 'cmn86ygqd000idb7oq6kkefdu'; // DEMO-0001

  try {
    const schedules = await prisma.amortizationSchedule.findMany({
      where: { loanId: loanId },
      orderBy: { paymentNumber: 'asc' }
    });

    console.log(`Schedules for DEMO-0001 (${schedules.length}):`);
    schedules.forEach(s => {
      console.log(`Punto ${s.paymentNumber}: Date ${s.paymentDate}, Amount ${s.totalPayment}, Paid ${s.isPaid}`);
    });

  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
