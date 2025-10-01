
import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import path from 'path';

// Cargar variables de entorno
config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

async function createTestUsers() {
  try {
    console.log('🚀 Creando usuarios de prueba...');

    // Crear hash de contraseñas
    const passwordHash = await bcrypt.hash('admin123', 12);
    const asesorPasswordHash = await bcrypt.hash('asesor123', 12);
    const clientePasswordHash = await bcrypt.hash('cliente123', 12);

    // Verificar si ya existen usuarios
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@escalafin.com' }
    });

    const existingAsesor = await prisma.user.findUnique({
      where: { email: 'asesor@escalafin.com' }
    });

    const existingCliente = await prisma.user.findUnique({
      where: { email: 'cliente@escalafin.com' }
    });

    // Crear o actualizar usuario ADMIN
    if (existingAdmin) {
      console.log('📝 Actualizando usuario Admin existente...');
      await prisma.user.update({
        where: { email: 'admin@escalafin.com' },
        data: {
          password: passwordHash,
          firstName: 'Administrador',
          lastName: 'Sistema',
          role: 'ADMIN',
          status: 'ACTIVE',
        }
      });
    } else {
      console.log('👤 Creando nuevo usuario Admin...');
      await prisma.user.create({
        data: {
          email: 'admin@escalafin.com',
          password: passwordHash,
          firstName: 'Administrador',
          lastName: 'Sistema',
          phone: '+52 1234567890',
          role: 'ADMIN',
          status: 'ACTIVE',
        }
      });
    }

    // Crear o actualizar usuario ASESOR
    if (existingAsesor) {
      console.log('📝 Actualizando usuario Asesor existente...');
      await prisma.user.update({
        where: { email: 'asesor@escalafin.com' },
        data: {
          password: asesorPasswordHash,
          firstName: 'Juan Carlos',
          lastName: 'Pérez',
          role: 'ASESOR',
          status: 'ACTIVE',
        }
      });
    } else {
      console.log('👤 Creando nuevo usuario Asesor...');
      await prisma.user.create({
        data: {
          email: 'asesor@escalafin.com',
          password: asesorPasswordHash,
          firstName: 'Juan Carlos',
          lastName: 'Pérez',
          phone: '+52 9876543210',
          role: 'ASESOR',
          status: 'ACTIVE',
        }
      });
    }

    // Crear o actualizar usuario CLIENTE
    if (existingCliente) {
      console.log('📝 Actualizando usuario Cliente existente...');
      await prisma.user.update({
        where: { email: 'cliente@escalafin.com' },
        data: {
          password: clientePasswordHash,
          firstName: 'María',
          lastName: 'García',
          role: 'CLIENTE',
          status: 'ACTIVE',
        }
      });
    } else {
      console.log('👤 Creando nuevo usuario Cliente...');
      await prisma.user.create({
        data: {
          email: 'cliente@escalafin.com',
          password: clientePasswordHash,
          firstName: 'María',
          lastName: 'García',
          phone: '+52 5551234567',
          role: 'CLIENTE',
          status: 'ACTIVE',
        }
      });
    }

    console.log('\n✅ Usuarios de prueba creados/actualizados exitosamente!');
    console.log('\n📋 CREDENCIALES DE PRUEBA:');
    console.log('────────────────────────────────');
    console.log('🔐 ADMIN:');
    console.log('   Email: admin@escalafin.com');
    console.log('   Password: admin123');
    console.log('\n🔐 ASESOR:');
    console.log('   Email: asesor@escalafin.com');
    console.log('   Password: asesor123');
    console.log('\n🔐 CLIENTE:');
    console.log('   Email: cliente@escalafin.com');
    console.log('   Password: cliente123');
    console.log('────────────────────────────────\n');

    // Mostrar estadísticas
    const totalUsers = await prisma.user.count();
    const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
    const asesorCount = await prisma.user.count({ where: { role: 'ASESOR' } });
    const clienteCount = await prisma.user.count({ where: { role: 'CLIENTE' } });

    console.log('📊 ESTADÍSTICAS DE USUARIOS:');
    console.log(`   Total de usuarios: ${totalUsers}`);
    console.log(`   Administradores: ${adminCount}`);
    console.log(`   Asesores: ${asesorCount}`);
    console.log(`   Clientes: ${clienteCount}`);

  } catch (error) {
    console.error('❌ Error creando usuarios de prueba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUsers();
