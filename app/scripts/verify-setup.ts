
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Verificando despliegue y base de datos...');

    try {
        // 1. Verificar Tablas principales
        const userCount = await prisma.user.count();
        const clientCount = await prisma.client.count();
        const loanCount = await prisma.loan.count();
        const configCount = await prisma.systemConfig.count();

        console.log(`✅ Tablas verificadas correctamente.`);
        console.log(`📊 Estadísticas actuales:`);
        console.log(`   - Usuarios: ${userCount}`);
        console.log(`   - Clientes: ${clientCount}`);
        console.log(`   - Préstamos: ${loanCount}`);
        console.log(`   - Configuraciones: ${configCount}`);

        // 2. Verificar Roles
        const roles = ['ADMIN', 'ASESOR', 'CLIENTE'];
        console.log('\n👥 Verificando existencia de roles:');

        for (const role of roles) {
            const count = await prisma.user.count({ where: { role: role as any } });
            if (count > 0) {
                console.log(`   - [OK] Rol ${role}: ${count} usuarios encontrados.`);
            } else {
                console.log(`   - [!!] Rol ${role}: NO ENCONTRADO.`);
            }
        }

        // 3. Verificar configuración de préstamos (Fase 3)
        const loanConfig = await prisma.systemConfig.findFirst({
            where: { key: 'LOAN_TARIFF_CONFIG' }
        });
        if (loanConfig) {
            console.log('\n⚙️ Configuración dinámica de tarifas (Fase 3) detectada.');
        } else {
            console.log('\n⚠️ Configuración dinámica de tarifas (Fase 3) no inicializada aún.');
        }

    } catch (error: any) {
        console.error('❌ Error durante la verificación:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
