
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const adminEmail = 'admin@escalafin.com';

    // Buscar el usuario
    const user = await prisma.user.findUnique({
        where: { email: adminEmail }
    });

    if (!user) {
        console.log(`❌ No se encontró el usuario ${adminEmail}`);
        return;
    }

    // Actualizar a SUPER_ADMIN
    // Usamos 'as any' porque el tipo en el cliente generado puede no estar actualizado
    // aunque ya corrimos npx prisma generate, por seguridad.
    await prisma.user.update({
        where: { email: adminEmail },
        data: { role: 'SUPER_ADMIN' as any }
    });

    console.log(`✅ El usuario ${adminEmail} ha sido actualizado a SUPER_ADMIN.`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
