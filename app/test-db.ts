
import { prisma } from './lib/prisma';

async function test() {
  try {
    const loanId = 'cmn86yjxg0044db7odb5ly98j';
    const loan = await (prisma.loan as any).findFirst({
      where: { id: loanId },
      include: {
        client: true,
        payments: true
      }
    });
    if (!loan) {
        console.log('Loan not found!');
        return;
    }
    console.log('Loan info:', JSON.stringify(loan, null, 2));
  } catch (e) {
    console.error('Test failed:', e);
  } finally {
    process.exit();
  }
}

test();
