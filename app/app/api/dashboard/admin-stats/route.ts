
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getTenantPrisma } from '@/lib/tenant-db';
 
export const dynamic = 'force-dynamic';


export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    const tenantPrisma = getTenantPrisma(tenantId);

    // Obtener estadísticas reales de la base de datos (aisladas por tenant)
    const [
      activeLoansCount,
      totalClients,
      paymentsThisMonth,
      totalPortfolio,
      pendingApplications,
      recentPayments,
      recentLoans
    ] = await Promise.all([
      // Préstamos activos
      tenantPrisma.loan.count({
        where: { status: 'ACTIVE' }
      }),

      // Total de clientes
      tenantPrisma.client.count(),

      // Pagos este mes
      tenantPrisma.payment.aggregate({
        where: {
          paymentDate: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        },
        _sum: { amount: true }
      }),

      // Cartera total (suma de saldos pendientes de préstamos activos y en mora)
      tenantPrisma.loan.aggregate({
        where: { status: { in: ['ACTIVE', 'DEFAULTED'] } },
        _sum: { balanceRemaining: true }
      }),

      // Solicitudes pendientes
      tenantPrisma.creditApplication.count({
        where: { status: 'PENDING' }
      }),

      // Actividades recientes (pagos)
      tenantPrisma.payment.findMany({
        take: 3,
        orderBy: { createdAt: 'desc' },
        include: {
          loan: {
            include: { client: { select: { firstName: true, lastName: true } } }
          }
        }
      }),

      // Actividades recientes (préstamos)
      tenantPrisma.loan.findMany({
        take: 2,
        orderBy: { createdAt: 'desc' },
        include: { client: { select: { firstName: true, lastName: true } } }
      })
    ]);

    // Calcular préstamos del mes anterior para comparación
    const lastMonthStart = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
    const lastMonthEnd = new Date(new Date().getFullYear(), new Date().getMonth(), 0);

    const lastMonthLoans = await tenantPrisma.loan.count({
      where: {
        createdAt: {
          gte: lastMonthStart,
          lte: lastMonthEnd
        }
      }
    });

    const thisMonthLoans = await tenantPrisma.loan.count({
      where: {
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      }
    });

    const loanGrowth = lastMonthLoans > 0
      ? Math.round(((thisMonthLoans - lastMonthLoans) / lastMonthLoans) * 100)
      : 0;

    const recentActivities = [
      ...recentPayments.map(p => ({
        action: 'Pago procesado',
        details: `$${Number(p.amount).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} - Cliente: ${p.loan?.client?.firstName || ''} ${p.loan?.client?.lastName || ''}`,
        time: p.createdAt.toISOString(),
        status: 'success',
        moduleKey: 'payment_history'
      })),
      ...recentLoans.map(l => ({
        action: 'Nuevo préstamo creado',
        details: `$${Number(l.principalAmount).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} - Cliente: ${l.client?.firstName || ''} ${l.client?.lastName || ''}`,
        time: l.createdAt.toISOString(),
        status: 'info',
        moduleKey: 'loan_create'
      }))
    ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 5);

    return NextResponse.json({
      activeLoans: activeLoansCount,
      totalClients,
      paymentsThisMonth: Number(paymentsThisMonth._sum?.amount || 0),
      totalPortfolio: Number(totalPortfolio._sum?.balanceRemaining || 0),
      pendingApplications,
      loanGrowth,
      recentActivities
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas admin:', error);
    return NextResponse.json(
      { error: 'Error al obtener estadísticas' },
      { status: 500 }
    );
  }
}
