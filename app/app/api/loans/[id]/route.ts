export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
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

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
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
      return NextResponse.json({ error: 'Préstamo no encontrado' }, { status: 404 });
    }

    // Verificar permisos
    /* if (user.role === 'ASESOR') {
      const client = await prisma.client.findUnique({
        where: { id: loan.clientId }
      });

      if (client?.asesorId !== user.id) {
        return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
      }
    } else */ if (user.role === 'CLIENTE') {
      const clientProfile = await prisma.client.findFirst({
        where: { userId: user.id }
      });

      if (loan.clientId !== clientProfile?.id) {
        return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
      }
    }

    return NextResponse.json(loan);

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

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user || user.role === 'CLIENTE') {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
    }

    const body = await request.json();
    const { status, notes } = body;

    const loan = await prisma.loan.findUnique({
      where: { id: params.id },
      include: { client: true }
    });

    if (!loan) {
      return NextResponse.json({ error: 'Préstamo no encontrado' }, { status: 404 });
    }

    // Permitir que todos los gestores (ASESOR) actualicen cualquier préstamo de la organización
    // Si se quisiera volver a restringir, se descomenta esto:
    /* if (user.role === 'ASESOR' && loan.client.asesorId !== user.id) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
    } */

    const updateData: any = {};

    if (status && Object.values(LoanStatus).includes(status as LoanStatus)) {
      updateData.status = status as LoanStatus;
    }

    if (notes !== undefined) {
      // Si necesitamos almacenar notas, podríamos agregar un campo notes al modelo
      // Por ahora, podríamos crear un log de auditoría
    }

    const updatedLoan = await prisma.loan.update({
      where: { id: params.id },
      data: updateData,
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

    return NextResponse.json(updatedLoan);

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

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Solo administradores pueden eliminar préstamos' }, { status: 403 });
    }

    const loan = await prisma.loan.findUnique({
      where: { id: params.id },
      include: {
        payments: true,
        amortizationSchedule: true
      }
    });

    if (!loan) {
      return NextResponse.json({ error: 'Préstamo no encontrado' }, { status: 404 });
    }

    // No permitir eliminar préstamos con pagos
    if (loan.payments.length > 0) {
      return NextResponse.json({
        error: 'No se puede eliminar un préstamo con pagos registrados'
      }, { status: 400 });
    }

    // Eliminar tabla de amortización y préstamo
    await prisma.$transaction([
      prisma.amortizationSchedule.deleteMany({
        where: { loanId: params.id }
      }),
      prisma.loan.delete({
        where: { id: params.id }
      })
    ]);

    return NextResponse.json({ message: 'Préstamo eliminado exitosamente' });

  } catch (error) {
    console.error('Error deleting loan:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
