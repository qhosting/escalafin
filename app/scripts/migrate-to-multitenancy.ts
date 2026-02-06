
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateToMultiTenancy() {
    console.log('🚀 Iniciando migración a Multi-tenancy...');

    try {
        // 1. Crear o buscar Tenant por defecto
        const defaultSlug = 'default-tenant';
        let defaultTenant = await prisma.tenant.findUnique({
            where: { slug: defaultSlug }
        });

        if (!defaultTenant) {
            console.log('📦 Creando Tenant por defecto...');
            defaultTenant = await prisma.tenant.create({
                data: {
                    name: 'Organización Principal',
                    slug: defaultSlug,
                    domain: 'app.escalafin.com', // Ajustar según producción
                    status: 'ACTIVE'
                }
            });
            console.log(`✅ Tenant creado: ${defaultTenant.id} (${defaultTenant.name})`);
        } else {
            console.log(`ℹ️ Tenant por defecto ya existe: ${defaultTenant.id}`);
        }

        const tenantId = defaultTenant.id;

        // 2. Migrar Usuarios
        const usersCount = await prisma.user.count({ where: { tenantId: null } });
        if (usersCount > 0) {
            console.log(`👥 Migrando ${usersCount} usuarios...`);
            await prisma.user.updateMany({
                where: { tenantId: null },
                data: { tenantId }
            });
        }

        // 3. Migrar Clientes
        const clientsCount = await prisma.client.count({ where: { tenantId: null } });
        if (clientsCount > 0) {
            console.log(`👥 Migrando ${clientsCount} clientes...`);
            await prisma.client.updateMany({
                where: { tenantId: null },
                data: { tenantId }
            });
        }

        // 4. Migrar SystemConfig
        const configCount = await prisma.systemConfig.count({ where: { tenantId: null } });
        if (configCount > 0) {
            console.log(`⚙️ Migrando ${configCount} configuraciones del sistema...`);
            await prisma.systemConfig.updateMany({
                where: { tenantId: null },
                data: { tenantId }
            });
        }

        // 5. Migrar WahaConfig
        const wahaCount = await prisma.wahaConfig.count({ where: { tenantId: null } });
        if (wahaCount > 0) {
            console.log(`📱 Migrando ${wahaCount} configuraciones de WhatsApp...`);
            await prisma.wahaConfig.updateMany({
                where: { tenantId: null },
                data: { tenantId }
            });
        }

        // 6. Migrar MessageTemplate
        const templateCount = await prisma.messageTemplate.count({ where: { tenantId: null } });
        if (templateCount > 0) {
            console.log(`📨 Migrando ${templateCount} plantillas de mensajes...`);
            await prisma.messageTemplate.updateMany({
                where: { tenantId: null },
                data: { tenantId }
            });
        }

        // 7. Migrar ReportTemplate
        const reportCount = await prisma.reportTemplate.count({ where: { tenantId: null } });
        if (reportCount > 0) {
            console.log(`📊 Migrando ${reportCount} plantillas de reportes...`);
            await prisma.reportTemplate.updateMany({
                where: { tenantId: null },
                data: { tenantId }
            });
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
