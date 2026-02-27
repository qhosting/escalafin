
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const tenant = await prisma.tenant.findUnique({
        where: { slug: 'prestamossjr' }
    });
    if (!tenant) {
        console.error('Tenant not found');
        process.exit(1);
    }
    console.log('TENANT_ID:' + tenant.id);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
