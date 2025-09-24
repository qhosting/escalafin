
// Script para diagnosticar el problema con la carga de usuarios
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugUserManagement() {
  console.log('🔍 DIAGNÓSTICO DEL PROBLEMA DE GESTIÓN DE USUARIOS');
  console.log('=' .repeat(60));
  
  try {
    console.log('\n1. ✅ Verificando conexión a la base de datos...');
    await prisma.$connect();
    console.log('   ✅ Conexión establecida correctamente');
    
    console.log('\n2. 🔍 Consultando usuarios (simulando la consulta de la API)...');
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

    console.log(`   ✅ Consulta exitosa: ${users.length} usuarios encontrados`);
    
    console.log('\n3. 📊 Resumen de usuarios por rol:');
    const roleCount = {};
    const statusCount = {};
    
    users.forEach(user => {
      roleCount[user.role] = (roleCount[user.role] || 0) + 1;
      statusCount[user.status] = (statusCount[user.status] || 0) + 1;
    });
    
    console.log('   Roles:');
    Object.entries(roleCount).forEach(([role, count]) => {
      console.log(`   - ${role}: ${count}`);
    });
    
    console.log('   Estados:');
    Object.entries(statusCount).forEach(([status, count]) => {
      console.log(`   - ${status}: ${count}`);
    });

    console.log('\n4. 👥 Lista detallada de usuarios:');
    users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.firstName} ${user.lastName}`);
      console.log(`      📧 ${user.email}`);
      console.log(`      🏷️  ${user.role} | ${user.status}`);
      console.log(`      📅 ${user.createdAt.toLocaleDateString()}`);
      if (user._count?.clientsAssigned > 0) {
        console.log(`      👥 ${user._count.clientsAssigned} clientes asignados`);
      }
      console.log('');
    });
    
    console.log('\n5. 🧪 Simulando respuesta de la API:');
    const apiResponse = { users };
    console.log('   Estructura de respuesta que debería recibir el frontend:');
    console.log(JSON.stringify(apiResponse, null, 2));
    
    console.log('\n6. ✅ DIAGNÓSTICO COMPLETADO');
    console.log('   La base de datos y la consulta funcionan correctamente.');
    console.log('   El problema podría estar en:');
    console.log('   - Autenticación/autorización en el frontend');
    console.log('   - Manejo de estado en React');
    console.log('   - Renderizado condicional en el componente');
    console.log('   - Cookies/sesión no válida');
    
  } catch (error) {
    console.error('\n❌ ERROR EN EL DIAGNÓSTICO:');
    console.error('   ', error.message);
    console.error('\n   Stack trace:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

debugUserManagement();
