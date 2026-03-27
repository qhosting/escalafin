
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Iniciando Fusión de Tenants Demo ---');

  const oldDemo = await prisma.tenant.findUnique({
    where: { slug: 'demo' },
    include: { users: true }
  });

  const realDemo = await prisma.tenant.findUnique({
    where: { slug: 'escalafin-demo' }
  });

  if (!oldDemo || !realDemo) {
    console.log('No se pudieron encontrar ambos tenants. Abortando.');
    return;
  }

  // 1. Mover usuarios del tenant "demo" (vacío de datos) al tenant "escalafin-demo" (el que tiene la data)
  console.log(`Moviendo ${oldDemo.users.length} usuarios a ${realDemo.slug}...`);
  for (const user of oldDemo.users) {
    await prisma.user.update({
      where: { id: user.id },
      data: { tenantId: realDemo.id }
    });
  }

  // 2. Eliminar el tenant "demo" vacío
  console.log(`Eliminando tenant vacío: ${oldDemo.slug}...`);
  await prisma.tenant.delete({
    where: { id: oldDemo.id }
  });

  // 3. Renombrar "escalafin-demo" a "demo" para que la URL sea corta y elegante
  console.log(`Renombrando ${realDemo.slug} a "demo"...`);
  await prisma.tenant.update({
    where: { id: realDemo.id },
    data: { slug: 'demo' }
  });

  console.log('¡Fusión completada exitosamente! Ahora el tenant "demo" tiene toda la información.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
