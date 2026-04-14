export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getTenantPrisma } from '@/lib/tenant-db';
import { LoanStatus } from '@prisma/client';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant no encontrado' }, { status: 400 });
    }

    const tenantPrisma = getTenantPrisma(tenantId);

    const loan = await (tenantPrisma.loan as any).findFirst({
      where: { id: params.id },
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
          insuranceAmount: true,
          disbursementFee: true,
          disbursedAmount: true,
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
              phone: true,
              address: true,
              city: true,
              monthlyIncome: true,
              employmentType: true,
              employerName: true
            }
          },
          creditApplication: {
            select: {
              id: true,
              loanType: true,
              requestedAmount: true,
              purpose: true,
              status: true,
              createdAt: true
            }
          },
          amortizationSchedule: {
            orderBy: { paymentNumber: 'asc' }
          },
          lateFeePenalties: {
            include: {
              installment: {
                select: {
                  paymentNumber: true,
                  paymentDate: true
                }
              }
            },
            orderBy: { createdAt: 'desc' }
          },
          payments: {
            orderBy: { paymentDate: 'desc' },
            include: {
              processedByUser: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
      }
    });

    if (!loan) {
      // Verificar si el préstamo existe en otro tenant (cross-tenant access attempt)
      const globalLoan = await prisma.loan.findUnique({
        where: { id: params.id },
        select: { id: true, tenantId: true }
      });

      if (globalLoan) {
        // El préstamo existe pero pertenece a otra organización
        console.warn(`🚫 Intento de acceso cross-tenant: usuario del tenant ${tenantId} intentó acceder al préstamo ${params.id} del tenant ${globalLoan.tenantId}`);
        return NextResponse.json({
          error: 'Este recurso pertenece a otra organización y no puede ser consultado desde su cuenta.',
          code: 'CROSS_TENANT_ACCESS',
          message: 'El préstamo solicitado no pertenece a su organización. Verifique que está usando el enlace correcto o contacte a su administrador.'
        }, { status: 403 });
      }

      return NextResponse.json({
        error: 'Préstamo no encontrado',
        code: 'NOT_FOUND',
        message: 'El préstamo solicitado no existe. Puede haber sido eliminado o el enlace es incorrecto.'
      }, { status: 404 });
    }

    // Verificar permisos de rol (si es cliente, que sea SU préstamo)
    if (session.user.role === 'CLIENTE') {
      const clientProfile = await (tenantPrisma.client as any).findFirst({
        where: { userId: session.user.id }
      });

      if (loan.clientId !== clientProfile?.id) {
        return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
      }
    }

    return NextResponse.json({ loan });

  } catch (error) {
    console.error('Error fetching loan:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant no encontrado' }, { status: 400 });
    }

    const tenantPrisma = getTenantPrisma(tenantId);

    if (session.user.role === 'CLIENTE') {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
    }

    const body = await request.json();
    const {
      status,
      loanType,
      principalAmount,
      interestRate,
      termMonths,
      startDate,
      endDate,
      monthlyPayment,
      totalAmount,
      clientId,
      insuranceAmount,
      disbursementFee,
      disbursedAmount
    } = body;

    const loan = await (tenantPrisma.loan as any).findFirst({
      where: { id: params.id },
      select: { id: true, clientId: true, client: true }
    });

    if (!loan) {
      return NextResponse.json({ error: 'Préstamo no encontrado o no pertenece a su tenant' }, { status: 404 });
    }

    const updateData: any = {};

    if (status && Object.values(LoanStatus).includes(status as LoanStatus)) {
      updateData.status = status as LoanStatus;
    }

    if (loanType) updateData.loanType = loanType;
    if (principalAmount !== undefined) updateData.principalAmount = parseFloat(principalAmount);
    if (interestRate !== undefined) updateData.interestRate = parseFloat(interestRate);
    if (termMonths !== undefined) updateData.termMonths = parseInt(termMonths);
    if (monthlyPayment !== undefined) updateData.monthlyPayment = parseFloat(monthlyPayment);
    if (totalAmount !== undefined) updateData.totalAmount = parseFloat(totalAmount);
    if (startDate) updateData.startDate = new Date(startDate);
    if (endDate) updateData.endDate = new Date(endDate);
    if (clientId) updateData.clientId = clientId;
    if (insuranceAmount !== undefined) updateData.insuranceAmount = parseFloat(insuranceAmount);
    if (disbursementFee !== undefined) updateData.disbursementFee = parseFloat(disbursementFee);
    if (disbursedAmount !== undefined) updateData.disbursedAmount = parseFloat(disbursedAmount);

    const updatedLoan = await (tenantPrisma.loan as any).update({
      where: { id: params.id },
      data: updateData,
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({ loan: updatedLoan });

  } catch (error) {
    console.error('Error updating loan:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant no encontrado' }, { status: 400 });
    }

    const tenantPrisma = getTenantPrisma(tenantId);

    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Solo administradores pueden eliminar préstamos' }, { status: 403 });
    }

    const loan = await (tenantPrisma.loan as any).findFirst({
      where: { id: params.id },
      select: {
          id: true,
          payments: { select: { id: true } },
          amortizationSchedule: { select: { id: true } }
      }
    });

    if (!loan) {
      return NextResponse.json({ error: 'Préstamo no encontrado o no pertenece a su tenant' }, { status: 404 });
    }

    // No permitir eliminar préstamos con pagos
    if (loan.payments.length > 0) {
      return NextResponse.json({
        error: 'No se puede eliminar un préstamo con pagos registrados'
      }, { status: 400 });
    }

    // Eliminar tabla de amortización y préstamo
    await (tenantPrisma as any).$transaction([
      (tenantPrisma.amortizationSchedule as any).deleteMany({
        where: { loanId: params.id }
      }),
      (tenantPrisma.loan as any).delete({
        where: { id: params.id }
      })
    ]);

    return NextResponse.json({ message: 'Préstamo eliminado exitosamente' });

  } catch (error) {
    console.error('Error deleting loan:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
