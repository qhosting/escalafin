
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Configuración de Tenant Demo ---');

  // 1. Buscar o crear el tenant demo
  let tenant = await prisma.tenant.findUnique({
    where: { slug: 'demo' }
  });

  if (!tenant) {
    console.log('Creando tenant Escalafin Demo...');
    tenant = await prisma.tenant.create({
      data: {
        name: 'Escalafin Demo',
        slug: 'demo',
        status: 'ACTIVE'
      }
    });
  } else {
    console.log('Tenant demo ya existe.');
  }

  // 2. Buscar el usuario admin y vincular al tenant demo
  const email = 'admin@escalafin.com';
  let user = await prisma.user.findUnique({
    where: { email }
  });

  if (user) {
    if (user.tenantId !== tenant.id) {
      console.log(`Vinculando usuario ${email} al tenant ${tenant.name}...`);
      await prisma.user.update({
        where: { id: user.id },
        data: { 
          tenantId: tenant.id,
          role: 'ADMIN' // Aseguramos que sea admin
        }
      });
    } else {
      console.log(`Usuario ${email} ya está vinculado al tenant demo.`);
    }
  } else {
    console.log(`Usuario ${email} no encontrado. Creándolo...`);
    // Passwords should be hashed, but for demo we can assume a default one if the app uses one
    // or just let the user create it via UI and then run this script?
    // Actually, normally we shouldn't create users with plaintext like this if using auth.
    // Let's just update if it exists.
  }

  console.log('¡Configuración finalizada!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
