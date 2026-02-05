
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

  // Generar y enviar reporte semanal
  async sendWeeklyReport(adminEmail?: string): Promise<any> {
    try {
      console.log('Generando reporte semanal...');
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 7);

      // 1. Recopilar métricas
      const newLoans = await prisma.loan.count({
        where: { createdAt: { gte: startDate, lte: endDate } }
      });

      const paymentsReceived = await prisma.payment.aggregate({
        where: {
          paymentDate: { gte: startDate, lte: endDate },
          status: 'COMPLETED'
        },
        _sum: { amount: true },
        _count: true
      });

      const activeClients = await prisma.client.count({
        where: { status: 'ACTIVE' }
      });

      const overdueLoans = await prisma.loan.count({
        where: {
          amortizationSchedule: {
            some: {
              isPaid: false,
              paymentDate: { lt: new Date() }
            }
          }
        }
      });

      // 2. Formatear reporte
      const reportData = {
        period: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
        metrics: {
          newLoans,
          totalCollected: paymentsReceived._sum.amount || 0,
          paymentsCount: paymentsReceived._count,
          activeClients,
          overdueLoans
        }
      };

      console.log('Reporte generado:', reportData);

      // 3. Enviar por email (si hay email configurado)
      const targetEmail = adminEmail || process.env.ADMIN_EMAIL;

      if (targetEmail && process.env.SMTP_HOST) {
        // Importación dinámica para evitar errores si no se usa
        const nodemailer = await import('nodemailer');

        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT) || 587,
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        const htmlContent = `
          <h1>📊 Reporte Semanal EscalaFin</h1>
          <p>Periodo: <strong>${reportData.period}</strong></p>
          
          <div style="background: #f4f4f5; padding: 20px; border-radius: 8px;">
            <h3>Resumen Operativo</h3>
            <ul>
              <li>💰 <strong>Cobrado:</strong> $${Number(reportData.metrics.totalCollected).toFixed(2)}</li>
              <li>🧾 <strong>Pagos procesados:</strong> ${reportData.metrics.paymentsCount}</li>
              <li>🆕 <strong>Nuevos préstamos:</strong> ${reportData.metrics.newLoans}</li>
              <li>👥 <strong>Clientes activos:</strong> ${reportData.metrics.activeClients}</li>
              <li>⚠️ <strong>Préstamos con mora:</strong> ${reportData.metrics.overdueLoans}</li>
            </ul>
          </div>
          <p>Generado automáticamente por el sistema.</p>
        `;

        await transporter.sendMail({
          from: process.env.SMTP_FROM || '"EscalaFin System" <no-reply@escalafin.com>',
          to: targetEmail,
          subject: `📊 Reporte Semanal - ${reportData.period}`,
          html: htmlContent,
        });

        console.log(`Email de reporte enviado a ${targetEmail}`);
      } else {
        console.log('⚠️ Envío de email saltado: No hay configuración SMTP o email destino.');
      }

      return reportData;

    } catch (error) {
      console.error('Error generando reporte semanal:', error);
      throw error;
    }
  }
}

export default ScheduledTasksService;
