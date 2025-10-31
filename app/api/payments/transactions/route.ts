

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo administradores pueden ver todas las transacciones
    const userRole = (session.user as any).role;
    if (userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Buscar pagos realizados con información completa
    const payments = await prisma.payment.findMany({
      where: {
        status: {
          in: ['PAID', 'PARTIAL', 'FAILED']
        }
      },
      include: {
        loan: {
          include: {
            client: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        }
      },
      orderBy: {
        paymentDate: 'desc'
      },
      take: 100
    });

    // Transformar pagos a formato de transacciones
    const transactions = payments.map((payment) => ({
      id: payment.id,
      amount: payment.amount,
      status: payment.status === 'PAID' ? 'COMPLETED' : payment.status === 'FAILED' ? 'FAILED' : 'PENDING',
      provider: payment.paymentMethod || 'CASH',
      createdAt: payment.paymentDate?.toISOString() || payment.dueDate.toISOString(),
      payment: {
        loan: {
          loanNumber: payment.loan.loanNumber,
          client: {
            firstName: payment.loan.client.firstName,
            lastName: payment.loan.client.lastName
          }
        }
      }
    }));

    const stats = {
      totalTransactions: transactions.length,
      completedTransactions: transactions.filter(t => t.status === 'COMPLETED').length,
      pendingTransactions: transactions.filter(t => t.status === 'PENDING').length,
      failedTransactions: transactions.filter(t => t.status === 'FAILED').length,
      totalAmount: transactions
        .filter(t => t.status === 'COMPLETED')
        .reduce((sum, t) => sum + t.amount, 0)
    };

    return NextResponse.json({ transactions, stats });

  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
