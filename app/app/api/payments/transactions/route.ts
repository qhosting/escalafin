
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Solo admins pueden ver todas las transacciones
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = (page - 1) * limit;

    // Obtener transacciones con información relacionada
    const [transactions, totalCount] = await Promise.all([
      prisma.paymentTransaction.findMany({
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
      prisma.paymentTransaction.count(),
    ]);

    // Calcular estadísticas
    const stats = await prisma.paymentTransaction.groupBy({
      by: ['status'],
      _count: {
        status: true,
      },
      _sum: {
        amount: true,
      },
    });

    const statsMap = stats.reduce((acc, stat) => {
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
      totalAmount: Object.values(statsMap).reduce((sum, stat) => sum + stat.amount, 0),
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
