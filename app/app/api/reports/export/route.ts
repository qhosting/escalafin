
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['ADMIN', 'ASESOR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'general';
    const timeRange = searchParams.get('timeRange') || '30days';

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (timeRange) {
      case '7days':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30days':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90days':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case '1year':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    let reportData: any = {};

    // Generate different report types
    switch (type) {
      case 'payments':
        const payments = await prisma.payment.findMany({
          where: {
            paymentDate: {
              gte: startDate,
              lte: endDate
            }
          },
          include: {
            loan: {
              include: {
                client: true
              }
            }
          },
          orderBy: {
            paymentDate: 'desc'
          }
        });

        reportData = {
          title: 'Reporte de Pagos',
          period: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
          summary: {
            totalPayments: payments.length,
            totalAmount: payments.reduce((sum, p) => sum + Number(p.amount), 0),
            averagePayment: payments.length > 0 ? 
              payments.reduce((sum, p) => sum + Number(p.amount), 0) / payments.length : 0
          },
          details: payments.map(p => ({
            date: p.paymentDate.toLocaleDateString(),
            client: `${p.loan.client.firstName} ${p.loan.client.lastName}`,
            amount: p.amount,
            method: p.paymentMethod,
            status: p.status
          }))
        };
        break;

      case 'portfolio':
        const loans = await prisma.loan.findMany({
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          },
          include: {
            client: true,
            payments: true
          }
        });

        reportData = {
          title: 'Reporte de Cartera',
          period: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
          summary: {
            totalLoans: loans.length,
            totalAmount: loans.reduce((sum, l) => sum + Number(l.principalAmount || 0), 0),
            activeLoans: loans.filter(l => l.status === 'ACTIVE').length,
            overdueLoans: loans.filter(l => l.status === 'DEFAULTED').length
          },
          details: loans.map(l => ({
            id: l.id.slice(-6),
            client: `${l.client.firstName} ${l.client.lastName}`,
            amount: Number(l.principalAmount || 0),
            balance: Number(l.principalAmount || 0) - l.payments.reduce((sum, p) => sum + Number(p.amount), 0),
            status: l.status,
            startDate: l.startDate.toLocaleDateString()
          }))
        };
        break;

      case 'performance':
        const monthlyData = await prisma.payment.groupBy({
          by: ['paymentDate'],
          where: {
            paymentDate: {
              gte: startDate,
              lte: endDate
            }
          },
          _sum: {
            amount: true
          },
          _count: {
            id: true
          }
        });

        reportData = {
          title: 'Reporte de Rendimiento',
          period: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
          summary: {
            totalCollections: monthlyData.reduce((sum, d) => sum + Number(d._sum.amount || 0), 0),
            averageMonthly: monthlyData.length > 0 ? 
              monthlyData.reduce((sum, d) => sum + Number(d._sum.amount || 0), 0) / monthlyData.length : 0,
            transactionsCount: monthlyData.reduce((sum, d) => sum + d._count.id, 0)
          },
          details: monthlyData.map(d => ({
            period: d.paymentDate.toLocaleDateString(),
            amount: d._sum.amount || 0,
            transactions: d._count.id
          }))
        };
        break;

      default:
        reportData = {
          title: 'Reporte General',
          period: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
          message: 'Reporte básico generado'
        };
    }

    // For now, return JSON. In a real implementation, you would generate PDF
    const response = NextResponse.json(reportData);
    response.headers.set('Content-Disposition', `attachment; filename="${type}-report.json"`);
    
    return response;

  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: 'Error generando reporte' },
      { status: 500 }
    );
  }
}
