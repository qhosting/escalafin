export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getTenantPrisma } from '@/lib/tenant-db';
import { LoanType, LoanStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    const tenantPrisma = getTenantPrisma(tenantId);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const clientId = searchParams.get('clientId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    let whereClause: any = {};

    // Filtros según rol (Aislamiento por tenant ya aplicado por tenantPrisma)
    if (session.user.role === 'ASESOR') {
      // Asesor solo ve préstamos de sus clientes asignados
      const asesorClients = await tenantPrisma.client.findMany({
        where: { asesorId: session.user.id },
        select: { id: true }
      });

      whereClause.clientId = {
        in: asesorClients.map(client => client.id)
      };
    }

    // Filtros adicionales
    if (status && Object.values(LoanStatus).includes(status as LoanStatus)) {
      whereClause.status = status as LoanStatus;
    }

    if (clientId) {
      whereClause.clientId = clientId;
    }

    const [loans, totalCount] = await Promise.all([
      tenantPrisma.loan.findMany({
        where: whereClause,
        include: {
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true
            }
          },
          creditApplication: {
            select: {
              id: true,
              loanType: true,
              requestedAmount: true,
              status: true
            }
          },
          payments: {
            select: {
              id: true,
              amount: true,
              paymentDate: true,
              status: true
            },
            orderBy: { paymentDate: 'desc' },
            take: 3
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      tenantPrisma.loan.count({ where: whereClause })
    ]);

    return NextResponse.json({
      loans,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching loans:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (session.user.role === 'CLIENTE') {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
    }

    const tenantId = session.user.tenantId;
    const tenantPrisma = getTenantPrisma(tenantId);

    const body = await request.json();
    const {
      clientId,
      creditApplicationId,
      loanType,
      principalAmount,
      interestRate,
      termMonths,
      startDate
    } = body;

    // Validaciones
    if (!clientId || !loanType || !principalAmount || !interestRate || !termMonths || !startDate) {
      return NextResponse.json({ error: 'Campos requeridos faltantes' }, { status: 400 });
    }

    // Verificar que el cliente existe (en el tenant)
    const client = await tenantPrisma.client.findUnique({
      where: { id: clientId }
    });

    if (!client) {
      return NextResponse.json({ error: 'Cliente no encontrado en esta organización' }, { status: 404 });
    }

    // Si el usuario es asesor, verificar que el cliente esté asignado a él
    if (session.user.role === 'ASESOR' && client.asesorId !== session.user.id) {
      return NextResponse.json({ error: 'No tienes permisos para este cliente' }, { status: 403 });
    }

    // Generar número de préstamo único (por organización idealmente, o global)
    // Para simplicidad, usaremos el contador del tenant si fuera posible, pero Loan.count() con isolation funciona
    const currentYear = new Date().getFullYear();
    const loanCount = await tenantPrisma.loan.count() + 1;
    const loanNumber = `ESF-${currentYear}-${loanCount.toString().padStart(4, '0')}`;

    // Calcular valores del préstamo
    const monthlyInterestRate = parseFloat(interestRate) / 100 / 12;
    const monthlyPayment = (parseFloat(principalAmount) * monthlyInterestRate * Math.pow(1 + monthlyInterestRate, termMonths)) /
      (Math.pow(1 + monthlyInterestRate, termMonths) - 1);
    const totalAmount = monthlyPayment * termMonths;

    const startDateObj = new Date(startDate);
    const endDate = new Date(startDateObj);
    endDate.setMonth(endDate.getMonth() + termMonths);

    // Crear préstamo
    const loan = await tenantPrisma.loan.create({
      data: {
        clientId,
        creditApplicationId: creditApplicationId || null,
        loanNumber,
        loanType: loanType as LoanType,
        principalAmount: parseFloat(principalAmount),
        interestRate: parseFloat(interestRate),
        termMonths: parseInt(termMonths),
        monthlyPayment,
        totalAmount,
        balanceRemaining: parseFloat(principalAmount),
        startDate: startDateObj,
        endDate
      },
      include: {
        client: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    // Crear tabla de amortización
    const amortizationSchedule = [];
    let remainingBalance = parseFloat(principalAmount);

    for (let i = 1; i <= termMonths; i++) {
      const paymentDate = new Date(startDateObj);
      paymentDate.setMonth(paymentDate.getMonth() + i);

      const interestPayment = remainingBalance * monthlyInterestRate;
      const principalPayment = monthlyPayment - interestPayment;
      remainingBalance -= principalPayment;

      amortizationSchedule.push({
        loanId: loan.id,
        paymentNumber: i,
        paymentDate,
        principalPayment,
        interestPayment,
        totalPayment: monthlyPayment,
        remainingBalance: Math.max(0, remainingBalance)
      });
    }

    // AmortizationSchedule no tiene tenantId directo aún, pero se accede vía Loan
    await (tenantPrisma as any).amortizationSchedule.createMany({
      data: amortizationSchedule
    });

    // Actualizar solicitud de crédito si existe
    if (creditApplicationId) {
      await tenantPrisma.creditApplication.update({
        where: { id: creditApplicationId },
        data: { status: 'APPROVED' }
      });
    }

    return NextResponse.json(loan, { status: 201 });

  } catch (error) {
    console.error('Error creando préstamo:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
