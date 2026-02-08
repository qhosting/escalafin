/**
 * Script de Seed para Planes SaaS
 * 
 * Ejecutar con: npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/seed-plans.ts
 * O incluir en prisma/seed.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Límites por plan
const PLAN_LIMITS = {
    starter: {
        users: 3,
        loans: 100,
        clients: 200,
        storageGB: 1,
        apiCalls: 1000,
        smsPerMonth: 500,
        whatsappPerMonth: 500,
        customReports: false,
        apiAccess: false,
        whiteLabeling: false,
        prioritySupport: false,
        ssoEnabled: false,
        customDomain: false
    },
    professional: {
        users: 10,
        loans: 500,
        clients: 1000,
        storageGB: 10,
        apiCalls: 10000,
        smsPerMonth: 2000,
        whatsappPerMonth: 2000,
        customReports: true,
        apiAccess: true,
        whiteLabeling: false,
        prioritySupport: false,
        ssoEnabled: false,
        customDomain: true
    },
    business: {
        users: 25,
        loans: 2000,
        clients: 5000,
        storageGB: 50,
        apiCalls: 50000,
        smsPerMonth: 10000,
        whatsappPerMonth: 10000,
        customReports: true,
        apiAccess: true,
        whiteLabeling: true,
        prioritySupport: true,
        ssoEnabled: false,
        customDomain: true
    },
    enterprise: {
        users: -1, // Ilimitado
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
    },
    legacy: {
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
    }
};

// Features por plan (para mostrar en la UI)
const PLAN_FEATURES = {
    starter: [
        'Hasta 3 usuarios',
        'Hasta 100 préstamos/mes',
        'Hasta 200 clientes',
        '1 GB almacenamiento',
        '500 mensajes WhatsApp/mes',
        '500 SMS/mes',
        'Soporte por email',
        'Dashboard básico',
        'Reportes estándar'
    ],
    professional: [
        'Hasta 10 usuarios',
        'Hasta 500 préstamos/mes',
        'Hasta 1,000 clientes',
        '10 GB almacenamiento',
        '2,000 mensajes WhatsApp/mes',
        '2,000 SMS/mes',
        'Acceso a API REST',
        'Reportes personalizados',
        'Dominio personalizado',
        'Soporte prioritario por chat',
        'Scoring con IA'
    ],
    business: [
        'Hasta 25 usuarios',
        'Hasta 2,000 préstamos/mes',
        'Hasta 5,000 clientes',
        '50 GB almacenamiento',
        '10,000 mensajes WhatsApp/mes',
        '10,000 SMS/mes',
        'API ilimitada',
        'Webhooks configurables',
        'White-labeling completo',
        'Soporte telefónico 24/7',
        'Entrenamiento de modelos ML',
        'Chatbot avanzado'
    ],
    enterprise: [
        'Usuarios ilimitados',
        'Préstamos ilimitados',
        'Clientes ilimitados',
        'Almacenamiento ilimitado',
        'Mensajes ilimitados',
        'SSO/SAML',
        'SLA personalizado',
        'Gerente de cuenta dedicado',
        'Implementación guiada',
        'Integraciones personalizadas',
        'Ambiente dedicado opcional',
        'Auditoría de seguridad'
    ]
};

async function main() {
    console.log('🌱 Seeding planes SaaS...\n');

    const plans = [
        {
            name: 'starter',
            displayName: 'Starter',
            description: 'Ideal para pequeñas financieras y emprendedores que inician',
            priceMonthly: 499,
            priceYearly: 4990,
            currency: 'MXN',
            features: JSON.stringify(PLAN_FEATURES.starter),
            limits: JSON.stringify(PLAN_LIMITS.starter),
            isActive: true,
            isPopular: false,
            sortOrder: 1,
            trialDays: 14
        },
        {
            name: 'professional',
            displayName: 'Profesional',
            description: 'Para financieras en crecimiento que necesitan más capacidad',
            priceMonthly: 1499,
            priceYearly: 14990,
            currency: 'MXN',
            features: JSON.stringify(PLAN_FEATURES.professional),
            limits: JSON.stringify(PLAN_LIMITS.professional),
            isActive: true,
            isPopular: true,
            sortOrder: 2,
            trialDays: 14
        },
        {
            name: 'business',
            displayName: 'Business',
            description: 'Para financieras establecidas con alta demanda y necesidades avanzadas',
            priceMonthly: 3999,
            priceYearly: 39990,
            currency: 'MXN',
            features: JSON.stringify(PLAN_FEATURES.business),
            limits: JSON.stringify(PLAN_LIMITS.business),
            isActive: true,
            isPopular: false,
            sortOrder: 3,
            trialDays: 14
        },
        {
            name: 'enterprise',
            displayName: 'Enterprise',
            description: 'Solución personalizada para grandes organizaciones con necesidades específicas',
            priceMonthly: 0, // Precio a convenir
            priceYearly: 0,
            currency: 'MXN',
            features: JSON.stringify(PLAN_FEATURES.enterprise),
            limits: JSON.stringify(PLAN_LIMITS.enterprise),
            isActive: true,
            isPopular: false,
            sortOrder: 4,
            trialDays: 30
        },
        {
            name: 'legacy',
            displayName: 'Legacy',
            description: 'Plan heredado para tenants existentes antes del sistema SaaS',
            priceMonthly: 0,
            priceYearly: 0,
            currency: 'MXN',
            features: JSON.stringify(PLAN_FEATURES.enterprise), // Mismas features que enterprise
            limits: JSON.stringify(PLAN_LIMITS.legacy),
            isActive: false, // No visible para nuevos usuarios
            isPopular: false,
            sortOrder: 99,
            trialDays: 0
        }
    ];

    for (const plan of plans) {
        const result = await prisma.plan.upsert({
            where: { name: plan.name },
            update: {
                displayName: plan.displayName,
                description: plan.description,
                priceMonthly: plan.priceMonthly,
                priceYearly: plan.priceYearly,
                features: plan.features,
                limits: plan.limits,
                isActive: plan.isActive,
                isPopular: plan.isPopular,
                sortOrder: plan.sortOrder,
                trialDays: plan.trialDays
            },
            create: plan
        });

        console.log(`  ✅ Plan ${result.displayName} (${result.name}) - $${result.priceMonthly} MXN/mes`);
    }

    console.log('\n✨ Seed de planes completado!');
}

main()
    .catch((e) => {
        console.error('❌ Error en seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
