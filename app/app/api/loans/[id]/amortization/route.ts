export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getTenantPrisma } from '@/lib/tenant-db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email || !session?.user?.tenantId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const tenantPrisma = getTenantPrisma(session.user.tenantId);

    const loan = await (tenantPrisma.loan as any).findFirst({
      where: { id: params.id },
      include: { client: true }
    });

    if (!loan) {
      return NextResponse.json({ error: 'Préstamo no encontrado' }, { status: 404 });
    }

    // Verificar permisos para CLIENTE
    if (session.user.role === 'CLIENTE') {
      const clientProfile = await (tenantPrisma.client as any).findFirst({
        where: { userId: session.user.id }
      });

      if (loan.clientId !== clientProfile?.id) {
        return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
      }
    }

    const amortizationSchedule = await (tenantPrisma.amortizationSchedule as any).findMany({
      where: { loanId: params.id },
      include: {
        payment: {
          select: {
            id: true,
            amount: true,
            paymentDate: true,
            paymentMethod: true,
            status: true,
            reference: true
          }
        }
      },
      orderBy: { paymentNumber: 'asc' }
    });

    if (!amortizationSchedule || amortizationSchedule.length === 0) {
      return NextResponse.json({
        amortizationSchedule: [],
        summary: null
      });
    }

    // Calcular resumen
    const summary = {
      totalPayments: amortizationSchedule.length,
      paidPayments: amortizationSchedule.filter((item: any) => item.isPaid).length,
      pendingPayments: amortizationSchedule.filter((item: any) => !item.isPaid).length,
      totalPrincipal: amortizationSchedule.reduce((sum: number, item: any) => sum + parseFloat((item.principalPayment || 0).toString()), 0),
      totalInterest: amortizationSchedule.reduce((sum: number, item: any) => sum + parseFloat((item.interestPayment || 0).toString()), 0),
      paidAmount: amortizationSchedule
        .filter((item: any) => item.isPaid)
        .reduce((sum: number, item: any) => sum + parseFloat((item.totalPayment || 0).toString()), 0),
      pendingAmount: amortizationSchedule
        .filter((item: any) => !item.isPaid)
        .reduce((sum: number, item: any) => sum + parseFloat((item.totalPayment || 0).toString()), 0)
    };

    return NextResponse.json({
      amortizationSchedule,
      summary
    });

  } catch (error) {
    console.error('Error fetching amortization schedule:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
