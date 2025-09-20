
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const includeClient = searchParams.get('includeClient') === 'true';
    const status = searchParams.get('status') || 'ACTIVE';
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!query) {
      return NextResponse.json({ error: 'Parámetro de búsqueda requerido' }, { status: 400 });
    }

    // Build search conditions  
    const searchConditions: any = {
      status,
      OR: [
        { loanNumber: { contains: query, mode: 'insensitive' as const } },
        {
          client: {
            OR: [
              { firstName: { contains: query, mode: 'insensitive' as const } },
              { lastName: { contains: query, mode: 'insensitive' as const } },
              { email: { contains: query, mode: 'insensitive' as const } },
              { phone: { contains: query, mode: 'insensitive' as const } }
            ]
          }
        }
      ]
    };

    // For non-admin users, limit to their assigned clients
    if (session.user.role !== 'ADMIN') {
      searchConditions.client = {
        ...searchConditions.client,
        asesorId: session.user.id
      };
    }

    const loans = await prisma.loan.findMany({
      where: searchConditions,
      include: includeClient ? {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            address: true
          }
        }
      } : undefined,
      take: limit,
      orderBy: [
        { status: 'asc' },
        { updatedAt: 'desc' }
      ]
    });

    // Calculate next due date for each loan
    const loansWithDueDates = await Promise.all(
      loans.map(async (loan: any) => {
        const nextPayment = await prisma.amortizationSchedule.findFirst({
          where: {
            loanId: loan.id,
            isPaid: false
          },
          orderBy: { paymentDate: 'asc' }
        });

        return {
          ...loan,
          nextDueDate: nextPayment?.paymentDate || loan.endDate
        };
      })
    );

    return NextResponse.json({
      success: true,
      loans: loansWithDueDates,
      total: loans.length,
      query
    });

  } catch (error) {
    console.error('Error searching loans:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
