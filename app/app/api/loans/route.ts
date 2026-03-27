export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getTenantPrisma } from '@/lib/tenant-db';
import { WebhooksService } from '@/lib/webhooks';
import { WhatsAppNotificationService } from '@/lib/whatsapp-notification';
import { calculateLoanDetails, generateAmortizationSchedule } from '@/lib/loan-calculations';
import { LoanType, LoanStatus, LoanCalculationType, PaymentFrequency } from '@prisma/client';
import { LimitsService } from '@/lib/billing/limits';
import { UsageTracker } from '@/lib/billing/usage-tracker';

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
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    let whereClause: any = {};

    // Filtro de búsqueda
    if (search) {
      whereClause.OR = [
        { loanNumber: { contains: search, mode: 'insensitive' } },
        {
          client: {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } }
            ]
          }
        }
      ];
    }

    // Filtros según rol (Aislamiento por tenant ya aplicado por tenantPrisma)
    if (session.user.role === 'ASESOR') {
      const assignedCount = await tenantPrisma.client.count({
        where: { asesorId: session.user.id }
      });

      if (assignedCount > 0) {
        // Si tiene clientes asignados, solo ve préstamos de sus clientes
        whereClause.client = {
          asesorId: session.user.id
        };
      }
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
        select: {
          id: true,
          clientId: true,
          loanNumber: true,
          loanType: true,
          principalAmount: true,
          interestRate: true,
          termMonths: true,
          paymentFrequency: true,
          monthlyPayment: true,
          totalAmount: true,
          balanceRemaining: true,
          status: true,
          startDate: true,
          endDate: true,
          createdAt: true,
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

    // 💡 Verificación de Límites SaaS
    const limitError = await LimitsService.middleware(tenantId || '', 'loans');
    if (limitError) return limitError;

    const body = await request.json();
    const {
      clientId,
      creditApplicationId,
      loanType,
      principalAmount,
      interestRate,
      termMonths,
      startDate,
      loanCalculationType = 'INTERES' as LoanCalculationType,
      paymentFrequency = 'MENSUAL' as PaymentFrequency,
      weeklyInterestAmount,
      initialPayment,
      lateFeeType,
      lateFeeAmount,
      lateFeeMaxWeekly
    } = body;

    // Validaciones (interestRate puede ser 0 en tarifa fija)
    if (!clientId || !loanType || !principalAmount || interestRate === undefined || !termMonths || !startDate) {
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
    const loanCount = await tenantPrisma.loan.count() + 1;
    const loanNumber = `EF-${loanCount}`;

    // Calcular valores del préstamo usando la librería única
    const calculations = calculateLoanDetails({
      loanCalculationType,
      principalAmount: parseFloat(principalAmount),
      numberOfPayments: parseInt(termMonths),
      paymentFrequency,
      annualInterestRate: parseFloat(interestRate),
      weeklyInterestAmount: weeklyInterestAmount ? parseFloat(weeklyInterestAmount) : undefined,
      startDate: new Date(startDate)
    });

    const monthlyPayment = calculations.paymentAmount;
    const totalAmount = calculations.totalAmount;
    const endDate = calculations.endDate;

    // Crear préstamo
    const loan = await tenantPrisma.loan.create({
      data: {
        clientId,
        creditApplicationId: creditApplicationId || null,
        loanNumber,
        loanType: loanType as LoanType,
        loanCalculationType,
        principalAmount: parseFloat(principalAmount),
        interestRate: parseFloat(interestRate),
        weeklyInterestAmount: weeklyInterestAmount ? parseFloat(weeklyInterestAmount) : null,
        termMonths: parseInt(termMonths),
        paymentFrequency,
        monthlyPayment,
        initialPayment: initialPayment ? parseFloat(initialPayment) : null,
        totalAmount,
        balanceRemaining: parseFloat(principalAmount),
        startDate: new Date(startDate),
        endDate,
        lateFeeType: lateFeeType || 'DAILY_FIXED',
        lateFeeAmount: lateFeeAmount ? parseFloat(lateFeeAmount) : 200,
        lateFeeMaxWeekly: lateFeeMaxWeekly ? parseFloat(lateFeeMaxWeekly) : 800
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

    // Crear tabla de amortización usando la librería única
    const amortizationEntries = generateAmortizationSchedule({
      principalAmount: parseFloat(principalAmount),
      numberOfPayments: parseInt(termMonths),
      paymentFrequency,
      loanCalculationType,
      annualInterestRate: parseFloat(interestRate),
      weeklyInterestAmount: weeklyInterestAmount ? parseFloat(weeklyInterestAmount) : undefined,
      startDate: new Date(startDate),
      paymentAmount: monthlyPayment
    });

    const amortizationSchedule = amortizationEntries.map(entry => ({
      loanId: loan.id,
      paymentNumber: entry.paymentNumber,
      paymentDate: entry.paymentDate,
      principalPayment: entry.principalPayment,
      interestPayment: entry.interestPayment,
      totalPayment: entry.totalPayment,
      remainingBalance: entry.remainingBalance
    }));

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

    const whatsappService = new WhatsAppNotificationService(tenantId);

    // 🔌 Disparar Webhook
    WebhooksService.dispatch(tenantId || '', 'loan.created', {
      loanId: loan.id,
      loanNumber: loan.loanNumber,
      clientId: loan.clientId,
      amount: loan.principalAmount,
      totalAmount: loan.totalAmount,
      termMonths: loan.termMonths,
      monthlyPayment: loan.monthlyPayment,
      client: loan.client
    }).catch(err => console.error('Error dispatching webhook:', err));

    // 📈 Incrementar uso en SaaS
    if (tenantId) {
      await UsageTracker.incrementUsage(tenantId, 'loansCount');
    }

    // WhatsApp Notification (non-blocking)
    try {
        await whatsappService.sendLoanApprovedNotification(loan.id);
    } catch (wsError) {
        console.error('Error al enviar notificación WhatsApp préstamos:', wsError);
    }

    return NextResponse.json(loan, { status: 201 });

  } catch (error) {
    console.error('Error creando préstamo:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
