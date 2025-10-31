
import { PrismaClient, NotificationType, NotificationChannel, NotificationStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔔 Generando notificaciones de prueba...');

  // Obtener usuarios
  const users = await prisma.user.findMany({
    take: 5
  });

  if (users.length === 0) {
    console.log('⚠️  No hay usuarios en la base de datos');
    return;
  }

  console.log(`✅ Encontrados ${users.length} usuarios`);

  const notifications = [];

  for (const user of users) {
    // Notificación de préstamo aprobado
    notifications.push({
      userId: user.id,
      type: NotificationType.LOAN_APPROVED,
      channel: NotificationChannel.IN_APP,
      title: 'Préstamo Aprobado',
      message: `El préstamo por $50,000 MXN ha sido aprobado exitosamente`,
      status: NotificationStatus.PENDING,
      data: JSON.stringify({ amount: 50000, loanId: 'test-loan-1' })
    });

    // Notificación de pago próximo
    notifications.push({
      userId: user.id,
      type: NotificationType.PAYMENT_DUE,
      channel: NotificationChannel.IN_APP,
      title: 'Pago Próximo a Vencer',
      message: 'Tu pago de $2,500 MXN vence en 3 días',
      status: NotificationStatus.PENDING,
      data: JSON.stringify({ amount: 2500, daysLeft: 3 })
    });

    // Solo para admin/asesor - notificación de pago vencido
    if (user.role === 'ADMIN' || user.role === 'ASESOR') {
      notifications.push({
        userId: user.id,
        type: NotificationType.PAYMENT_OVERDUE,
        channel: NotificationChannel.IN_APP,
        title: 'Pago Vencido',
        message: 'Cliente Juan Pérez tiene un pago vencido desde hace 5 días',
        status: NotificationStatus.PENDING,
        data: JSON.stringify({ clientName: 'Juan Pérez', daysOverdue: 5 })
      });

      notifications.push({
        userId: user.id,
        type: NotificationType.SYSTEM_ALERT,
        channel: NotificationChannel.IN_APP,
        title: 'Actualización del Sistema',
        message: 'Nueva funcionalidad de reportes disponible',
        status: NotificationStatus.PENDING,
        data: null
      });
    }

    // Recordatorio
    notifications.push({
      userId: user.id,
      type: NotificationType.REMINDER,
      channel: NotificationChannel.IN_APP,
      title: 'Recordatorio',
      message: 'Revisar solicitudes pendientes de aprobación',
      status: NotificationStatus.PENDING,
      data: null
    });
  }

  // Crear todas las notificaciones
  for (const notification of notifications) {
    await prisma.notification.create({
      data: notification
    });
  }

  console.log(`✅ Se crearon ${notifications.length} notificaciones de prueba`);
  console.log('✅ Las notificaciones ahora están disponibles en /notifications');
}

main()
  .catch((e) => {
    console.error('❌ Error al generar notificaciones:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
