

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

    // Buscar transacciones de pago
    // Como no tenemos modelo de Transaction en Prisma, devolvemos datos mock
    const transactions = [
      {
        id: '1',
        amount: 9025,
        status: 'COMPLETED',
        provider: 'OPENPAY',
        createdAt: new Date().toISOString(),
        payment: {
          loan: {
            loanNumber: 'L-001',
            client: {
              firstName: 'María',
              lastName: 'García'
            }
          }
        }
      },
      {
        id: '2',
        amount: 50000,
        status: 'COMPLETED',
        provider: 'OPENPAY',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        payment: {
          loan: {
            loanNumber: 'L-002',
            client: {
              firstName: 'Juan',
              lastName: 'Pérez'
            }
          }
        }
      },
      {
        id: '3',
        amount: 4500,
        status: 'FAILED',
        provider: 'OPENPAY',
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        payment: {
          loan: {
            loanNumber: 'L-003',
            client: {
              firstName: 'Pedro',
              lastName: 'Martín'
            }
          }
        }
      }
    ];

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
