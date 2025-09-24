
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import WhatsAppNotificationService from '@/lib/whatsapp-notification';
import crypto from 'crypto';

interface OpenpayWebhookData {
  type: string;
  event_date: string;
  verification_code?: string;
  transaction: {
    id: string;
    amount: number;
    authorization?: string;
    operation_type: string;
    transaction_type: string;
    status: string;
    currency: string;
    creation_date: string;
    operation_date?: string;
    description: string;
    error_message?: string;
    order_id?: string;
    card?: any;
    customer?: {
      name: string;
      email: string;
      phone_number?: string;
    };
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const webhook: OpenpayWebhookData = JSON.parse(body);

    // Log the webhook for debugging
    console.log('Openpay Webhook received:', JSON.stringify(webhook, null, 2));

    // Verify webhook signature if configured
    const signature = request.headers.get('x-openpay-signature');
    if (process.env.OPENPAY_WEBHOOK_SECRET && signature) {
      const expectedSignature = crypto
        .createHmac('sha256', process.env.OPENPAY_WEBHOOK_SECRET)
        .update(body)
        .digest('hex');

      if (signature !== expectedSignature) {
        console.error('Invalid webhook signature');
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      }
    }

    const { transaction, type } = webhook;

    // Process different webhook events
    switch (type) {
      case 'charge.succeeded':
        await handleChargeSucceeded(transaction);
        break;
      
      case 'charge.failed':
        await handleChargeFailed(transaction);
        break;
      
      case 'charge.cancelled':
        await handleChargeCancelled(transaction);
        break;
      
      case 'transfer.succeeded':
        await handleTransferSucceeded(transaction);
        break;
      
      default:
        console.log(`Unhandled webhook type: ${type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Error processing Openpay webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleChargeSucceeded(transaction: any) {
  try {
    // Find the payment by reference or transaction record
    const payment = await prisma.payment.findFirst({
      where: {
        reference: transaction.order_id || transaction.id
      },
      include: {
        loan: {
          include: {
            client: true
          }
        },
        transactions: true
      }
    });

    if (!payment) {
      console.error(`Payment not found for transaction ${transaction.id}`);
      return;
    }

    // Update payment status
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'COMPLETED',
        notes: `Openpay transaction: ${transaction.id}`
      }
    });

    // Update transaction record
    await prisma.paymentTransaction.updateMany({
      where: { paymentId: payment.id },
      data: {
        status: 'COMPLETED',
        providerTransactionId: transaction.id,
        providerResponse: JSON.stringify(transaction),
        processedAt: new Date()
      }
    });

    // Get current loan info
    const currentLoan = await prisma.loan.findUnique({
      where: { id: payment.loanId }
    });

    if (currentLoan) {
      const newBalance = Number(currentLoan.balanceRemaining) - Number(payment.amount);
      const isFullyPaid = newBalance <= 0;

      // Update loan balance
      await prisma.loan.update({
        where: { id: payment.loanId },
        data: {
          balanceRemaining: Math.max(0, newBalance),
          status: isFullyPaid ? 'PAID_OFF' : 'ACTIVE'
        }
      });
    }

    // Send WhatsApp notification
    const whatsappService = new WhatsAppNotificationService();
    await whatsappService.sendPaymentReceivedNotification(payment.id);

    console.log(`Payment ${payment.id} completed successfully`);

  } catch (error) {
    console.error('Error handling charge succeeded:', error);
  }
}

async function handleChargeFailed(transaction: any) {
  try {
    // Find and update payment
    const payment = await prisma.payment.findFirst({
      where: {
        reference: transaction.order_id || transaction.id
      }
    });

    if (payment) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'FAILED',
          notes: `Failed Openpay transaction: ${transaction.id} - ${transaction.error_message}`
        }
      });

      // Update transaction record
      await prisma.paymentTransaction.updateMany({
        where: { paymentId: payment.id },
        data: {
          status: 'FAILED',
          providerTransactionId: transaction.id,
          errorMessage: transaction.error_message,
          providerResponse: JSON.stringify(transaction),
          processedAt: new Date()
        }
      });

      console.log(`Payment ${payment.id} failed: ${transaction.error_message}`);
    }

  } catch (error) {
    console.error('Error handling charge failed:', error);
  }
}

async function handleChargeCancelled(transaction: any) {
  try {
    // Find and update payment
    const payment = await prisma.payment.findFirst({
      where: {
        reference: transaction.order_id || transaction.id
      }
    });

    if (payment) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'CANCELLED',
          notes: `Cancelled Openpay transaction: ${transaction.id}`
        }
      });

      // Update transaction record
      await prisma.paymentTransaction.updateMany({
        where: { paymentId: payment.id },
        data: {
          status: 'CANCELLED',
          providerTransactionId: transaction.id,
          providerResponse: JSON.stringify(transaction),
          processedAt: new Date()
        }
      });

      console.log(`Payment ${payment.id} cancelled`);
    }

  } catch (error) {
    console.error('Error handling charge cancelled:', error);
  }
}

async function handleTransferSucceeded(transaction: any) {
  try {
    // Handle SPEI transfers or other transfer types
    console.log(`Transfer succeeded: ${transaction.id}`);
    
    // Similar logic to charge succeeded but for transfers
    await handleChargeSucceeded(transaction);

  } catch (error) {
    console.error('Error handling transfer succeeded:', error);
  }
}

// GET method for webhook verification (some providers require this)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const challenge = searchParams.get('challenge');
  
  if (challenge) {
    return new Response(challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
  
  return NextResponse.json({ 
    message: 'Openpay webhook endpoint',
    timestamp: new Date().toISOString()
  });
}
