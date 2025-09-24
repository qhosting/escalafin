
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !['ADMIN', 'ADVISOR'].includes(session.user.role || '')) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // Get current date for overdue calculation
    const today = new Date();

    // Fetch active loans with their schedule and payments
    const activeLoans = await prisma.loan.findMany({
      where: {
        status: 'ACTIVE',
        balanceRemaining: {
          gt: 0
        }
      },
      include: {
        client: {
          select: {
            firstName: true,
            lastName: true,
            phone: true
          }
        },
        payments: {
          orderBy: {
            paymentDate: 'desc'
          },
          take: 1
        },
        amortizationSchedule: {
          where: {
            isPaid: false
          },
          orderBy: {
            paymentDate: 'asc'
          },
          take: 1
        }
      }
    });

    // Transform data and calculate metrics
    const processedLoans = activeLoans
      .map(loan => {
        const nextScheduledPayment = loan.amortizationSchedule[0];
        if (!nextScheduledPayment) return null;

        const dueDate = new Date(nextScheduledPayment.paymentDate);
        const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // Only include if overdue
        if (daysOverdue <= 0) return null;

        const lastPayment = loan.payments[0];
        
        return {
          id: loan.id,
          loanNumber: loan.loanNumber,
          client: {
            firstName: loan.client.firstName,
            lastName: loan.client.lastName,
            phone: loan.client.phone || ''
          },
          dueAmount: Number(loan.monthlyPayment),
          daysOverdue,
          lastPaymentDate: lastPayment?.paymentDate || null,
          status: daysOverdue > 30 ? 'CRITICAL' : daysOverdue > 7 ? 'WARNING' : 'OVERDUE'
        };
      })
      .filter(loan => loan !== null);

    // Calculate statistics
    const validLoans = processedLoans.filter((loan): loan is NonNullable<typeof loan> => loan !== null);
    const stats = {
      totalOverdue: validLoans.length,
      totalAmount: validLoans.reduce((sum, loan) => sum + Number(loan.dueAmount), 0),
      criticalLoans: validLoans.filter(loan => loan.daysOverdue > 30).length
    };

    return NextResponse.json({
      loans: validLoans,
      stats
    });

  } catch (error) {
    console.error('Error fetching due loans report:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
