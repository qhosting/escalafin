
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
    const dateFrom = searchParams.get('dateFrom') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const dateTo = searchParams.get('dateTo') || new Date().toISOString().split('T')[0];

    // Convert dates
    const startDate = new Date(dateFrom);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(dateTo);
    endDate.setHours(23, 59, 59, 999);

    // Fetch cash payments (collections) in the date range
    const cashPayments = await prisma.payment.findMany({
      where: {
        paymentDate: {
          gte: startDate,
          lte: endDate
        },
        paymentMethod: 'CASH'
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
        },
        processedByUser: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    // Group by collector and date
    const collectionsByCollector = cashPayments.reduce((acc, payment) => {
      const collectorName = payment.processedByUser ? 
        `${payment.processedByUser.firstName} ${payment.processedByUser.lastName}` : 
        'Cobrador Desconocido';
      const dateKey = payment.paymentDate.toISOString().split('T')[0];
      const key = `${collectorName}-${dateKey}`;

      if (!acc[key]) {
        acc[key] = {
          id: key,
          collectorName,
          totalCollections: 0,
          totalAmount: 0,
          loansVisited: new Set(),
          date: dateKey
        };
      }

      acc[key].totalCollections += 1;
      acc[key].totalAmount += Number(payment.amount);
      acc[key].loansVisited.add(payment.loanId);

      return acc;
    }, {} as Record<string, any>);

    // Transform to array and calculate final metrics
    const collectionReports = Object.values(collectionsByCollector).map((report: any) => ({
      ...report,
      loansVisited: report.loansVisited.size
    }));

    // Calculate overall statistics
    const stats = {
      totalCollected: cashPayments.reduce((sum, payment) => sum + Number(payment.amount), 0),
      activeCollectors: new Set(cashPayments.map(p => p.processedBy).filter(Boolean)).size,
      totalVisits: cashPayments.length
    };

    return NextResponse.json({
      collections: collectionReports,
      stats
    });

  } catch (error) {
    console.error('Error fetching collections report:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
