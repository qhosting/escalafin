
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding Tenants...');

    // 1. Ensure 'starter' plan exists
    let plan = await prisma.plan.findUnique({ where: { name: 'starter' } });
    if (!plan) {
        console.log('⚠️ Plan "starter" not found. Creating it...');
        plan = await prisma.plan.create({
            data: {
                name: 'starter',
                displayName: 'Starter',
                description: 'Plan inicial auto-generado',
                priceMonthly: 0,
                currency: 'MXN',
                features: JSON.stringify(["Gestión de Clientes", "Gestión de Préstamos"]),
                limits: JSON.stringify({ users: 3, loans: 100, clients: 200 }),
                isActive: true,
                trialDays: 14
            }
        });
    }

    if (!plan) throw new Error('Failed to get/create plan');

    // 2. Create Tenants
    const tenantsData = [
        { name: 'Financiera Demo', slug: 'demo', status: 'ACTIVE' },
        { name: 'Crédito Rápido', slug: 'credito-rapido', status: 'ACTIVE' },
        { name: 'Prestamos del Norte', slug: 'norte', status: 'TRIAL' }
    ];

    for (const t of tenantsData) {
        const existing = await prisma.tenant.findUnique({ where: { slug: t.slug } });
        if (existing) {
            console.log(`ℹ️ Tenant "${t.name}" already exists.`);
            continue;
        }

        const tenant = await prisma.tenant.create({
            data: {
                name: t.name,
                slug: t.slug,
                status: t.status,
                subscription: {
                    create: {
                        planId: plan.id,
                        status: 'ACTIVE',
                        currentPeriodStart: new Date(),
                        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                    }
                }
            }
        });
        console.log(`✅ Created Tenant: ${tenant.name} (${tenant.slug})`);
    }

    console.log('✨ Seed completed.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
