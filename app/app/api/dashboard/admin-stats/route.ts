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

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const todayStart = new Date(`${todayStr}T00:00:00.000Z`);
    const todayEnd = new Date(`${todayStr}T23:59:59.999Z`);

    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const yesterdayEnd = new Date(todayEnd);
    yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);

    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Obtener estadísticas reales de la base de datos (aisladas por tenant)
    const [
      activeLoansCount,
      totalClients,
      paymentsThisMonth,
      paymentsToday,
      paymentsYesterday,
      totalPortfolio,
      pendingApplications,
      recentPayments,
      recentLoans,
      thisMonthClients,
      lastMonthClients,
      thisMonthLoans,
      lastMonthLoans
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
          status: 'COMPLETED',
          paymentDate: { gte: thisMonthStart }
        },
        _sum: { amount: true }
      }),

      // Pagos HOY
      tenantPrisma.payment.aggregate({
        where: {
          status: 'COMPLETED',
          paymentDate: { gte: todayStart, lte: todayEnd }
        },
        _sum: { amount: true }
      }),

      // Pagos AYER
      tenantPrisma.payment.aggregate({
        where: {
          status: 'COMPLETED',
          paymentDate: { gte: yesterdayStart, lte: yesterdayEnd }
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
      }),

      // Clientes este mes
      tenantPrisma.client.count({
        where: { createdAt: { gte: thisMonthStart } }
      }),

      // Clientes mes anterior
      tenantPrisma.client.count({
        where: { createdAt: { gte: lastMonthStart, lte: lastMonthEnd } }
      }),

      // Préstamos este mes
      tenantPrisma.loan.count({
        where: { createdAt: { gte: thisMonthStart } }
      }),

      // Préstamos mes anterior
      tenantPrisma.loan.count({
        where: { createdAt: { gte: lastMonthStart, lte: lastMonthEnd } }
      })
    ]);

    const loanGrowth = lastMonthLoans > 0
      ? Math.round(((thisMonthLoans - lastMonthLoans) / lastMonthLoans) * 100)
      : (thisMonthLoans > 0 ? 100 : 0);

    const clientGrowth = lastMonthClients > 0
      ? Math.round(((thisMonthClients - lastMonthClients) / lastMonthClients) * 100)
      : (thisMonthClients > 0 ? 100 : 0);

    const todayAmount = Number(paymentsToday._sum?.amount || 0);
    const yesterdayAmount = Number(paymentsYesterday._sum?.amount || 0);
    const paymentGrowth = yesterdayAmount > 0
      ? Math.round(((todayAmount - yesterdayAmount) / yesterdayAmount) * 100)
      : (todayAmount > 0 ? 100 : 0);

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
      paymentsToday: todayAmount,
      totalPortfolio: Number(totalPortfolio._sum?.balanceRemaining || 0),
      pendingApplications,
      loanGrowth,
      clientGrowth,
      paymentGrowth,
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
