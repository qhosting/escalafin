
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testUsers() {
  try {
    console.log('🔍 Buscando usuarios en la base de datos...');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        _count: {
          select: {
            clientsAssigned: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`✅ Encontrados ${users.length} usuarios:`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.firstName} ${user.lastName} (${user.email})`);
      console.log(`   - Rol: ${user.role}`);
      console.log(`   - Estado: ${user.status}`);
      console.log(`   - ID: ${user.id}`);
      console.log(`   - Creado: ${user.createdAt}`);
      if (user._count.clientsAssigned > 0) {
        console.log(`   - Clientes asignados: ${user._count.clientsAssigned}`);
      }
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error al consultar usuarios:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testUsers();
