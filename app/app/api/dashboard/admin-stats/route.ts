
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getTenantPrisma } from '@/lib/tenant-db';

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
      pendingApplications
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

      // Cartera total (suma de saldos pendientes de préstamos activos)
      tenantPrisma.loan.aggregate({
        where: { status: 'ACTIVE' },
        _sum: { balanceRemaining: true }
      }),

      // Solicitudes pendientes
      tenantPrisma.creditApplication.count({
        where: { status: 'PENDING' }
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

    return NextResponse.json({
      activeLoans: activeLoansCount,
      totalClients,
      paymentsThisMonth: Number(paymentsThisMonth._sum?.amount || 0),
      totalPortfolio: Number(totalPortfolio._sum?.balanceRemaining || 0),
      pendingApplications,
      loanGrowth
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas admin:', error);
    return NextResponse.json(
      { error: 'Error al obtener estadísticas' },
      { status: 500 }
    );
  }
}
