
import { prisma } from '@/lib/prisma';
import { NotificationType, NotificationChannel } from '@prisma/client';

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  channel?: NotificationChannel;
  data?: Record<string, any>;
  scheduledFor?: Date;
}

export async function createNotification({
  userId,
  type,
  title,
  message,
  channel = NotificationChannel.IN_APP,
  data,
  scheduledFor
}: CreateNotificationParams) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        channel,
        data: data ? JSON.stringify(data) : null,
        scheduledFor,
        status: 'PENDING'
      }
    });

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

// Funciones auxiliares para crear notificaciones comunes
export const NotificationHelpers = {
  async loanApproved(userId: string, clientName: string, amount: number, loanId: string) {
    return createNotification({
      userId,
      type: NotificationType.LOAN_APPROVED,
      title: 'Préstamo Aprobado',
      message: `El préstamo de ${clientName} por $${amount.toLocaleString('es-MX')} ha sido aprobado exitosamente`,
      data: { loanId, clientName, amount }
    });
  },

  async loanRejected(userId: string, clientName: string, loanId: string) {
    return createNotification({
      userId,
      type: NotificationType.LOAN_REJECTED,
      title: 'Préstamo Rechazado',
      message: `La solicitud de préstamo de ${clientName} ha sido rechazada`,
      data: { loanId, clientName }
    });
  },

  async paymentDue(userId: string, clientName: string, amount: number, dueDate: Date, loanId: string) {
    return createNotification({
      userId,
      type: NotificationType.PAYMENT_DUE,
      title: 'Pago Próximo a Vencer',
      message: `${clientName} tiene un pago de $${amount.toLocaleString('es-MX')} que vence el ${dueDate.toLocaleDateString('es-MX')}`,
      data: { loanId, clientName, amount, dueDate: dueDate.toISOString() }
    });
  },

  async paymentOverdue(userId: string, clientName: string, amount: number, daysOverdue: number, loanId: string) {
    return createNotification({
      userId,
      type: NotificationType.PAYMENT_OVERDUE,
      title: 'Pago Vencido',
      message: `${clientName} tiene un pago vencido de $${amount.toLocaleString('es-MX')} desde hace ${daysOverdue} días`,
      data: { loanId, clientName, amount, daysOverdue }
    });
  },

  async systemAlert(userId: string, title: string, message: string, data?: Record<string, any>) {
    return createNotification({
      userId,
      type: NotificationType.SYSTEM_ALERT,
      title,
      message,
      data
    });
  },

  async reminder(userId: string, title: string, message: string, scheduledFor?: Date, data?: Record<string, any>) {
    return createNotification({
      userId,
      type: NotificationType.REMINDER,
      title,
      message,
      scheduledFor,
      data
    });
  }
};
