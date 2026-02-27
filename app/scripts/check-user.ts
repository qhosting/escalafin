
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
    const tenant = await prisma.tenant.findUnique({
        where: { slug: 'prestamossjr' }
    });
    console.log('--- TENANT ---');
    console.log(tenant);

    const user = await prisma.user.findUnique({
        where: { email: 'prestampsssjr@escalafin.com' }
    });
    console.log('\n--- USER ---');
    console.log(user);

    if (user && tenant) {
        console.log('\nMatch tenantId:', user.tenantId === tenant.id);
    }

    await prisma.$disconnect();
}

check();
