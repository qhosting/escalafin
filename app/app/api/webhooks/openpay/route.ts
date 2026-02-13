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

    // Buscar la transacción en nuestra base de datos (Préstamos)
    const paymentTransaction = await prisma.paymentTransaction.findFirst({
      where: {
        providerTransactionId: transaction.id,
        provider: 'OPENPAY',
      },
    });

    // Si es una transacción de Préstamo
    if (paymentTransaction) {

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
            console.error('Error enviando notificación WhatsApp:', whatsappError);
            // Log de auditoría para el error de WhatsApp...
          }
        }
      }

      // Log de auditoría para PaymentTransaction...
      const auditLogger = new AuditLogger(prisma);
      await auditLogger.log({
        action: 'WEBHOOK_RECEIVED',
        resource: 'PaymentTransaction',
        resourceId: updatedTransaction.id,
        details: { webhookType: type, transactionStatus: transaction.status },
        ipAddress: request.headers.get('x-forwarded-for') || 'openpay-webhook',
        userAgent: request.headers.get('user-agent') || 'openpay-webhook',
      });

      return NextResponse.json({ status: 'success' });

    }

    // Si no es préstamo, verificar si es Factura SaaS (Suscripción)
    // Openpay Order ID suele mapear a nuestro ID de Invoice
    if (transaction.order_id) {
      const invoice = await prisma.invoice.findUnique({
        where: { id: transaction.order_id }
      });

      if (invoice) {
        let invoiceStatus: 'PAID' | 'VOID' | 'OPEN' = 'OPEN';
        if (transaction.status === 'completed') invoiceStatus = 'PAID';
        else if (transaction.status === 'failed' || transaction.status === 'cancelled') invoiceStatus = 'VOID';

        // Update Invoice
        await prisma.invoice.update({
          where: { id: invoice.id },
          data: {
            status: invoiceStatus,
            paidAt: invoiceStatus === 'PAID' ? new Date() : null,
            openpayInvoiceId: transaction.id, // Store the distinct transaction ID
            paymentIntent: JSON.stringify(body)
          }
        });

        // If Paid, activate/update subscription
        if (invoiceStatus === 'PAID') {
          // Recuperar Plan desde lineItems (workaround definido en checkout)
          const lineItems = invoice.lineItems ? JSON.parse(invoice.lineItems) : [];
          const planItem = lineItems.find((i: any) => i.planId);

          if (planItem) {
            const newPeriodEnd = new Date();
            newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);

            await prisma.subscription.update({
              where: { id: invoice.subscriptionId },
              data: {
                planId: planItem.planId,
                status: 'ACTIVE',
                currentPeriodStart: new Date(),
                currentPeriodEnd: newPeriodEnd,
                cancelAtPeriodEnd: false
              }
            });
          }
        }

        return NextResponse.json({ status: 'success_saas' });
      }
    }

    // Si no se encuentra ni préstamo ni factura
    console.log(`Transacción no encontrada ni vinculada: ${transaction.id} / Order: ${transaction.order_id}`);
    return NextResponse.json({ status: 'ignored' });


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
