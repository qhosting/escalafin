
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { getOpenpayClient } from '@/lib/openpay';
import { AuditLogger } from '@/lib/audit';
import { extractRequestInfo } from '@/lib/audit';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      amount,
      description,
      customerName,
      customerLastName,
      customerEmail,
      customerPhone,
      paymentMethod,
      loanId,
      paymentId,
    } = body;

    if (!amount || !customerName || !customerEmail) {
      return NextResponse.json(
        { error: 'Datos requeridos: amount, customerName, customerEmail' },
        { status: 400 }
      );
    }

    const openpayClient = getOpenpayClient();

    // Crear el cargo en Openpay
    const chargeData = {
      method: paymentMethod,
      amount: parseFloat(amount),
      currency: 'MXN',
      description: description || 'Pago de préstamo',
      customer: {
        name: customerName,
        last_name: customerLastName,
        email: customerEmail,
        phone_number: customerPhone,
      },
      redirect_url: `${process.env.NEXTAUTH_URL}/dashboard/payments/success`,
    };

    const result = await openpayClient.createCharge(chargeData);

    // Crear registro de transacción en la base de datos
    const transaction = await prisma.paymentTransaction.create({
      data: {
        paymentId: paymentId || 'temp', // Se actualizará cuando se cree el pago
        provider: 'OPENPAY',
        providerTransactionId: result.id,
        amount: result.amount,
        currency: 'MXN',
        status: result.status === 'completed' ? 'COMPLETED' : 
                result.status === 'charge_pending' ? 'PENDING' : 
                result.status === 'failed' ? 'FAILED' : 'PROCESSING',
        providerResponse: JSON.stringify(result),
      },
    });

    // Si es un pago exitoso, actualizar el estado del préstamo/pago
    if (result.status === 'completed' && loanId) {
      // Aquí se puede agregar lógica para actualizar el saldo del préstamo
      // y crear el registro de pago en la tabla Payment
    }

    // Log de auditoría
    const auditLogger = new AuditLogger(prisma);
    const requestInfo = extractRequestInfo(request);
    await auditLogger.log({
      userId: session.user.id,
      userEmail: session.user.email,
      action: 'PAYMENT_CREATE',
      resource: 'PaymentTransaction',
      resourceId: transaction.id,
      details: {
        amount: result.amount,
        method: paymentMethod,
        status: result.status,
        openpayId: result.id,
      },
      ...requestInfo,
    });

    return NextResponse.json({
      id: result.id,
      status: result.status,
      amount: result.amount,
      method: result.method,
      authorization: result.authorization,
      payment_url: result.payment_url,
      error_message: result.error_message,
      transactionId: transaction.id,
    });
  } catch (error) {
    console.error('Error processing Openpay payment:', error);
    
    // Log de auditoría para errores
    try {
      const requestBody = await request.clone().json();
      const auditLogger = new AuditLogger(prisma);
      const requestInfo = extractRequestInfo(request);
      const session = await getServerSession(authOptions);
      
      await auditLogger.log({
        userId: session?.user.id,
        userEmail: session?.user.email,
        action: 'PAYMENT_CREATE',
        resource: 'PaymentTransaction',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          amount: requestBody?.amount,
        },
        ...requestInfo,
      });
    } catch (auditError) {
      console.error('Error logging audit:', auditError);
    }

    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Error al procesar el pago con Openpay'
      },
      { status: 500 }
    );
  }
}
