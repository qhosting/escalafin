
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const loan = await prisma.loan.findUnique({
      where: { id: params.id },
      include: { client: true }
    });

    if (!loan) {
      return NextResponse.json({ error: 'Préstamo no encontrado' }, { status: 404 });
    }

    // Verificar permisos
    if (user.role === 'ASESOR' && loan.client.asesorId !== user.id) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
    } else if (user.role === 'CLIENTE') {
      const clientProfile = await prisma.client.findFirst({
        where: { userId: user.id }
      });
      
      if (loan.clientId !== clientProfile?.id) {
        return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
      }
    }

    const amortizationSchedule = await prisma.amortizationSchedule.findMany({
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

    // Calcular resumen
    const summary = {
      totalPayments: amortizationSchedule.length,
      paidPayments: amortizationSchedule.filter(item => item.isPaid).length,
      pendingPayments: amortizationSchedule.filter(item => !item.isPaid).length,
      totalPrincipal: amortizationSchedule.reduce((sum, item) => sum + parseFloat(item.principalPayment.toString()), 0),
      totalInterest: amortizationSchedule.reduce((sum, item) => sum + parseFloat(item.interestPayment.toString()), 0),
      paidAmount: amortizationSchedule
        .filter(item => item.isPaid)
        .reduce((sum, item) => sum + parseFloat(item.totalPayment.toString()), 0),
      pendingAmount: amortizationSchedule
        .filter(item => !item.isPaid)
        .reduce((sum, item) => sum + parseFloat(item.totalPayment.toString()), 0)
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
