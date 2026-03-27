
const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: "postgres://postgres:7fc6f898f29e38e2ea54@100.75.220.89:1088/escalafin-db?sslmode=disable"
      }
    }
  });

  const tenantId = 'cmn86yfwf0000db7owjlthwcg'; // Demo tenant

  try {
    const loans = await prisma.loan.findMany({
      where: { tenantId: tenantId },
      include: {
        _count: {
          select: { amortizationSchedule: true }
        }
      }
    });

    console.log(`Loans for demo tenant (${loans.length}):`);
    loans.forEach(loan => {
      console.log(`Loan: ${loan.loanNumber}, ID: ${loan.id}, Schedule Count: ${loan._count.amortizationSchedule}`);
    });

  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
