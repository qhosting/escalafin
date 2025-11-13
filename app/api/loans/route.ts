
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole, LoanType, LoanStatus, PaymentFrequency, LoanCalculationType } from '@prisma/client';
import { generateLoanNumber } from '@/lib/utils';
import { calculateLoanDetails, validateLoanParams } from '@/lib/loan-calculations';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const clientId = searchParams.get('clientId');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (session.user.role === UserRole.CLIENTE) {
      where.clientId = session.user.id;
    }
    
    if (status) {
      where.status = status as LoanStatus;
    }
    
    if (clientId) {
      where.clientId = clientId;
    }

    // Count total records
    const totalCount = await prisma.loan.count({ where });
    const totalPages = Math.ceil(totalCount / limit);

    // Get loans with client information and recent payments
    const loans = await prisma.loan.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          }
        },
        payments: {
          take: 1,
          orderBy: { paymentDate: 'desc' },
          select: {
            id: true,
            amount: true,
            paymentDate: true,
            status: true,
          }
        }
      },
      orderBy: [
        { createdAt: 'desc' }
      ],
      skip,
      take: limit
    });

    return NextResponse.json({
      loans,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching loans:', error);
    return NextResponse.json(
      { error: 'Error al cargar préstamos' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    console.log('Datos recibidos para crear préstamo:', body);

    const {
      clientId,
      loanType,
      loanCalculationType = 'INTERES',
      principalAmount,
      termMonths,
      paymentFrequency = 'MENSUAL',
      interestRate,
      weeklyInterestAmount,
      monthlyPayment,
      initialPayment,
      startDate,
      purpose,
      collateral,
      notes,
      status = 'ACTIVE'
    } = body;

    // Validate required fields exist
    if (!clientId || !loanType || !principalAmount || !termMonths || !startDate) {
      console.error('Campos faltantes:', {
        clientId: !!clientId,
        loanType: !!loanType,
        principalAmount: !!principalAmount,
        termMonths: !!termMonths,
        startDate: !!startDate
      });
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Validar campos específicos según el tipo de cálculo
    if (loanCalculationType === 'INTERES' && (interestRate === undefined || interestRate === null)) {
      return NextResponse.json(
        { error: 'La tasa de interés es requerida para préstamos con interés' },
        { status: 400 }
      );
    }

    // Para INTERES_SEMANAL, el weeklyInterestAmount es opcional (se calcula automáticamente si no se proporciona)
    // pero debe ser válido si se proporciona
    if (loanCalculationType === 'INTERES_SEMANAL' && weeklyInterestAmount !== undefined && weeklyInterestAmount !== null) {
      const weeklyInt = parseFloat(weeklyInterestAmount.toString());
      if (isNaN(weeklyInt) || weeklyInt < 0) {
        return NextResponse.json(
          { error: 'El interés semanal debe ser un número válido no negativo' },
          { status: 400 }
        );
      }
    }

    // Validate clientId is not empty string
    if (typeof clientId === 'string' && clientId.trim() === '') {
      console.error('clientId está vacío');
      return NextResponse.json(
        { error: 'El ID del cliente no puede estar vacío' },
        { status: 400 }
      );
    }

    // Validate numeric fields
    const principal = parseFloat(principalAmount.toString());
    const term = parseInt(termMonths.toString());
    const rate = interestRate !== undefined && interestRate !== null 
      ? parseFloat(interestRate.toString()) 
      : 0;

    if (isNaN(principal) || principal <= 0) {
      console.error('Monto principal inválido:', principalAmount);
      return NextResponse.json(
        { error: 'El monto principal debe ser un número positivo' },
        { status: 400 }
      );
    }

    if (isNaN(term) || term <= 0) {
      console.error('Plazo inválido:', termMonths);
      return NextResponse.json(
        { error: 'El plazo debe ser un número positivo' },
        { status: 400 }
      );
    }

    // Validar tasa solo para préstamos con interés
    if (loanCalculationType === 'INTERES' && (isNaN(rate) || rate < 0)) {
      console.error('Tasa de interés inválida:', interestRate);
      return NextResponse.json(
        { error: 'La tasa de interés debe ser un número válido' },
        { status: 400 }
      );
    }

    // Validate start date
    const start = new Date(startDate);

    if (isNaN(start.getTime())) {
      console.error('Fecha de inicio inválida:', startDate);
      return NextResponse.json(
        { error: 'La fecha de inicio no es válida' },
        { status: 400 }
      );
    }

    // Validate loan type
    const validLoanTypes = ['PERSONAL', 'BUSINESS', 'MORTGAGE', 'AUTO', 'EDUCATION'];
    if (!validLoanTypes.includes(loanType)) {
      console.error('Tipo de préstamo inválido:', loanType);
      return NextResponse.json(
        { error: 'Tipo de préstamo no válido' },
        { status: 400 }
      );
    }

    // Validate loan status
    const validStatuses = ['ACTIVE', 'PAID_OFF', 'DEFAULTED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      console.error('Estado de préstamo inválido:', status);
      return NextResponse.json(
        { error: 'Estado de préstamo no válido' },
        { status: 400 }
      );
    }

    // Validate payment frequency
    const validFrequencies = ['SEMANAL', 'CATORCENAL', 'QUINCENAL', 'MENSUAL'];
    if (!validFrequencies.includes(paymentFrequency)) {
      console.error('Frecuencia de pago inválida:', paymentFrequency);
      return NextResponse.json(
        { error: 'Frecuencia de pago no válida' },
        { status: 400 }
      );
    }

    // Validate loan calculation type
    const validCalculationTypes = ['INTERES', 'TARIFA_FIJA', 'INTERES_SEMANAL'];
    if (!validCalculationTypes.includes(loanCalculationType)) {
      console.error('Tipo de cálculo inválido:', loanCalculationType);
      return NextResponse.json(
        { error: 'Tipo de cálculo no válido' },
        { status: 400 }
      );
    }

    // Validate initialPayment if provided
    if (initialPayment !== undefined && initialPayment !== null) {
      const initialPmt = parseFloat(initialPayment.toString());
      if (isNaN(initialPmt) || initialPmt < 0) {
        console.error('Pago inicial inválido:', initialPayment);
        return NextResponse.json(
          { error: 'El pago inicial debe ser un número válido no negativo' },
          { status: 400 }
        );
      }
    }

    // Validate client exists
    const client = await prisma.client.findUnique({
      where: { id: clientId }
    });

    if (!client) {
      console.error('Cliente no encontrado:', clientId);
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    // Validate loan parameters
    const weeklyInt = weeklyInterestAmount !== undefined && weeklyInterestAmount !== null 
      ? parseFloat(weeklyInterestAmount.toString()) 
      : undefined;

    const validation = validateLoanParams({
      loanCalculationType: loanCalculationType as LoanCalculationType,
      principalAmount: principal,
      numberOfPayments: term,
      annualInterestRate: rate,
      weeklyInterestAmount: weeklyInt
    });

    if (!validation.valid) {
      console.error('Validación de parámetros falló:', validation.error);
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Calculate loan details based on calculation type
    const loanDetails = calculateLoanDetails({
      loanCalculationType: loanCalculationType as LoanCalculationType,
      principalAmount: principal,
      numberOfPayments: term,
      paymentFrequency: paymentFrequency as PaymentFrequency,
      annualInterestRate: rate,
      weeklyInterestAmount: weeklyInt,
      startDate: start
    });

    // Generate loan number
    const loanNumber = await generateLoanNumber();

    console.log('Creando préstamo con datos calculados:', {
      loanNumber,
      clientId,
      loanType,
      loanCalculationType,
      principal,
      term,
      rate,
      paymentAmount: loanDetails.paymentAmount,
      totalAmount: loanDetails.totalAmount,
      endDate: loanDetails.endDate,
      effectiveRate: loanDetails.effectiveRate,
      status
    });

    // Create loan
    const loan = await prisma.loan.create({
      data: {
        loanNumber,
        clientId,
        loanType: loanType as LoanType,
        loanCalculationType: loanCalculationType as LoanCalculationType,
        principalAmount: principal,
        balanceRemaining: principal,
        termMonths: term,
        paymentFrequency: paymentFrequency as PaymentFrequency,
        interestRate: rate,
        weeklyInterestAmount: loanDetails.weeklyInterest ? loanDetails.weeklyInterest : null,
        monthlyPayment: loanDetails.paymentAmount,
        initialPayment: initialPayment ? parseFloat(initialPayment.toString()) : null,
        totalAmount: loanDetails.totalAmount,
        startDate: start,
        endDate: loanDetails.endDate,
        status: status as LoanStatus,
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          }
        }
      }
    });

    console.log('Préstamo creado exitosamente:', loan.id);

    return NextResponse.json({
      success: true,
      loan,
      message: 'Préstamo creado exitosamente'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating loan:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { error: 'Ya existe un préstamo con este número' },
          { status: 409 }
        );
      }
      if (error.message.includes('Foreign key constraint')) {
        return NextResponse.json(
          { error: 'Referencia inválida. Verifica que el cliente existe.' },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Error al crear el préstamo: ' + (error instanceof Error ? error.message : 'Error desconocido') },
      { status: 500 }
    );
  }
}
