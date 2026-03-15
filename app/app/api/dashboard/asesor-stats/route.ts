
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getTenantPrisma } from '@/lib/tenant-db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== 'ASESOR' && session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const userId = session.user.id;
    const tenantId = session.user.tenantId;
    const tenantPrisma = getTenantPrisma(tenantId);

    // Lógica de visibilidad condicional para asesores
    let clientWhere: any = { tenantId };
    let loanWhere: any = { tenantId, status: 'ACTIVE' };
    let appWhere: any = { tenantId };
    let payWhere: any = {
      tenantId,
      paymentDate: {
        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      }
    };

    if (session.user.role === 'ASESOR') {
      const assignedCount = await tenantPrisma.client.count({
        where: { asesorId: userId }
      });

      if (assignedCount > 0) {
        // Solo ve su propia cartera si ya tiene clientes asignados
        clientWhere.asesorId = userId;
        loanWhere.client = { asesorId: userId };
        appWhere.asesorId = userId;
        payWhere.processedBy = userId; // Meta basada en lo que él ha cobrado
      }
    }

    const [
      myClientsCount,
      assignedPortfolio,
      submittedApplications,
      myLoans
    ] = await Promise.all([
      tenantPrisma.client.count({ where: clientWhere }),
      tenantPrisma.loan.aggregate({
        where: loanWhere,
        _sum: { balanceRemaining: true }
      }),
      tenantPrisma.creditApplication.count({ where: appWhere }),
      tenantPrisma.loan.count({ where: loanWhere })
    ]);

    // Calcular meta mensual
    const paymentsThisMonth = await tenantPrisma.payment.aggregate({
      where: payWhere,
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
