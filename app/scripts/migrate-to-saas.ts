/**
 * Script de Migración a SaaS
 * 
 * Este script:
 * 1. Crea los planes si no existen
 * 2. Asigna suscripciones legacy a tenants existentes sin suscripción
 * 3. Inicializa el tracking de uso para cada tenant
 * 
 * Ejecutar con: npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/migrate-to-saas.ts
 */

import { PrismaClient, SubscriptionStatus, PaymentMethodType } from '@prisma/client';

const prisma = new PrismaClient();

// Límites del plan legacy (sin límites)
const LEGACY_LIMITS = {
    users: -1,
    loans: -1,
    clients: -1,
    storageGB: -1,
    apiCalls: -1,
    smsPerMonth: -1,
    whatsappPerMonth: -1,
    customReports: true,
    apiAccess: true,
    whiteLabeling: true,
    prioritySupport: true,
    ssoEnabled: true,
    customDomain: true
};

const LEGACY_FEATURES = [
    'Todo incluido (plan heredado)',
    'Usuarios ilimitados',
    'Préstamos ilimitados',
    'Clientes ilimitados',
    'Almacenamiento ilimitado',
    'Mensajes ilimitados',
    'API completa',
    'Todas las integraciones'
];

async function main() {
    console.log('🚀 Iniciando migración a SaaS...\n');

    // ============================================
    // PASO 1: Crear plan Legacy si no existe
    // ============================================
    console.log('📋 Paso 1: Verificando plan Legacy...');

    let legacyPlan = await prisma.plan.findUnique({
        where: { name: 'legacy' }
    });

    if (!legacyPlan) {
        legacyPlan = await prisma.plan.create({
            data: {
                name: 'legacy',
                displayName: 'Legacy',
                description: 'Plan heredado para tenants existentes',
                priceMonthly: 0,
                priceYearly: 0,
                currency: 'MXN',
                features: JSON.stringify(LEGACY_FEATURES),
                limits: JSON.stringify(LEGACY_LIMITS),
                isActive: false,
                isPopular: false,
                sortOrder: 99,
                trialDays: 0
            }
        });
        console.log('  ✅ Plan Legacy creado');
    } else {
        console.log('  ✅ Plan Legacy ya existe');
    }

    // ============================================
    // PASO 2: Buscar tenants sin suscripción
    // ============================================
    console.log('\n📋 Paso 2: Buscando tenants sin suscripción...');

    const tenantsWithoutSubscription = await prisma.tenant.findMany({
        where: {
            subscription: null
        },
        select: {
            id: true,
            name: true,
            slug: true,
            createdAt: true
        }
    });

    console.log(`  📊 Encontrados ${tenantsWithoutSubscription.length} tenants sin suscripción`);

    // ============================================
    // PASO 3: Crear suscripciones legacy
    // ============================================
    console.log('\n📋 Paso 3: Creando suscripciones legacy...');

    let subscriptionsCreated = 0;
    const farFuture = new Date('2099-12-31');

    for (const tenant of tenantsWithoutSubscription) {
        try {
            await prisma.subscription.create({
                data: {
                    tenantId: tenant.id,
                    planId: legacyPlan.id,
                    status: SubscriptionStatus.ACTIVE,
                    currentPeriodStart: tenant.createdAt,
                    currentPeriodEnd: farFuture,
                    paymentMethod: PaymentMethodType.MANUAL,
                    billingEmail: null,
                    metadata: JSON.stringify({
                        migratedAt: new Date().toISOString(),
                        originalCreatedAt: tenant.createdAt.toISOString(),
                        migrationVersion: '1.0'
                    })
                }
            });
            subscriptionsCreated++;
            console.log(`  ✅ Suscripción creada para: ${tenant.name} (${tenant.slug})`);
        } catch (error) {
            console.error(`  ❌ Error creando suscripción para ${tenant.name}:`, error);
        }
    }

    console.log(`\n  📊 Total suscripciones creadas: ${subscriptionsCreated}`);

    // ============================================
    // PASO 4: Inicializar tracking de uso
    // ============================================
    console.log('\n📋 Paso 4: Inicializando tracking de uso...');

    const currentPeriod = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

    const allTenants = await prisma.tenant.findMany({
        select: { id: true, slug: true }
    });

    let usageInitialized = 0;

    for (const tenant of allTenants) {
        // Verificar si ya existe el registro de uso
        const existingUsage = await prisma.tenantUsage.findUnique({
            where: {
                tenantId_period: {
                    tenantId: tenant.id,
                    period: currentPeriod
                }
            }
        });

        if (!existingUsage) {
            // Calcular uso actual
            const [usersCount, loansCount, clientsCount] = await Promise.all([
                prisma.user.count({ where: { tenantId: tenant.id } }),
                prisma.loan.count({ where: { tenantId: tenant.id } }),
                prisma.client.count({ where: { tenantId: tenant.id } })
            ]);

            // Calcular storage (si existe el modelo File con relación a User)
            let storageBytes = BigInt(0);
            try {
                const storageResult = await prisma.file.aggregate({
                    where: {
                        uploadedBy: { tenantId: tenant.id }
                    },
                    _sum: { fileSize: true }
                });
                storageBytes = BigInt(storageResult._sum.fileSize || 0);
            } catch {
                // Modelo File puede no tener la relación configurada
            }

            await prisma.tenantUsage.create({
                data: {
                    tenantId: tenant.id,
                    period: currentPeriod,
                    usersCount,
                    loansCount,
                    clientsCount,
                    storageBytes,
                    apiCalls: 0,
                    smsCount: 0,
                    whatsappCount: 0,
                    reportsCount: 0
                }
            });
            usageInitialized++;
            console.log(`  ✅ Uso inicializado para: ${tenant.slug} (Users: ${usersCount}, Loans: ${loansCount}, Clients: ${clientsCount})`);
        }
    }

    console.log(`\n  📊 Total registros de uso inicializados: ${usageInitialized}`);

    // ============================================
    // RESUMEN FINAL
    // ============================================
    console.log('\n' + '='.repeat(60));
    console.log('✨ MIGRACIÓN A SAAS COMPLETADA');
    console.log('='.repeat(60));
    console.log(`
  📊 Resumen:
  - Plan Legacy: ${legacyPlan.id}
  - Suscripciones creadas: ${subscriptionsCreated}
  - Registros de uso inicializados: ${usageInitialized}
  - Periodo actual: ${currentPeriod}

  ⚠️ Próximos pasos:
  1. Ejecutar: npx prisma db push (si hay cambios de schema)
  2. Ejecutar: npx ts-node scripts/seed-plans.ts (para crear todos los planes)
  3. Verificar que todas las suscripciones están activas
  4. Configurar renovaciones automáticas si es necesario
  `);
}

main()
    .catch((e) => {
        console.error('\n❌ Error en migración:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
