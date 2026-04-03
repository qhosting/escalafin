
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getTenantPrisma } from '@/lib/tenant-db';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'CLIENTE') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const userId = session.user.id;
    const tenantId = session.user.tenantId;
    const tenantPrisma = getTenantPrisma(tenantId);

    // Buscar el cliente asociado a este usuario (aislado por tenant)
    const client = await tenantPrisma.client.findUnique({
      where: { userId }
    });

    if (!client) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    // Obtener branding corporativo del Dueño (Tenant)
    const tenantInfo = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true, logo: true, primaryColor: true }
    });

    // Obtener préstamos activos del cliente
    const activeLoans = await tenantPrisma.loan.findMany({
      where: {
        clientId: client.id,
        status: 'ACTIVE'
      },
      select: {
        id: true,
        loanNumber: true,
        principalAmount: true,
        interestRate: true,
        termMonths: true,
        monthlyPayment: true,
        balanceRemaining: true,
        status: true,
        createdAt: true,
        startDate: true,
        endDate: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Obtener pagos recientes
    const recentPayments = await tenantPrisma.payment.findMany({
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
        reference: true,
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
    const creditApplications = await tenantPrisma.creditApplication.findMany({
      where: {
        clientId: client.id
      },
      select: {
        id: true,
        requestedAmount: true,
        status: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });

    // Obtener penalizaciones pendientes
    const pendingPenalties = await tenantPrisma.lateFeePenalty.findMany({
      where: {
        loan: { clientId: client.id },
        status: 'PENDING'
      },
      select: {
        id: true,
        amount: true,
        loanId: true
      }
    });

    const totalPenalties = pendingPenalties.reduce((sum: number, p: any) => sum + Number(p.amount), 0);

    // Calcular totales (convertir Decimal a número)
    const totalDebt = activeLoans.reduce((sum, loan) => sum + Number(loan.balanceRemaining || 0), 0) + totalPenalties;
    const totalMonthlyPayment = activeLoans.reduce((sum, loan) => sum + Number(loan.monthlyPayment || 0), 0);

    // Calcular próximo pago (basado en el inicio del préstamo y la fecha actual)
    const now = new Date();
    const nextPayment = activeLoans.length > 0 ? (() => {
      // Encontrar el préstamo con el próximo pago más cercano
      const loanWithNextPayment = activeLoans[0]; // Por ahora, usar el primer préstamo
      const startDate = new Date(loanWithNextPayment.startDate);
      const monthsSinceStart = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
      const nextPaymentDate = new Date(startDate);
      nextPaymentDate.setMonth(nextPaymentDate.getMonth() + monthsSinceStart + 1);

      // Sumar penalizaciones de este préstamo específico al pago sugerido si se desea, 
      // pero por ahora lo mantendremos separado o informativo.
      const loanPenalties = pendingPenalties
        .filter((p: any) => p.loanId === loanWithNextPayment.id)
        .reduce((sum: number, p: any) => sum + Number(p.amount), 0);

      return {
        amount: Number(loanWithNextPayment.monthlyPayment || 0) + loanPenalties,
        date: nextPaymentDate.toISOString(),
        loanNumber: loanWithNextPayment.loanNumber,
        penaltyAmount: loanPenalties
      };
    })() : null;

    return NextResponse.json({
      activeLoans: activeLoans.map(loan => {
        const loanPenalties = pendingPenalties
          .filter((p: any) => p.loanId === loan.id)
          .reduce((sum: number, p: any) => sum + Number(p.amount), 0);
          
        return {
          id: loan.loanNumber,
          type: 'Préstamo Personal',
          originalAmount: Number(loan.principalAmount),
          remainingBalance: Number(loan.balanceRemaining || 0),
          monthlyPayment: Number(loan.monthlyPayment || 0),
          penaltyBalance: loanPenalties,
          nextPaymentDate: nextPayment?.date,
          status: loan.status.toLowerCase()
        };
      }),
      recentPayments: recentPayments.map(payment => ({
        date: payment.paymentDate.toISOString(),
        amount: Number(payment.amount),
        status: payment.status.toLowerCase(),
        reference: payment.reference || `TRX-${payment.id}`
      })),
      creditApplications: creditApplications.map(app => ({
        id: app.id,
        amount: Number(app.requestedAmount),
        status: app.status.toLowerCase(),
        createdAt: app.createdAt.toISOString()
      })),
      summary: {
        totalDebt,
        totalMonthlyPayment,
        totalPenalties,
        activeLoansCount: activeLoans.length,
        nextPayment
      },
      tenant: tenantInfo ? {
        name: tenantInfo.name,
        logo: tenantInfo.logo,
        primaryColor: tenantInfo.primaryColor
      } : null
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas cliente:', error);
    return NextResponse.json(
      { error: 'Error al obtener estadísticas' },
      { status: 500 }
    );
  }
}
