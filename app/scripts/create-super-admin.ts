
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createSuperAdmin() {
    const email = 'superadmin@escalafin.com';
    const password = 'SuperPassword2026!';
    const firstName = 'Global';
    const lastName = 'Admin';

    console.log(`🚀 Intentando crear Super Admin: ${email}...`);

    try {
        // Verificar si ya existe
        const existing = await prisma.user.findUnique({
            where: { email }
        });

        if (existing) {
            console.log('⚠️ El usuario ya existe. Actualizando a SUPER_ADMIN...');
            await prisma.user.update({
                where: { email },
                data: { role: 'SUPER_ADMIN' as any }
            });
            console.log('✅ Usuario existente actualizado a SUPER_ADMIN.');
            return;
        }

        // Crear nuevo usuario
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                firstName,
                lastName,
                role: 'SUPER_ADMIN' as any,
                status: 'ACTIVE'
            }
        });

        console.log('\n✨ Super Admin creado con éxito:');
        console.log(`📧 Email: ${email}`);
        console.log(`🔑 Password: ${password}`);
        console.log(`🛡️  Rol: SUPER_ADMIN`);

    } catch (error) {
        console.error('❌ Error creando Super Admin:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createSuperAdmin();
