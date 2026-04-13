
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TENANT_SLUG = 'prestamossjr';

async function main() {
  console.log(`--- LIMPIEZA DE TENANT: ${TENANT_SLUG} (Clientes y Movimientos) ---`);

  const tenant = await prisma.tenant.findUnique({
    where: { slug: TENANT_SLUG }
  });

  if (!tenant) {
    console.error(`❌ Error: No se encontró el tenant con slug "${TENANT_SLUG}"`);
    return;
  }

  const tenantId = tenant.id;
  console.log(`✅ Tenant encontrado: ${tenant.name} (${tenantId})`);

  // Obtener IDs de referencia
  const clients = await prisma.client.findMany({ where: { tenantId }, select: { id: true } });
  const clientIds = clients.map(c => c.id);
  
  const loans = await prisma.loan.findMany({ where: { tenantId }, select: { id: true } });
  const loanIds = loans.map(l => l.id);

  const payments = await prisma.payment.findMany({ where: { tenantId }, select: { id: true } });
  const paymentIds = payments.map(p => p.id);

  console.log(`Preparado para borrar: ${clientIds.length} clientes, ${loanIds.length} préstamos, ${paymentIds.length} pagos.`);

  console.log('--- Iniciando borrado por fases ---');

  // 1. Comunicaciones
  console.log('Fase 1: Comunicaciones...');
  const conversations = await prisma.conversation.findMany({ where: { clientId: { in: clientIds } }, select: { id: true } });
  const convoIds = conversations.map(c => c.id);
  
  await prisma.conversationMessage.deleteMany({ where: { conversationId: { in: convoIds } } });
  await prisma.conversation.deleteMany({ where: { id: { in: convoIds } } });
  await prisma.whatsAppMessage.deleteMany({ where: { clientId: { in: clientIds } } });

  // 2. Inteligencia
  console.log('Fase 2: Inteligencia...');
  await prisma.mLTrainingData.deleteMany({ where: { clientId: { in: clientIds } } });
  await prisma.creditScore.deleteMany({ where: { tenantId } });

  // 3. Cobranza
  console.log('Fase 3: Cobranza...');
  await prisma.commissionRecord.deleteMany({ where: { tenantId } });
  await prisma.promiseToPay.deleteMany({ where: { tenantId } });
  await prisma.collectionVisit.deleteMany({ where: { tenantId } });
  await prisma.collectionRoute.deleteMany({ where: { tenantId } });

  // 4. Finanzas
  console.log('Fase 4: Pagos...');
  await prisma.paymentTransaction.deleteMany({ where: { paymentId: { in: paymentIds } } });
  await prisma.cashCollection.deleteMany({ where: { paymentId: { in: paymentIds } } });
  await prisma.payment.deleteMany({ where: { tenantId } });
  await prisma.amortizationSchedule.deleteMany({ where: { loanId: { in: loanIds } } });

  // 5. Préstamos
  console.log('Fase 5: Préstamos...');
  await prisma.loan.deleteMany({ where: { tenantId } });
  await prisma.creditApplication.deleteMany({ where: { tenantId } });

  // 6. Clientes
  console.log('Fase 6: Clientes...');
  await prisma.collateral.deleteMany({ where: { clientId: { in: clientIds } } });
  await prisma.guarantor.deleteMany({ where: { clientId: { in: clientIds } } });
  await prisma.personalReference.deleteMany({ where: { clientId: { in: clientIds } } });
  await prisma.identityVerification.deleteMany({ where: { tenantId } });
  await prisma.file.deleteMany({ where: { clientId: { in: clientIds } } });
  await prisma.client.deleteMany({ where: { tenantId } });

  // 7. Sistema
  console.log('Fase 7: Sistema...');
  await prisma.tenantUsage.deleteMany({ where: { tenantId } });
  await prisma.auditLog.deleteMany({ where: { tenantId } });

  console.log('✅ Limpieza de CLIENTES y MOVIMIENTOS completada.');
}

main()
  .catch(e => {
    console.error('❌ Error durante la limpieza:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
