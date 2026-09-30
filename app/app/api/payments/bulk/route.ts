import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getTenantPrisma } from '@/lib/tenant-db';
import { PaymentMethod } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    const db = tenantId ? getTenantPrisma(tenantId) : prisma;

    const body = await request.json();
    const { payments, paymentMethod = 'CASH', paymentDate, notes = 'Abono masivo' } = body;

    if (!Array.isArray(payments) || payments.length === 0) {
      return NextResponse.json({ error: 'Debes enviar al menos un abono a aplicar' }, { status: 400 });
    }

    const dateToApply = paymentDate ? new Date(`${paymentDate}T12:00:00`) : new Date();
    const batchId = Date.now().toString(36).toUpperCase();

    const results: any[] = [];
    let totalProcessedAmount = 0;
    let successCount = 0;

    for (let i = 0; i < payments.length; i++) {
      const item = payments[i];
      const loanId = item.loanId;
      const amount = parseFloat(item.amount);

      if (!loanId || isNaN(amount) || amount <= 0) {
        results.push({ loanId, success: false, error: 'Monto inválido o préstamo no especificado' });
        continue;
      }

      try {
        const result = await db.$transaction(async (tx) => {
          const loan = await tx.loan.findUnique({
            where: { id: loanId },
            include: {
              client: true,
              amortizationSchedule: {
                where: { isPaid: false },
                orderBy: { paymentNumber: 'asc' },
                take: 1
              }
            }
          });

          if (!loan) {
            throw new Error(`Préstamo ${loanId} no encontrado`);
          }

          const targetSchedule = item.scheduleId
            ? await tx.amortizationSchedule.findUnique({ where: { id: item.scheduleId } })
            : loan.amortizationSchedule[0] || null;

          const refCode = `MAS-${batchId}-${(i + 1).toString().padStart(3, '0')}`;

          // 1. Crear el Pago
          const payment = await tx.payment.create({
            data: {
              loanId: loan.id,
              amortizationScheduleId: targetSchedule?.id || null,
              amount: amount,
              paymentDate: dateToApply,
              paymentMethod: (paymentMethod as PaymentMethod) || PaymentMethod.CASH,
              status: 'COMPLETED',
              reference: refCode,
              notes: `${notes} | Lote: ${batchId}`,
              processedBy: session.user.id,
              tenantId: tenantId || null
            }
          });

          // 2. Si hay cuota de amortización y el abono cubre la cuota o es sustancial, marcar como pagada
          if (targetSchedule && amount >= Number(targetSchedule.totalPayment) * 0.95) {
            await tx.amortizationSchedule.update({
              where: { id: targetSchedule.id },
              data: { isPaid: true }
            });
          }

          // 3. Descontar saldo del préstamo
          const currentBalance = Number(loan.balanceRemaining);
          const newBalance = Math.max(0, currentBalance - amount);
          const isFullyPaid = newBalance <= 0;

          await tx.loan.update({
            where: { id: loan.id },
            data: {
              balanceRemaining: newBalance,
              status: isFullyPaid ? 'PAID_OFF' : loan.status
            }
          });

          return {
            loanId: loan.id,
            loanNumber: loan.loanNumber,
            clientName: `${loan.client.firstName} ${loan.client.lastName}`,
            paymentId: payment.id,
            amount,
            newBalance,
            isFullyPaid,
            scheduleUpdated: !!targetSchedule,
            reference: refCode
          };
        });

        results.push({ success: true, ...result });
        totalProcessedAmount += amount;
        successCount++;
      } catch (err: any) {
        console.error(`Error processing bulk payment for loan ${loanId}:`, err);
        results.push({ loanId, success: false, error: err.message || 'Error al aplicar abono' });
      }
    }

    return NextResponse.json({
      success: true,
      batchId,
      processedCount: successCount,
      totalAmount: totalProcessedAmount,
      totalRequested: payments.length,
      results
    });
  } catch (error: any) {
    console.error('Error in /api/payments/bulk:', error);
    return NextResponse.json({ error: error.message || 'Error del servidor en abono masivo' }, { status: 500 });
  }
}
