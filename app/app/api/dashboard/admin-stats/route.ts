
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession();
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener estadísticas reales de la base de datos
    const [
      activeLoansCount,
      totalClients,
      paymentsThisMonth,
      totalPortfolio,
      pendingApplications
    ] = await Promise.all([
      // Préstamos activos
      prisma.loan.count({
        where: { status: 'ACTIVE' }
      }),
      
      // Total de clientes
      prisma.client.count(),
      
      // Pagos este mes
      prisma.payment.aggregate({
        where: {
          paymentDate: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        },
        _sum: { amount: true }
      }),
      
      // Cartera total (suma de saldos pendientes de préstamos activos)
      prisma.loan.aggregate({
        where: { status: 'ACTIVE' },
        _sum: { amount: true }
      }),
      
      // Solicitudes pendientes
      prisma.creditApplication.count({
        where: { status: 'PENDING' }
      })
    ]);

    // Calcular préstamos del mes anterior para comparación
    const lastMonthStart = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
    const lastMonthEnd = new Date(new Date().getFullYear(), new Date().getMonth(), 0);
    
    const lastMonthLoans = await prisma.loan.count({
      where: {
        createdAt: {
          gte: lastMonthStart,
          lte: lastMonthEnd
        }
      }
    });

    const thisMonthLoans = await prisma.loan.count({
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
      paymentsThisMonth: paymentsThisMonth._sum.amount || 0,
      totalPortfolio: totalPortfolio._sum.amount || 0,
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
