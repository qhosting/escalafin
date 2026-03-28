
import { prisma } from './lib/prisma';

async function test() {
  try {
    const logs = await prisma.auditLog.findMany({
      where: { action: 'SECURITY_BLOCK' },
      orderBy: { timestamp: 'desc' },
      take: 10
    });
    console.log('Recent security logs:', JSON.stringify(logs, null, 2));
  } catch (e) {
    console.error('Test failed:', e);
  } finally {
    process.exit();
  }
}

test();
