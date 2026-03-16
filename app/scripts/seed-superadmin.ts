import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting to seed SuperAdmin...');

  const hashedPassword = await bcrypt.hash('superadmin123', 10);

  // Super Admin
  const superadmin = await prisma.user.upsert({
    where: { email: 'superadmin@escalafin.com' },
    update: {
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      tenantId: null, // Es superadmin global, no pertenece a un tenant
    },
    create: {
      email: 'superadmin@escalafin.com',
      password: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      phone: '+52 555 000 0000',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      tenantId: null,
    }
  });

  console.log('👑 Created SuperAdmin user:');
  console.log(`Email: ${superadmin.email}`);
  console.log(`Password: superadmin123`);
  console.log(`Role: ${superadmin.role}`);

  console.log('✅ SuperAdmin seeded successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error seeding SuperAdmin:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
