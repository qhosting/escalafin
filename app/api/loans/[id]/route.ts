
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole, LoanStatus } from '@prisma/client';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const loan = await prisma.loan.findUnique({
      where: { id: params.id },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            monthlyIncome: true,
            creditScore: true,
          }
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
          select: {
            id: true,
            amount: true,
            paymentDate: true,
            status: true,
            paymentMethod: true,
            reference: true,
            notes: true,
          }
        }
      }
    });

    if (!loan) {
      return NextResponse.json({ error: 'Préstamo no encontrado' }, { status: 404 });
    }

    // Check authorization
    if (session.user.role === UserRole.CLIENTE && loan.clientId !== session.user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    return NextResponse.json({ loan });
  } catch (error) {
    console.error('Error fetching loan:', error);
    return NextResponse.json(
      { error: 'Error al cargar el préstamo' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role === UserRole.CLIENTE) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const {
      loanType,
      principalAmount,
      balanceRemaining,
      termMonths,
      interestRate,
      monthlyPayment,
      startDate,
      endDate,
      status
    } = body;

    // Check if loan exists
    const existingLoan = await prisma.loan.findUnique({
      where: { id: params.id }
    });

    if (!existingLoan) {
      return NextResponse.json({ error: 'Préstamo no encontrado' }, { status: 404 });
    }

    // Update loan
    const loan = await prisma.loan.update({
      where: { id: params.id },
      data: {
        loanType,
        principalAmount: principalAmount ? parseFloat(principalAmount.toString()) : undefined,
        balanceRemaining: balanceRemaining ? parseFloat(balanceRemaining.toString()) : undefined,
        termMonths: termMonths ? parseInt(termMonths.toString()) : undefined,
        interestRate: interestRate ? parseFloat(interestRate.toString()) : undefined,
        monthlyPayment: monthlyPayment ? parseFloat(monthlyPayment.toString()) : undefined,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        status: status as LoanStatus,
        updatedAt: new Date(),
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
      message: 'Préstamo actualizado exitosamente'
    });

  } catch (error) {
    console.error('Error updating loan:', error);
    return NextResponse.json(
      { error: 'Error al actualizar el préstamo' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Check if loan exists and has payments
    const existingLoan = await prisma.loan.findUnique({
      where: { id: params.id },
      include: {
        payments: true
      }
    });

    if (!existingLoan) {
      return NextResponse.json({ error: 'Préstamo no encontrado' }, { status: 404 });
    }

    if (existingLoan.payments.length > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar un préstamo con pagos registrados' },
        { status: 400 }
      );
    }

    // Delete loan
    await prisma.loan.delete({
      where: { id: params.id }
    });

    return NextResponse.json({
      success: true,
      message: 'Préstamo eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error deleting loan:', error);
    return NextResponse.json(
      { error: 'Error al eliminar el préstamo' },
      { status: 500 }
    );
  }
}
