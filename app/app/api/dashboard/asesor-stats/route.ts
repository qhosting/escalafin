
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getTenantPrisma } from '@/lib/tenant-db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ASESOR') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const userId = session.user.id;
    const tenantId = session.user.tenantId;
    const tenantPrisma = getTenantPrisma(tenantId);

    // Obtener estadísticas reales del asesor (aisladas por tenant)
    const [
      myClientsCount,
      assignedPortfolio,
      submittedApplications,
      myLoans
    ] = await Promise.all([
      // Mis clientes (clientes asignados a este asesor)
      tenantPrisma.client.count({
        where: { asesorId: userId }
      }),

      // Cartera asignada (suma de préstamos de mis clientes)
      tenantPrisma.loan.aggregate({
        where: {
          client: { asesorId: userId },
          status: 'ACTIVE'
        },
        _sum: { balanceRemaining: true }
      }),

      // Solicitudes enviadas (de clientes asignados)
      tenantPrisma.creditApplication.count({
        where: {
          client: { asesorId: userId }
        }
      }),

      // Mis préstamos activos
      tenantPrisma.loan.count({
        where: {
          client: { asesorId: userId },
          status: 'ACTIVE'
        }
      })
    ]);

    // Calcular meta mensual (basada en pagos recibidos este mes)
    const paymentsThisMonth = await tenantPrisma.payment.aggregate({
      where: {
        loan: {
          client: { asesorId: userId }
        },
        paymentDate: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      },
      _sum: { amount: true }
    });

    // Supongamos una meta de $100,000 mensual
    const monthlyGoal = 100000;
    const achievementPercentage = monthlyGoal > 0
      ? Math.round((Number(paymentsThisMonth._sum?.amount || 0) / monthlyGoal) * 100)
      : 0;

    return NextResponse.json({
      myClients: myClientsCount,
      assignedPortfolio: Number(assignedPortfolio._sum?.balanceRemaining || 0),
      submittedApplications,
      monthlyGoalPercentage: achievementPercentage,
      activeLoans: myLoans
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas asesor:', error);
    return NextResponse.json(
      { error: 'Error al obtener estadísticas' },
      { status: 500 }
    );
  }
}
