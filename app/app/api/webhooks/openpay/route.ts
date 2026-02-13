export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { AuditLogger } from '@/lib/audit';
import { WhatsAppNotificationService } from '@/lib/whatsapp-notification';

export async function POST(request: NextRequest) {
  let body: any = {};
  try {
    body = await request.json();

    // Validar que el webhook viene de Openpay
    // En producción, aquí deberías validar la firma del webhook
    const { type, transaction } = body;

    if (!type || !transaction) {
      return NextResponse.json(
        { error: 'Datos del webhook inválidos' },
        { status: 400 }
      );
    }

    // Buscar la transacción en nuestra base de datos
    const paymentTransaction = await prisma.paymentTransaction.findFirst({
      where: {
        providerTransactionId: transaction.id,
        provider: 'OPENPAY',
      },
    });

    if (!paymentTransaction) {
      console.log(`Transacción no encontrada: ${transaction.id}`);
      return NextResponse.json({ status: 'ignored' });
    }

    // Actualizar el estado de la transacción
    let newStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'REFUNDED';

    switch (transaction.status) {
      case 'completed':
        newStatus = 'COMPLETED';
        break;
      case 'cancelled':
        newStatus = 'CANCELLED';
        break;
      case 'failed':
        newStatus = 'FAILED';
        break;
      case 'refunded':
        newStatus = 'REFUNDED';
        break;
      default:
        newStatus = 'PROCESSING';
    }

    const updatedTransaction = await prisma.paymentTransaction.update({
      where: { id: paymentTransaction.id },
      data: {
        status: newStatus,
        webhookData: JSON.stringify(body),
        processedAt: new Date(),
        errorMessage: transaction.error_message || null,
      },
    });

    // Si el pago fue completado exitosamente, actualizar el préstamo
    if (newStatus === 'COMPLETED') {
      const payment = await prisma.payment.findUnique({
        where: { id: paymentTransaction.paymentId },
        include: { loan: true },
      });

      if (payment) {
        // Actualizar el balance del préstamo
        await prisma.loan.update({
          where: { id: payment.loanId },
          data: {
            balanceRemaining: {
              decrement: payment.amount,
            },
          },
        });

        // Actualizar el estado del pago
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'COMPLETED',
            paymentDate: new Date(transaction.operation_date || Date.now()),
          },
        });

        // Enviar notificación por WhatsApp
        try {
          const whatsappService = new WhatsAppNotificationService();
          await whatsappService.sendPaymentReceivedNotification(payment.id);
          console.log(`Notificación WhatsApp enviada para pago ${payment.id}`);
        } catch (whatsappError) {
          // No fallar el webhook si falla WhatsApp, solo loguear el error
          console.error('Error enviando notificación WhatsApp:', whatsappError);

          // Log de auditoría para el error de WhatsApp
          const auditLogger = new AuditLogger(prisma);
          await auditLogger.log({
            action: 'WHATSAPP_NOTIFICATION_ERROR',
            resource: 'Payment',
            resourceId: payment.id,
            details: {
              error: whatsappError instanceof Error ? whatsappError.message : 'Unknown error',
              paymentId: payment.id,
              amount: payment.amount,
            },
            ipAddress: request.headers.get('x-forwarded-for') || 'openpay-webhook',
            userAgent: request.headers.get('user-agent') || 'openpay-webhook',
          });
        }
      }
    }

    // Note: SaaS Subscription events should be handled here by looking up the Invoice
    // via transaction.order_id or transaction.id, since PaymentTransaction is linked to Loan Payments only.

    // Log de auditoría
    const auditLogger = new AuditLogger(prisma);

    await auditLogger.log({
      action: 'WEBHOOK_RECEIVED',
      resource: 'PaymentTransaction',
      resourceId: updatedTransaction.id,
      details: {
        webhookType: type,
        transactionStatus: transaction.status,
        transactionId: transaction.id,
        amount: transaction.amount,
      },
      ipAddress: request.headers.get('x-forwarded-for') || 'openpay-webhook',
      userAgent: request.headers.get('user-agent') || 'openpay-webhook',
    });

    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error('Error processing Openpay webhook:', error);

    // Log de error en auditoría
    try {
      const auditLogger = new AuditLogger(prisma);
      await auditLogger.log({
        action: 'WEBHOOK_ERROR',
        resource: 'PaymentTransaction',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          body: body || {},
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'openpay-webhook',
        userAgent: request.headers.get('user-agent') || 'openpay-webhook',
      });
    } catch (auditError) {
      console.error('Error logging webhook error:', auditError);
    }

    return NextResponse.json(
      { error: 'Error procesando webhook' },
      { status: 500 }
    );
  }
}
