
import { PrismaClient } from '@prisma/client';

async function check(url: string) {
    process.env.DATABASE_URL = url;
    console.log(`Testing: ${url}`);
    const prisma = new PrismaClient({
        datasources: {
            db: { url }
        }
    });

    try {
        const tenant = await prisma.tenant.findUnique({
            where: { slug: 'prestamossjr' }
        });
        console.log('--- TENANT ---');
        console.log(tenant);

        const user = await prisma.user.findUnique({
            where: { email: 'prestampsssjr@escalafin.com' },
            include: { tenant: true }
        });
        console.log('\n--- USER ---');
        if (user) {
            console.log({
                id: user.id,
                email: user.email,
                role: user.role,
                status: user.status,
                tenantId: user.tenantId,
                tenantSlug: user.tenant?.slug,
                hasPassword: !!user.password
            });
        } else {
            console.log('User not found');
        }

        if (user && tenant) {
            console.log('\nMatch tenantId:', user.tenantId === tenant.id);
        }
        return true;
    } catch (e) {
        console.log('Failed:', e.message);
        return false;
    } finally {
        await prisma.$disconnect();
    }
}

async function start() {
    const urls = [
        "postgresql://postgres:postgrespassword@localhost:5433/escalafin_db",
        "postgresql://postgres:postgrespassword@localhost:5432/escalafin_db",
        "postgresql://escalafin:password@localhost:5432/escalafin_db"
    ];
    for (const url of urls) {
        if (await check(url)) break;
    }
}

start();
