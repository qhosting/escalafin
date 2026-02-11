
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getTenantPrisma } from '@/lib/tenant-db';
import { UserRole, LoanStatus } from '@prisma/client';
import { AuditLogger } from '@/lib/audit';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    const tenantPrisma = getTenantPrisma(tenantId);

    const loan = await tenantPrisma.loan.findFirst({
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

    // Check authorization (client restriction)
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

    const tenantId = session.user.tenantId;
    const tenantPrisma = getTenantPrisma(tenantId);

    const body = await request.json();
    const {
      loanType,
      principalAmount,
      balanceRemaining,
      termMonths,
      interestRate,
      monthlyPayment,
      totalAmount,
      startDate,
      endDate,
      status
    } = body;

    // Check if loan exists (scoped to tenant)
    const existingLoan = await tenantPrisma.loan.findFirst({
      where: { id: params.id }
    });

    if (!existingLoan) {
      return NextResponse.json({ error: 'Préstamo no encontrado' }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (loanType) updateData.loanType = loanType;
    if (principalAmount !== undefined) updateData.principalAmount = parseFloat(principalAmount.toString());
    if (balanceRemaining !== undefined) {
      updateData.balanceRemaining = parseFloat(balanceRemaining.toString());
    } else if (principalAmount !== undefined) {
      updateData.balanceRemaining = parseFloat(principalAmount.toString());
    }
    if (termMonths !== undefined) updateData.termMonths = parseInt(termMonths.toString());
    if (interestRate !== undefined) updateData.interestRate = parseFloat(interestRate.toString());
    if (monthlyPayment !== undefined) updateData.monthlyPayment = parseFloat(monthlyPayment.toString());
    if (totalAmount !== undefined) updateData.totalAmount = parseFloat(totalAmount.toString());
    if (startDate) updateData.startDate = new Date(startDate);
    if (endDate) updateData.endDate = new Date(endDate);
    if (status) updateData.status = status as LoanStatus;

    // Update loan (scoped to tenant)
    const loan = await tenantPrisma.loan.update({
      where: { id: params.id },
      data: updateData,
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

    // Audit log
    await AuditLogger.quickLog(request, 'LOAN_UPDATE', {
      loanNumber: loan.loanNumber,
      updates: updateData
    }, 'Loan', loan.id, session);

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
    if (!session?.user || (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.SUPER_ADMIN)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const tenantId = session.user.tenantId;
    const tenantPrisma = getTenantPrisma(tenantId);

    // Check if loan exists and has payments (scoped to tenant)
    const existingLoan = await tenantPrisma.loan.findFirst({
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

    // Delete loan (scoped to tenant)
    await tenantPrisma.loan.delete({
      where: { id: params.id }
    });

    // Audit log
    await AuditLogger.quickLog(request, 'LOAN_DELETE', {
      loanNumber: existingLoan.loanNumber
    }, 'Loan', params.id, session);

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
