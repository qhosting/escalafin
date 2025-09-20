
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole, LoanType, LoanStatus } from '@prisma/client';
import { generateLoanNumber } from '@/lib/utils';

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
    const {
      clientId,
      loanType,
      principalAmount,
      termMonths,
      interestRate,
      monthlyPayment,
      startDate,
      endDate,
      purpose,
      collateral,
      notes,
      status = 'ACTIVE'
    } = body;

    // Validate required fields
    if (!clientId || !loanType || !principalAmount || !termMonths || !interestRate || !monthlyPayment || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Validate client exists
    const client = await prisma.client.findUnique({
      where: { id: clientId }
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    // Generate loan number
    const loanNumber = await generateLoanNumber();

    // Calculate total amount
    const totalAmount = parseFloat(monthlyPayment.toString()) * parseInt(termMonths.toString());

    // Create loan
    const loan = await prisma.loan.create({
      data: {
        loanNumber,
        clientId,
        loanType: loanType as LoanType,
        principalAmount: parseFloat(principalAmount.toString()),
        balanceRemaining: parseFloat(principalAmount.toString()),
        termMonths: parseInt(termMonths.toString()),
        interestRate: parseFloat(interestRate.toString()),
        monthlyPayment: parseFloat(monthlyPayment.toString()),
        totalAmount,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
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

    return NextResponse.json({
      success: true,
      loan,
      message: 'Préstamo creado exitosamente'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating loan:', error);
    return NextResponse.json(
      { error: 'Error al crear el préstamo' },
      { status: 500 }
    );
  }
}
