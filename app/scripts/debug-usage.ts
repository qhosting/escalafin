
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- BUSCANDO TENANT ---');
    const tenant = await prisma.tenant.findFirst({
        where: { slug: 'default-tenant' }
    });

    if (!tenant) {
        console.log('Default tenant not found');
        return;
    }

    console.log(`Tenant: ${tenant.name} (${tenant.id})`);

    const usage = await prisma.tenantUsage.findFirst({
        where: { tenantId: tenant.id },
        orderBy: { period: 'desc' }
    });

    if (!usage) {
        console.log('Usage records not found');
    } else {
        console.log('--- USO ACTUAL ---');
        console.log(JSON.stringify(usage, (key, value) => typeof value === 'bigint' ? value.toString() : value, 2));
    }

    const subscription = await prisma.subscription.findFirst({
        where: { tenantId: tenant.id },
        include: { plan: true }
    });

    if (!subscription) {
        console.log('Subscription not found');
    } else {
        console.log('--- SUSCRIPCION ---');
        console.log(`Plan: ${subscription.plan.name} (${subscription.plan.displayName})`);
        console.log(`Status: ${subscription.status}`);
        console.log('Limits:', JSON.stringify(subscription.plan.limits, null, 2));
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
