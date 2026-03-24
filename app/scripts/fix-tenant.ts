
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

    // Actualizar límites para el tenant actual a Enterprise para que no moleste el mensaje
    const plan = await prisma.plan.findUnique({
        where: { name: 'enterprise' }
    });

    if (plan) {
        await prisma.subscription.updateMany({
            where: { tenantId: tenant.id },
            data: { planId: plan.id }
        });
        console.log('✅ Plan actualizado a Enterprise para el default-tenant');
    }

    // Buscar clientes del tenant
    const clients = await prisma.client.findMany({
        where: { tenantId: tenant.id },
        include: {
            collaterals: true,
            guarantor: true
        },
        take: 5
    });

    console.log(`--- CLIENTES (${clients.length}) ---`);
    clients.forEach(c => {
        console.log(`- ${c.firstName} ${c.lastName} (${c.id})`);
        console.log(`  Garantías: ${JSON.stringify(c.collaterals.map(g => g.description))}`);
        console.log(`  Aval: ${c.guarantor ? c.guarantor.fullName : 'Ninguno'}`);
    });
}

main().catch(console.error).finally(() => prisma.$disconnect());
