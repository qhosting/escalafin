
import { PrismaClient } from '@prisma/client';

async function check() {
    const url = "postgres://postgres:7fc6f898f29e38e2ea54@cloud.qhosting.net:1088/escalafin-db?sslmode=disable";
    const prisma = new PrismaClient({ datasources: { db: { url } } });

    try {
        const user = await prisma.user.findUnique({
            where: { email: 'prestamossjr@escalafin.com' },
            include: { tenant: true }
        });

        console.log('\n--- CORRECTED USER INFO ---');
        if (user) {
            console.log({
                id: user.id,
                email: user.email,
                role: user.role,
                status: user.status,
                tenantId: user.tenantId,
                userTenantSlug: user.tenant?.slug,
                hasPassword: !!user.password,
                createdAt: user.createdAt
            });
        } else {
            console.log('User not found even with correct spelling');
        }
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
