
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const paymentData = await request.json();

    // Validate required fields
    if (!paymentData.loanId || !paymentData.amount) {
      return NextResponse.json(
        { error: 'ID de préstamo y monto son requeridos' },
        { status: 400 }
      );
    }

    // Verify loan exists
    const loan = await prisma.loan.findUnique({
      where: { id: paymentData.loanId },
      include: { client: true }
    });

    if (!loan) {
      return NextResponse.json(
        { error: 'Préstamo no encontrado' },
        { status: 404 }
      );
    }

    // Check if payment already exists (avoid duplicates)
    const existingPayment = await prisma.payment.findFirst({
      where: {
        loanId: paymentData.loanId,
        amount: paymentData.amount,
        paymentDate: new Date(paymentData.paymentDate),
        paymentMethod: paymentData.paymentMethod || 'CASH'
      }
    });

    if (existingPayment) {
      return NextResponse.json({
        success: true,
        payment: existingPayment,
        action: 'already_exists'
      });
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        loanId: paymentData.loanId,
        amount: parseFloat(paymentData.amount),
        paymentDate: new Date(paymentData.paymentDate || Date.now()),
        paymentMethod: paymentData.paymentMethod || 'CASH',
        status: 'COMPLETED',
        reference: paymentData.transactionId || `OFFLINE_${Date.now()}`,
        notes: paymentData.notes || 'Pago registrado offline'
      }
    });

    // Update loan balance
    await prisma.loan.update({
      where: { id: paymentData.loanId },
      data: {
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      payment,
      action: 'created'
    });

  } catch (error) {
    console.error('Error syncing payment:', error);
    return NextResponse.json(
      { error: 'Error sincronizando pago' },
      { status: 500 }
    );
  }
}
