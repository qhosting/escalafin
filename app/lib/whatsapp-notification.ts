
import { PrismaClient } from '@prisma/client';
import WahaService from './waha';

const prisma = new PrismaClient();

interface NotificationOptions {
  scheduleFor?: Date;
  skipIfDisabled?: boolean;
  includeMedia?: boolean;
  mediaUrl?: string;
}

export class WhatsAppNotificationService {
  private wahaService: WahaService;

  constructor() {
    this.wahaService = new WahaService();
  }

  async sendPaymentReceivedNotification(
    paymentId: string,
    options: NotificationOptions = {}
  ): Promise<void> {
    try {
      // Obtener información del pago
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
          loan: {
            include: {
              client: true
            }
          }
        }
      });

      if (!payment || !payment.loan) {
        throw new Error('Pago o préstamo no encontrado');
      }

      const { loan } = payment;
      const client = loan.client;

      // Verificar si el cliente tiene habilitadas las notificaciones
      if (options.skipIfDisabled !== false && !client.whatsappNotificationsEnabled) {
        console.log(`Cliente ${client.id} tiene notificaciones WhatsApp deshabilitadas`);
        return;
      }

      if (!client.whatsappPaymentReceived) {
        console.log(`Cliente ${client.id} tiene notificaciones de pago recibido deshabilitadas`);
        return;
      }

      // Generar mensaje
      const message = WahaService.generatePaymentReceivedMessage(
        `${client.firstName} ${client.lastName}`,
        Number(payment.amount),
        loan.loanNumber,
        payment.paymentDate
      );

      // Enviar mensaje
      await this.wahaService.sendTextMessage(
        client.id,
        client.phone,
        message,
        'PAYMENT_RECEIVED',
        payment.id,
        loan.id
      );

      console.log(`Notificación de pago recibido enviada a ${client.phone}`);
    } catch (error) {
      console.error('Error enviando notificación de pago recibido:', error);
      throw error;
    }
  }

  async sendPaymentReminderNotification(
    loanId: string,
    options: NotificationOptions = {}
  ): Promise<void> {
    try {
      // Obtener información del préstamo y el próximo pago
      const loan = await prisma.loan.findUnique({
        where: { id: loanId },
        include: {
          client: true,
          amortizationSchedule: {
            where: {
              isPaid: false
            },
            orderBy: {
              paymentDate: 'asc'
            },
            take: 1
          }
        }
      });

      if (!loan || !loan.amortizationSchedule.length) {
        throw new Error('Préstamo o cronograma de pagos no encontrado');
      }

      const client = loan.client;
      const nextPayment = loan.amortizationSchedule[0];

      // Verificar configuraciones
      if (options.skipIfDisabled !== false && !client.whatsappNotificationsEnabled) {
        console.log(`Cliente ${client.id} tiene notificaciones WhatsApp deshabilitadas`);
        return;
      }

      if (!client.whatsappPaymentReminder) {
        console.log(`Cliente ${client.id} tiene recordatorios de pago deshabilitados`);
        return;
      }

      // Calcular días de vencimiento
      const today = new Date();
      const dueDate = new Date(nextPayment.paymentDate);
      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const daysOverdue = diffDays < 0 ? Math.abs(diffDays) : 0;

      // Generar mensaje
      const message = WahaService.generatePaymentReminderMessage(
        `${client.firstName} ${client.lastName}`,
        Number(nextPayment.totalPayment),
        loan.loanNumber,
        dueDate,
        daysOverdue
      );

      // Enviar mensaje
      await this.wahaService.sendTextMessage(
        client.id,
        client.phone,
        message,
        'PAYMENT_REMINDER',
        undefined,
        loan.id
      );

      console.log(`Recordatorio de pago enviado a ${client.phone}`);
    } catch (error) {
      console.error('Error enviando recordatorio de pago:', error);
      throw error;
    }
  }

  async sendLoanApprovedNotification(
    loanId: string,
    options: NotificationOptions = {}
  ): Promise<void> {
    try {
      const loan = await prisma.loan.findUnique({
        where: { id: loanId },
        include: {
          client: true
        }
      });

      if (!loan) {
        throw new Error('Préstamo no encontrado');
      }

      const client = loan.client;

      // Verificar configuraciones
      if (options.skipIfDisabled !== false && !client.whatsappNotificationsEnabled) {
        return;
      }

      if (!client.whatsappLoanUpdates) {
        return;
      }

      // Generar mensaje
      const message = WahaService.generateLoanApprovedMessage(
        `${client.firstName} ${client.lastName}`,
        Number(loan.principalAmount),
        loan.loanNumber,
        Number(loan.monthlyPayment),
        loan.termMonths
      );

      // Enviar mensaje
      await this.wahaService.sendTextMessage(
        client.id,
        client.phone,
        message,
        'LOAN_APPROVED',
        undefined,
        loan.id
      );

      console.log(`Notificación de préstamo aprobado enviada a ${client.phone}`);
    } catch (error) {
      console.error('Error enviando notificación de préstamo aprobado:', error);
      throw error;
    }
  }

  async sendCustomMessage(
    clientId: string,
    message: string,
    messageType: 'MARKETING' | 'CUSTOM' = 'CUSTOM',
    options: NotificationOptions = {}
  ): Promise<void> {
    try {
      const client = await prisma.client.findUnique({
        where: { id: clientId }
      });

      if (!client) {
        throw new Error('Cliente no encontrado');
      }

      // Verificar configuraciones para marketing
      if (messageType === 'MARKETING' && !client.whatsappMarketingMessages) {
        console.log(`Cliente ${client.id} tiene mensajes de marketing deshabilitados`);
        return;
      }

      // Enviar mensaje
      if (options.includeMedia && options.mediaUrl) {
        await this.wahaService.sendMediaMessage(
          clientId,
          client.phone,
          options.mediaUrl,
          message,
          messageType
        );
      } else {
        await this.wahaService.sendTextMessage(
          clientId,
          client.phone,
          message,
          messageType
        );
      }

      console.log(`Mensaje personalizado enviado a ${client.phone}`);
    } catch (error) {
      console.error('Error enviando mensaje personalizado:', error);
      throw error;
    }
  }

  // Método para procesar mensajes programados
  async processScheduledMessages(): Promise<void> {
    try {
      const scheduledMessages = await prisma.whatsAppMessage.findMany({
        where: {
          status: 'PENDING',
          scheduledFor: {
            lte: new Date()
          }
        },
        include: {
          client: true
        }
      });

      for (const message of scheduledMessages) {
        try {
          if (message.mediaUrl) {
            await this.wahaService.sendMediaMessage(
              message.clientId,
              message.client.phone,
              message.mediaUrl,
              message.message,
              message.messageType
            );
          } else {
            await this.wahaService.sendTextMessage(
              message.clientId,
              message.client.phone,
              message.message,
              message.messageType,
              message.paymentId || undefined,
              message.loanId || undefined
            );
          }
        } catch (error) {
          console.error(`Error enviando mensaje programado ${message.id}:`, error);
        }
      }
    } catch (error) {
      console.error('Error procesando mensajes programados:', error);
    }
  }
}

export default WhatsAppNotificationService;
