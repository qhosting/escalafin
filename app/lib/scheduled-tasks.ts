
import { PrismaClient } from '@prisma/client';
import { WhatsAppNotificationService } from './whatsapp-notification';

const prisma = new PrismaClient();

export class ScheduledTasksService {
  private whatsappService: WhatsAppNotificationService;

  constructor() {
    this.whatsappService = new WhatsAppNotificationService();
  }

  // Ejecutar recordatorios de pago diarios
  async processPaymentReminders(): Promise<void> {
    try {
      console.log('Procesando recordatorios de pago...');

      // Obtener préstamos con pagos próximos a vencer (próximos 3 días)
      const upcomingPayments = await prisma.amortizationSchedule.findMany({
        where: {
          isPaid: false,
          paymentDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 días
          }
        },
        include: {
          loan: {
            include: {
              client: true
            }
          }
        }
      });

      // Obtener préstamos con pagos vencidos
      const overduePayments = await prisma.amortizationSchedule.findMany({
        where: {
          isPaid: false,
          paymentDate: {
            lt: new Date()
          }
        },
        include: {
          loan: {
            include: {
              client: true
            }
          }
        }
      });

      // Enviar recordatorios para pagos próximos a vencer
      for (const payment of upcomingPayments) {
        try {
          await this.whatsappService.sendPaymentReminderNotification(payment.loan.id);
          console.log(`Recordatorio enviado para préstamo ${payment.loan.loanNumber}`);
        } catch (error) {
          console.error(`Error enviando recordatorio para préstamo ${payment.loan.loanNumber}:`, error);
        }
      }

      // Enviar recordatorios para pagos vencidos
      for (const payment of overduePayments) {
        try {
          await this.whatsappService.sendPaymentReminderNotification(payment.loan.id);
          console.log(`Recordatorio de pago vencido enviado para préstamo ${payment.loan.loanNumber}`);
        } catch (error) {
          console.error(`Error enviando recordatorio vencido para préstamo ${payment.loan.loanNumber}:`, error);
        }
      }

      console.log(`Procesamiento completado: ${upcomingPayments.length} próximos, ${overduePayments.length} vencidos`);
    } catch (error) {
      console.error('Error procesando recordatorios de pago:', error);
    }
  }

  // Procesar mensajes programados
  async processScheduledMessages(): Promise<void> {
    try {
      await this.whatsappService.processScheduledMessages();
    } catch (error) {
      console.error('Error procesando mensajes programados:', error);
    }
  }

  // Limpiar mensajes antiguos (opcional)
  async cleanupOldMessages(): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setMonth(cutoffDate.getMonth() - 6); // 6 meses atrás

      const deletedMessages = await prisma.whatsAppMessage.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate
          },
          status: {
            in: ['SENT', 'DELIVERED', 'READ', 'FAILED']
          }
        }
      });

      console.log(`Limpieza completada: ${deletedMessages.count} mensajes eliminados`);
    } catch (error) {
      console.error('Error en limpieza de mensajes:', error);
    }
  }
}

export default ScheduledTasksService;
