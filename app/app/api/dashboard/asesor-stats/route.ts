
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession();
    
    if (!session || session.user.role !== 'ASESOR') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const userId = session.user.id;

    // Obtener estadísticas reales del asesor
    const [
      myClientsCount,
      assignedPortfolio,
      submittedApplications,
      myLoans
    ] = await Promise.all([
      // Mis clientes (clientes creados por este asesor)
      prisma.client.count({
        where: { createdBy: userId }
      }),
      
      // Cartera asignada (suma de préstamos de mis clientes)
      prisma.loan.aggregate({
        where: {
          client: { createdBy: userId },
          status: 'ACTIVE'
        },
        _sum: { amount: true }
      }),
      
      // Solicitudes enviadas
      prisma.creditApplication.count({
        where: { createdBy: userId }
      }),
      
      // Mis préstamos activos
      prisma.loan.count({
        where: {
          client: { createdBy: userId },
          status: 'ACTIVE'
        }
      })
    ]);

    // Calcular meta mensual (basada en pagos recibidos este mes)
    const paymentsThisMonth = await prisma.payment.aggregate({
      where: {
        loan: {
          client: { createdBy: userId }
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
      ? Math.round(((paymentsThisMonth._sum.amount || 0) / monthlyGoal) * 100)
      : 0;

    return NextResponse.json({
      myClients: myClientsCount,
      assignedPortfolio: assignedPortfolio._sum.amount || 0,
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
