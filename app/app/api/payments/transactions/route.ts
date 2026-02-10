
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getTenantPrisma } from '@/lib/tenant-db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Solo admins pueden ver todas las transacciones de su tenant
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const tenantId = session.user.tenantId;
    const tenantPrisma = getTenantPrisma(tenantId);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = (page - 1) * limit;

    // Obtener transacciones con información relacionada (Scritamente filtrada por tenant)
    const [transactions, totalCount] = await Promise.all([
      tenantPrisma.paymentTransaction.findMany({
        where: {
          payment: {
            tenantId: tenantId
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          payment: {
            include: {
              loan: {
                select: {
                  loanNumber: true,
                  client: {
                    select: {
                      firstName: true,
                      lastName: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
      tenantPrisma.paymentTransaction.count({
        where: {
          payment: {
            tenantId: tenantId
          }
        }
      }),
    ]);

    // Calcular estadísticas (Estrictamente filtradas por tenant)
    // Usamos (tenantPrisma as any) porque groupBy tiene problemas de tipos en el cliente extendido de Prisma
    const stats = await (tenantPrisma as any).paymentTransaction.groupBy({
      where: {
        payment: {
          tenantId: tenantId
        }
      },
      by: ['status'],
      _count: {
        status: true,
      },
      _sum: {
        amount: true,
      },
    });

    const statsMap = stats.reduce((acc: any, stat: any) => {
      acc[stat.status] = {
        count: stat._count.status,
        amount: Number(stat._sum.amount) || 0,
      };
      return acc;
    }, {} as Record<string, { count: number; amount: number }>);

    const calculatedStats = {
      totalTransactions: totalCount,
      completedTransactions: statsMap.COMPLETED?.count || 0,
      pendingTransactions: (statsMap.PENDING?.count || 0) + (statsMap.PROCESSING?.count || 0),
      failedTransactions: statsMap.FAILED?.count || 0,
      totalAmount: Object.values(statsMap).reduce((sum: number, stat: any) => sum + stat.amount, 0),
    };

    return NextResponse.json({
      transactions,
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      stats: calculatedStats,
    });
  } catch (error) {
    console.error('Error fetching payment transactions:', error);
    return NextResponse.json(
      { error: 'Error al obtener transacciones de pago' },
      { status: 500 }
    );
  }
}
