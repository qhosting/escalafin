
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession();
    
    if (!session || session.user.role !== 'CLIENTE') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const userId = session.user.id;

    // Buscar el cliente asociado a este usuario
    const client = await prisma.client.findUnique({
      where: { userId }
    });

    if (!client) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    // Obtener préstamos activos del cliente
    const activeLoans = await prisma.loan.findMany({
      where: {
        clientId: client.id,
        status: 'ACTIVE'
      },
      select: {
        id: true,
        loanNumber: true,
        amount: true,
        interestRate: true,
        term: true,
        monthlyPayment: true,
        outstandingBalance: true,
        nextPaymentDate: true,
        status: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Obtener pagos recientes
    const recentPayments = await prisma.payment.findMany({
      where: {
        loan: {
          clientId: client.id
        }
      },
      select: {
        id: true,
        amount: true,
        paymentDate: true,
        status: true,
        transactionReference: true,
        loan: {
          select: {
            loanNumber: true
          }
        }
      },
      orderBy: {
        paymentDate: 'desc'
      },
      take: 5
    });

    // Obtener solicitudes de crédito
    const creditApplications = await prisma.creditApplication.findMany({
      where: {
        client: {
          userId
        }
      },
      select: {
        id: true,
        applicationNumber: true,
        requestedAmount: true,
        status: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });

    // Calcular totales
    const totalDebt = activeLoans.reduce((sum, loan) => sum + (loan.outstandingBalance || 0), 0);
    const totalMonthlyPayment = activeLoans.reduce((sum, loan) => sum + (loan.monthlyPayment || 0), 0);

    // Obtener próximo pago
    const nextPayment = activeLoans.length > 0
      ? activeLoans.reduce((earliest, loan) => {
          if (!earliest || (loan.nextPaymentDate && loan.nextPaymentDate < earliest.nextPaymentDate)) {
            return loan;
          }
          return earliest;
        })
      : null;

    return NextResponse.json({
      activeLoans: activeLoans.map(loan => ({
        id: loan.loanNumber,
        type: 'Préstamo Personal',
        originalAmount: loan.amount,
        remainingBalance: loan.outstandingBalance || 0,
        monthlyPayment: loan.monthlyPayment || 0,
        nextPaymentDate: loan.nextPaymentDate?.toISOString(),
        status: loan.status.toLowerCase()
      })),
      recentPayments: recentPayments.map(payment => ({
        date: payment.paymentDate.toISOString(),
        amount: payment.amount,
        status: payment.status.toLowerCase(),
        reference: payment.transactionReference || `TRX-${payment.id}`
      })),
      creditApplications: creditApplications.map(app => ({
        id: app.applicationNumber,
        amount: app.requestedAmount,
        status: app.status.toLowerCase(),
        createdAt: app.createdAt.toISOString()
      })),
      summary: {
        totalDebt,
        totalMonthlyPayment,
        activeLoansCount: activeLoans.length,
        nextPayment: nextPayment ? {
          amount: nextPayment.monthlyPayment || 0,
          date: nextPayment.nextPaymentDate?.toISOString(),
          loanNumber: nextPayment.loanNumber
        } : null
      }
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas cliente:', error);
    return NextResponse.json(
      { error: 'Error al obtener estadísticas' },
      { status: 500 }
    );
  }
}
