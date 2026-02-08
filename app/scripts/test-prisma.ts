
import { PrismaClient } from '@prisma/client';

async function test() {
    const prisma = new PrismaClient();
    try {
        console.log('Checking Tenant model...');
        const count = await prisma.tenant.count();
        console.log('Success! Tenant count:', count);
    } catch (e) {
        console.error('Failed to access Tenant model:', e);
    } finally {
        await prisma.$disconnect();
    }
}

test();
