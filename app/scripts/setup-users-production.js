
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function setupTestUsers() {
  console.log('🔧 CONFIGURANDO USUARIOS DE PRUEBA - ESCALAFIN');
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('');

  try {
    // Verificar conexión a DB
    console.log('🔌 Verificando conexión a base de datos...');
    await prisma.$connect();
    console.log('   ✅ Conexión exitosa');
    console.log('');

    // Contar usuarios existentes
    const userCount = await prisma.user.count();
    console.log(`📊 Usuarios actuales en la base de datos: ${userCount}`);
    console.log('');

    // Definir usuarios de prueba
    const testUsers = [
      {
        email: 'admin@escalafin.com',
        password: 'admin123',
        firstName: 'Admin',
        lastName: 'Sistema',
        phone: '+52 555 000 0001',
        role: 'ADMIN',
      },
      {
        email: 'asesor@escalafin.com',
        password: 'asesor123',
        firstName: 'Asesor',
        lastName: 'Demo',
        phone: '+52 555 000 0002',
        role: 'ASESOR',
      },
      {
        email: 'cliente@escalafin.com',
        password: 'cliente123',
        firstName: 'Cliente',
        lastName: 'Demo',
        phone: '+52 555 000 0003',
        role: 'CLIENTE',
      },
    ];

    console.log('👤 Creando/Actualizando usuarios de prueba...');
    console.log('');

    for (const userData of testUsers) {
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      
      await prisma.user.upsert({
        where: { email: userData.email },
        update: {
          password: hashedPassword,
          firstName: userData.firstName,
          lastName: userData.lastName,
          phone: userData.phone,
          role: userData.role,
          status: 'ACTIVE',
        },
        create: {
          email: userData.email,
          password: hashedPassword,
          firstName: userData.firstName,
          lastName: userData.lastName,
          phone: userData.phone,
          role: userData.role,
          status: 'ACTIVE',
        },
      });

      console.log(`   ✅ ${userData.role.padEnd(8)} - ${userData.email}`);
    }

    console.log('');
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log('✅ USUARIOS DE PRUEBA CONFIGURADOS EXITOSAMENTE');
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log('');
    console.log('🔐 CREDENCIALES DE LOGIN:');
    console.log('');
    console.log('   👨‍💼 ADMINISTRADOR');
    console.log('      Email:    admin@escalafin.com');
    console.log('      Password: admin123');
    console.log('');
    console.log('   👔 ASESOR');
    console.log('      Email:    asesor@escalafin.com');
    console.log('      Password: asesor123');
    console.log('');
    console.log('   👤 CLIENTE');
    console.log('      Email:    cliente@escalafin.com');
    console.log('      Password: cliente123');
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log('');

    // Estadísticas finales
    const stats = {
      total: await prisma.user.count(),
      admins: await prisma.user.count({ where: { role: 'ADMIN' } }),
      asesores: await prisma.user.count({ where: { role: 'ASESOR' } }),
      clientes: await prisma.user.count({ where: { role: 'CLIENTE' } }),
    };

    console.log('📊 ESTADÍSTICAS FINALES:');
    console.log(`   Total usuarios:   ${stats.total}`);
    console.log(`   Administradores:  ${stats.admins}`);
    console.log(`   Asesores:         ${stats.asesores}`);
    console.log(`   Clientes:         ${stats.clientes}`);
    console.log('');

  } catch (error) {
    console.error('❌ ERROR:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el script
setupTestUsers()
  .then(() => {
    console.log('✅ Script completado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });
