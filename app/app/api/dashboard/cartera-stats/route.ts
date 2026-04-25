export const dynamic = 'force-dynamic';

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

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay()); // Inicio de semana (domingo)
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    // ────────────────────────────────────────────────────────────
    // Queries paralelas
    // ────────────────────────────────────────────────────────────
    const [
      activeLoans,
      totalPrincipalColocado,
      totalCarteraPendiente,
      totalPagadoHoy,
      totalEsperadoEstaSemana,
      totalCobradoEstaSemana,
      loansMora,
      topDeudores,
      proximosPagos7dias,
      loansCompletados,
    ] = await Promise.all([
      // Préstamos ACTIVE
      (tenantPrisma.loan as any).count({ where: { status: 'ACTIVE' } }),

      // Capital total colocado (suma de principalAmount de todos los préstamos)
      (tenantPrisma.loan as any).aggregate({
        _sum: { principalAmount: true }
      }),

      // Cartera pendiente (saldo vivo)
      (tenantPrisma.loan as any).aggregate({
        where: { status: { in: ['ACTIVE', 'DEFAULTED'] } },
        _sum: { balanceRemaining: true }
      }),

      // Cobrado HOY
      (tenantPrisma.payment as any).aggregate({
        where: {
          status: 'COMPLETED',
          paymentDate: {
            gte: new Date(todayStr + 'T00:00:00.000Z'),
            lte: new Date(todayStr + 'T23:59:59.999Z'),
          }
        },
        _sum: { amount: true }
      }),

      // Cuotas esperadas esta semana (amortización)
      (tenantPrisma as any).amortizationSchedule.aggregate({
        where: {
          isPaid: false,
          paymentDate: { gte: weekStart, lte: weekEnd }
        },
        _sum: { totalPayment: true }
      }),

      // Cobrado esta semana
      (tenantPrisma.payment as any).aggregate({
        where: {
          status: 'COMPLETED',
          paymentDate: { gte: weekStart, lte: weekEnd }
        },
        _sum: { amount: true }
      }),

      // Préstamos en mora (más de 7 días de atraso)
      (tenantPrisma.loan as any).findMany({
        where: { status: 'ACTIVE' },
        include: {
          client: { select: { firstName: true, lastName: true, phone: true } },
          amortizationSchedule: {
            where: {
              isPaid: false,
              paymentDate: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
            },
            orderBy: { paymentDate: 'asc' },
            take: 1
          }
        }
      }),

      // Top 5 mayores saldos pendientes
      (tenantPrisma.loan as any).findMany({
        where: { status: { in: ['ACTIVE', 'DEFAULTED'] } },
        orderBy: { balanceRemaining: 'desc' },
        take: 5,
        include: {
          client: { select: { firstName: true, lastName: true, phone: true } }
        }
      }),

      // Próximos pagos en 7 días
      (tenantPrisma as any).amortizationSchedule.findMany({
        where: {
          isPaid: false,
          paymentDate: {
            gte: today,
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          }
        },
        include: {
          loan: {
            include: {
              client: { select: { firstName: true, lastName: true, phone: true } }
            }
          }
        },
        orderBy: { paymentDate: 'asc' },
        take: 10
      }),

      // Préstamos completados (PAID)
      (tenantPrisma.loan as any).count({ where: { status: 'PAID' } }),
    ]);

    // ────────────────────────────────────────────────────────────
    // Calcular mora real
    // ────────────────────────────────────────────────────────────
    const loansMoraFiltrados = loansMora.filter((l: any) => l.amortizationSchedule.length > 0);
    const totalCarteraMora = loansMoraFiltrados.reduce(
      (sum: number, l: any) => sum + Number(l.balanceRemaining),
      0
    );

    const totalColocado = Number(totalPrincipalColocado._sum?.principalAmount || 0);
    const totalPendiente = Number(totalCarteraPendiente._sum?.balanceRemaining || 0);
    const tasaMorosidad = totalPendiente > 0
      ? (totalCarteraMora / totalPendiente) * 100
      : 0;

    const esperadoSemana = Number(totalEsperadoEstaSemana._sum?.totalPayment || 0);
    const cobradoSemana = Number(totalCobradoEstaSemana._sum?.amount || 0);
    const eficienciaSemanal = esperadoSemana > 0
      ? (cobradoSemana / esperadoSemana) * 100
      : 0;

    return NextResponse.json({
      resumen: {
        activeLoans,
        loansCompletados,
        loansMora: loansMoraFiltrados.length,
        totalColocado,
        totalPendiente,
        tasaMorosidad: parseFloat(tasaMorosidad.toFixed(2)),
      },
      flujoCaja: {
        cobradoHoy: Number(totalPagadoHoy._sum?.amount || 0),
        esperadoEstaSemana: esperadoSemana,
        cobradoEstaSemana: cobradoSemana,
        eficienciaSemanal: parseFloat(eficienciaSemanal.toFixed(2)),
      },
      topDeudores: topDeudores.map((l: any) => ({
        loanId: l.id,
        loanNumber: l.loanNumber,
        clientName: `${l.client.firstName} ${l.client.lastName}`,
        phone: l.client.phone,
        balanceRemaining: Number(l.balanceRemaining),
        principalAmount: Number(l.principalAmount),
      })),
      proximosPagos: proximosPagos7dias.map((a: any) => ({
        scheduleId: a.id,
        loanId: a.loanId,
        loanNumber: a.loan?.loanNumber,
        clientName: `${a.loan?.client?.firstName} ${a.loan?.client?.lastName}`,
        phone: a.loan?.client?.phone,
        paymentDate: a.paymentDate,
        totalPayment: Number(a.totalPayment),
      })),
    });

  } catch (error: any) {
    console.error('Error obteniendo cartera-stats:', error);
    return NextResponse.json({ error: 'Error interno', detail: error.message }, { status: 500 });
  }
}
