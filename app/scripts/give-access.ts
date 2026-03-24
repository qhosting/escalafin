
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const enterprisePlan = await prisma.plan.findUnique({
        where: { name: 'enterprise' }
    });

    if (!enterprisePlan) {
        console.log('Enterprise plan not found. Seeding plans...');
        // Opcionalmente sembrar planes si no existen
        return;
    }

    const tenants = await prisma.tenant.findMany({
        include: { subscription: true }
    });

    for (const tenant of tenants) {
        if (!tenant.subscription) {
            await prisma.subscription.create({
                data: {
                    tenantId: tenant.id,
                    planId: enterprisePlan.id,
                    status: 'ACTIVE',
                    currentPeriodStart: new Date(),
                    currentPeriodEnd: new Date('2030-01-01'),
                    paymentMethod: 'MANUAL'
                }
            });
            console.log(`✅ Creada suscripción Enterprise para tenant: ${tenant.slug}`);
        } else {
            await prisma.subscription.update({
                where: { tenantId: tenant.id },
                data: {
                    planId: enterprisePlan.id,
                    status: 'ACTIVE'
                }
            });
            console.log(`✅ Actualizada suscripción a Enterprise para tenant: ${tenant.slug}`);
        }
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
