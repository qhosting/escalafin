
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getTenantPrisma } from '@/lib/tenant-db';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    const tenantPrisma = getTenantPrisma(tenantId);
    const paymentData = await request.json();

    // Validate required fields
    if (!paymentData.loanId || !paymentData.amount) {
      return NextResponse.json(
        { error: 'ID de préstamo y monto son requeridos' },
        { status: 400 }
      );
    }

    // Verify loan exists (in tenant)
    const loan = await tenantPrisma.loan.findUnique({
      where: { id: paymentData.loanId },
      include: { client: true }
    });

    if (!loan) {
      return NextResponse.json(
        { error: 'Préstamo no encontrado en esta organización' },
        { status: 404 }
      );
    }

    // Check if payment already exists (avoid duplicates)
    const existingPayment = await tenantPrisma.payment.findFirst({
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
    const payment = await tenantPrisma.payment.create({
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
    await tenantPrisma.loan.update({
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
