
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testAdminUsersAPI() {
  try {
    console.log('🔍 Testing admin users API directly...');
    
    // Simular la misma lógica que en el endpoint de la API
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

    console.log(`✅ La API debería retornar ${users.length} usuarios:`);
    console.log(JSON.stringify({ users }, null, 2));
    
    console.log('\n📋 Resumen de usuarios por rol:');
    const roles = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {});
    
    Object.keys(roles).forEach(role => {
      console.log(`- ${role}: ${roles[role]} usuarios`);
    });

  } catch (error) {
    console.error('❌ Error al consultar usuarios:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAdminUsersAPI();
