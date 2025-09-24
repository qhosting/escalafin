
// Script de prueba de login para diagnóstico
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function testLogin() {
  console.log('🔍 Iniciando diagnóstico de login...');
  
  const prisma = new PrismaClient();
  
  try {
    // Verificar conexión a la base de datos
    await prisma.$connect();
    console.log('✅ Conexión a base de datos exitosa');
    
    // Buscar el usuario admin
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@escalafin.com' }
    });
    
    if (!adminUser) {
      console.log('❌ Usuario admin no encontrado');
      return;
    }
    
    console.log('✅ Usuario admin encontrado:', {
      id: adminUser.id,
      email: adminUser.email,
      name: `${adminUser.firstName} ${adminUser.lastName}`,
      role: adminUser.role,
      status: adminUser.status
    });
    
    // Verificar contraseña
    const password = 'admin123';
    const passwordMatch = await bcrypt.compare(password, adminUser.password);
    
    if (passwordMatch) {
      console.log('✅ Contraseña correcta');
    } else {
      console.log('❌ Contraseña incorrecta');
    }
    
    // Verificar estado del usuario
    if (adminUser.status === 'ACTIVE') {
      console.log('✅ Usuario activo');
    } else {
      console.log('❌ Usuario no activo:', adminUser.status);
    }
    
  } catch (error) {
    console.error('❌ Error en el diagnóstico:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testLogin();
