const { PrismaClient } = require('@prisma/client');

async function checkModules() {
  const prisma = new PrismaClient();
  
  try {
    const modules = await prisma.pWAModule.findMany({
      orderBy: { sortOrder: 'asc' }
    });
    
    console.log('\n📋 Módulos en la base de datos:');
    console.log('Total:', modules.length);
    console.log('\n');
    
    modules.forEach(mod => {
      console.log(`- ${mod.name} (${mod.moduleKey})`);
      console.log(`  Status: ${mod.status}`);
      console.log(`  Category: ${mod.category}`);
      console.log(`  Route: ${mod.route || 'N/A'}`);
      console.log('');
    });
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkModules();
