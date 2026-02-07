
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateToMultiTenancy() {
    console.log('🚀 Iniciando migración a Multi-tenancy...');

    try {
        // 1. Crear o buscar Tenant por defecto
        const defaultSlug = 'default-tenant';
        let defaultTenant = await (prisma as any).tenant.findUnique({
            where: { slug: defaultSlug }
        });

        if (!defaultTenant) {
            console.log('📦 Creando Tenant por defecto...');
            defaultTenant = await (prisma as any).tenant.create({
                data: {
                    name: 'Organización Principal',
                    slug: defaultSlug,
                    domain: 'app.escalafin.com',
                    status: 'ACTIVE'
                }
            });
            console.log(`✅ Tenant creado: ${defaultTenant.id} (${defaultTenant.name})`);
        } else {
            console.log(`ℹ️ Tenant por defecto ya existe: ${defaultTenant.id}`);
        }

        const tenantId = defaultTenant.id;

        const modelsToMigrate = [
            { name: 'User', model: prisma.user },
            { name: 'Client', model: prisma.client },
            { name: 'Loan', model: prisma.loan },
            { name: 'Payment', model: prisma.payment },
            { name: 'CreditApplication', model: prisma.creditApplication },
            { name: 'SystemConfig', model: prisma.systemConfig },
            { name: 'WahaConfig', model: prisma.wahaConfig },
            { name: 'MessageTemplate', model: prisma.messageTemplate },
            { name: 'ReportTemplate', model: prisma.reportTemplate },
            { name: 'PersonalReference', model: prisma.personalReference },
            { name: 'Guarantor', model: prisma.guarantor },
            { name: 'Collateral', model: prisma.collateral },
            { name: 'CreditScore', model: prisma.creditScore },
            { name: 'AuditLog', model: prisma.auditLog },
        ];

        for (const { name, model } of modelsToMigrate) {
            const count = await (model as any).count({ where: { tenantId: null } });
            if (count > 0) {
                console.log(`⏳ Migrando ${count} registros en ${name}...`);
                await (model as any).updateMany({
                    where: { tenantId: null },
                    data: { tenantId }
                });
                console.log(`✅ ${name} migrado.`);
            } else {
                console.log(`ℹ️ No hay registros pendientes en ${name}.`);
            }
        }

        console.log('🎉 Migración completada exitosamente.');

    } catch (error) {
        console.error('❌ Error durante la migración:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

migrateToMultiTenancy();
