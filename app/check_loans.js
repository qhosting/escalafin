
const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: "postgres://postgres:7fc6f898f29e38e2ea54@100.75.220.89:1088/escalafin-db?sslmode=disable"
      }
    }
  });

  try {
    console.log('--- Tenants ---');
    const tenants = await prisma.tenant.findMany();
    console.log(tenants.map(t => ({ id: t.id, name: t.name, slug: t.slug })));

    for (const tenant of tenants) {
        console.log(`\n--- Checking loans for tenant: ${tenant.name} (${tenant.id}) ---`);
        // We need to use the tenant's specific schema or just check the global tables if they are shared
        // In this architecture, it seems we use a single DB with tenantId column in some tables, 
        // or multiple schemas. Let's check the schema.prisma again.
    }

  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
