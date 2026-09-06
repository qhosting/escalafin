import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Iniciando conversión de clientes existentes a MAYÚSCULAS...');

  try {
    const clientsUpdated = await prisma.$executeRawUnsafe(`
      UPDATE clients
      SET 
        "firstName" = UPPER(TRIM("firstName")),
        "lastName" = UPPER(TRIM("lastName")),
        "address" = CASE WHEN "address" IS NOT NULL THEN UPPER(TRIM("address")) ELSE NULL END,
        "city" = CASE WHEN "city" IS NOT NULL THEN UPPER(TRIM("city")) ELSE NULL END,
        "state" = CASE WHEN "state" IS NOT NULL THEN UPPER(TRIM("state")) ELSE NULL END,
        "employerName" = CASE WHEN "employerName" IS NOT NULL THEN UPPER(TRIM("employerName")) ELSE NULL END,
        "workAddress" = CASE WHEN "workAddress" IS NOT NULL THEN UPPER(TRIM("workAddress")) ELSE NULL END,
        "bankName" = CASE WHEN "bankName" IS NOT NULL THEN UPPER(TRIM("bankName")) ELSE NULL END
      WHERE 
        "firstName" != UPPER("firstName") OR 
        "lastName" != UPPER("lastName");
    `);
    console.log(`✅ Clientes actualizados: ${clientsUpdated}`);

    const guarantorsUpdated = await prisma.$executeRawUnsafe(`
      UPDATE guarantors
      SET 
        "fullName" = UPPER(TRIM("fullName")),
        "address" = CASE WHEN "address" IS NOT NULL THEN UPPER(TRIM("address")) ELSE NULL END
      WHERE 
        "fullName" != UPPER("fullName");
    `);
    console.log(`✅ Avales actualizados: ${guarantorsUpdated}`);

    const refsUpdated = await prisma.$executeRawUnsafe(`
      UPDATE personal_references
      SET 
        "fullName" = UPPER(TRIM("fullName")),
        "address" = CASE WHEN "address" IS NOT NULL THEN UPPER(TRIM("address")) ELSE NULL END
      WHERE 
        "fullName" != UPPER("fullName");
    `);
    console.log(`✅ Referencias personales actualizadas: ${refsUpdated}`);

    const collateralsUpdated = await prisma.$executeRawUnsafe(`
      UPDATE collaterals
      SET 
        "description" = UPPER(TRIM("description"))
      WHERE 
        "description" != UPPER("description");
    `);
    console.log(`✅ Garantías actualizadas: ${collateralsUpdated}`);

    console.log('🎉 Conversión completada exitosamente.');
  } catch (error) {
    console.error('❌ Error durante la conversión:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
