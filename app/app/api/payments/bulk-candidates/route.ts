import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getTenantPrisma } from '@/lib/tenant-db';

export const dynamic = 'force-dynamic';

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    const db = tenantId ? getTenantPrisma(tenantId) : prisma;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const advisorId = searchParams.get('advisorId') || 'all';
    const dayOfWeek = searchParams.get('dayOfWeek'); // 0-6 or 'all'
    const frequency = searchParams.get('frequency') || 'all';
    const statusFilter = searchParams.get('statusFilter') || 'all'; // 'all', 'overdue', 'due_today', 'due_week'

    // Condiciones de búsqueda
    const whereConditions: any = {
      status: 'ACTIVE',
      balanceRemaining: { gt: 0 }
    };

    if (tenantId) {
      whereConditions.tenantId = tenantId;
    }

    // Filtro por asesor
    if (session.user.role === 'ASESOR') {
      whereConditions.client = { asesorId: session.user.id };
    } else if (advisorId !== 'all') {
      whereConditions.client = { asesorId: advisorId };
    }

    // Filtro por frecuencia
    if (frequency !== 'all') {
      whereConditions.paymentFrequency = frequency;
    }

    // Filtro de búsqueda por texto
    if (search.trim()) {
      const term = search.trim();
      whereConditions.OR = [
        { loanNumber: { contains: term, mode: 'insensitive' } },
        { client: { firstName: { contains: term, mode: 'insensitive' } } },
        { client: { lastName: { contains: term, mode: 'insensitive' } } },
        { client: { phone: { contains: term } } }
      ];
    }

    // Traer préstamos activos con sus clientes y sus cuotas pendientes
    const loans = await db.loan.findMany({
      where: whereConditions,
      include: {
        client: {
          include: {
            asesor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true
              }
            }
          }
        },
        amortizationSchedule: {
          where: { isPaid: false },
          orderBy: { paymentNumber: 'asc' },
          take: 2
        }
      },
      orderBy: { loanNumber: 'asc' }
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const candidates = loans.map((loan) => {
      const nextSchedule = loan.amortizationSchedule[0] || null;
      let isOverdue = false;
      let daysOverdue = 0;
      let dayIndex = 0;
      let dayName = 'Sin fecha';
      let dayOfMonth = 1;

      if (nextSchedule) {
        const pDate = new Date(nextSchedule.paymentDate);
        pDate.setHours(0, 0, 0, 0);
        dayIndex = pDate.getDay();
        dayName = DAY_NAMES[dayIndex];
        dayOfMonth = pDate.getDate();

        if (pDate < today) {
          isOverdue = true;
          const diffTime = Math.abs(today.getTime() - pDate.getTime());
          daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }
      }

      // Monto sugerido: Cuota de la tabla o monthlyPayment, topeado al balance pendiente
      const regularAmount = nextSchedule ? Number(nextSchedule.totalPayment) : Number(loan.monthlyPayment);
      const suggestedPayment = Math.min(regularAmount, Number(loan.balanceRemaining));

      return {
        loanId: loan.id,
        loanNumber: loan.loanNumber,
        loanType: loan.loanType,
        paymentFrequency: loan.paymentFrequency,
        principalAmount: Number(loan.principalAmount),
        balanceRemaining: Number(loan.balanceRemaining),
        monthlyPayment: Number(loan.monthlyPayment),
        client: {
          id: loan.client.id,
          firstName: loan.client.firstName,
          lastName: loan.client.lastName,
          phone: loan.client.phone,
          address: loan.client.address || '',
          asesor: loan.client.asesor
        },
        nextSchedule: nextSchedule
          ? {
              id: nextSchedule.id,
              paymentNumber: nextSchedule.paymentNumber,
              paymentDate: nextSchedule.paymentDate.toISOString(),
              totalPayment: Number(nextSchedule.totalPayment),
              principalPayment: Number(nextSchedule.principalPayment),
              interestPayment: Number(nextSchedule.interestPayment),
              remainingBalance: Number(nextSchedule.remainingBalance),
              dayOfWeek: dayIndex,
              dayName,
              dayOfMonth,
              isOverdue,
              daysOverdue
            }
          : null,
        suggestedPayment
      };
    });

    // Aplicar filtros adicionales en memoria si se especificó día de la semana o estado
    let filtered = candidates;

    if (dayOfWeek && dayOfWeek !== 'all') {
      const targetDay = parseInt(dayOfWeek, 10);
      filtered = filtered.filter((c) => c.nextSchedule && c.nextSchedule.dayOfWeek === targetDay);
    }

    if (statusFilter === 'overdue') {
      filtered = filtered.filter((c) => c.nextSchedule?.isOverdue);
    } else if (statusFilter === 'due_today') {
      filtered = filtered.filter((c) => {
        if (!c.nextSchedule) return false;
        const d = new Date(c.nextSchedule.paymentDate);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === today.getTime();
      });
    } else if (statusFilter === 'due_week') {
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      filtered = filtered.filter((c) => {
        if (!c.nextSchedule) return false;
        const d = new Date(c.nextSchedule.paymentDate);
        return d <= nextWeek;
      });
    }

    return NextResponse.json({
      candidates: filtered,
      totalCount: filtered.length,
      totalSuggested: filtered.reduce((sum, c) => sum + c.suggestedPayment, 0)
    });
  } catch (error: any) {
    console.error('Error fetching bulk payment candidates:', error);
    return NextResponse.json({ error: error.message || 'Error al obtener candidatos' }, { status: 500 });
  }
}
