
import { PrismaClient } from '@prisma/client';

async function check() {
    const url = "postgres://postgres:7fc6f898f29e38e2ea54@cloud.qhosting.net:1088/escalafin-db?sslmode=disable";
    console.log(`Checking remote database...`);

    const prisma = new PrismaClient({
        datasources: {
            db: { url }
        }
    });

    try {
        // 1. Buscar el Tenant por slug
        const tenant = await prisma.tenant.findUnique({
            where: { slug: 'prestamossjr' }
        });
        console.log('\n--- TENANT INFO ---');
        if (tenant) {
            console.log({
                id: tenant.id,
                name: tenant.name,
                slug: tenant.slug,
                status: tenant.status
            });
        } else {
            console.log('Tenant "prestamossjr" NOT FOUND');
            // Listar algunos tenants para ver si el slug es diferente
            const someTenants = await prisma.tenant.findMany({ take: 5 });
            console.log('Available tenants slugs:', someTenants.map(t => t.slug));
        }

        // 2. Buscar el Usuario por email
        const user = await prisma.user.findUnique({
            where: { email: 'prestampsssjr@escalafin.com' },
            include: { tenant: true }
        });

        console.log('\n--- USER INFO ---');
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

            if (tenant && user.tenantId !== tenant.id) {
                console.log('⚠️ WARNING: User belongs to a different tenant ID than the one found by slug!');
            }
        } else {
            console.log('User "prestampsssjr@escalafin.com" NOT FOUND');
            // Buscar usuarios parecidos
            const partialUser = await prisma.user.findMany({
                where: { email: { contains: 'prestam' } },
                select: { email: true }
            });
            console.log('Emails containing "prestam":', partialUser.map(u => u.email));
        }

    } catch (e) {
        console.error('Error during database check:', e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
