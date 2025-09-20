
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { UserRole } from '@prisma/client';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const creditApplication = await prisma.creditApplication.findUnique({
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
            dateOfBirth: true,
            address: true,
            city: true,
            employmentType: true,
            employerName: true,
            yearsEmployed: true,
            bankName: true,
          },
        },
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        reviewedByUser: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        loan: {
          select: {
            id: true,
            loanNumber: true,
            status: true,
          },
        },
      },
    });

    if (!creditApplication) {
      return NextResponse.json(
        { error: 'Solicitud de crédito no encontrada' },
        { status: 404 }
      );
    }

    // Role-based access control
    const hasAccess = 
      session.user.role === UserRole.ADMIN ||
      (session.user.role === UserRole.ASESOR && creditApplication.asesorId === session.user.id) ||
      (session.user.role === UserRole.CLIENTE && creditApplication.client.id === session.user.id);

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'No tienes permisos para ver esta solicitud' },
        { status: 403 }
      );
    }

    return NextResponse.json(creditApplication);
  } catch (error) {
    console.error('Error fetching credit application:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !['ADMIN', 'ASESOR'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const creditApplication = await prisma.creditApplication.findUnique({
      where: { id: params.id },
    });

    if (!creditApplication) {
      return NextResponse.json(
        { error: 'Solicitud de crédito no encontrada' },
        { status: 404 }
      );
    }

    // Only ASESOR who created it or ADMIN can modify
    if (session.user.role === UserRole.ASESOR && creditApplication.asesorId !== session.user.id) {
      return NextResponse.json(
        { error: 'No tienes permisos para modificar esta solicitud' },
        { status: 403 }
      );
    }

    const data = await request.json();

    const updatedCreditApplication = await prisma.creditApplication.update({
      where: { id: params.id },
      data: {
        loanType: data.loanType,
        requestedAmount: data.requestedAmount,
        requestedTerm: data.requestedTerm,
        purpose: data.purpose,
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
            monthlyIncome: true,
            creditScore: true,
          },
        },
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        reviewedByUser: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email!,
        action: 'UPDATE_CREDIT_APPLICATION',
        resource: 'CreditApplication',
        resourceId: params.id,
        details: JSON.stringify({
          changes: data,
        }),
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json(updatedCreditApplication);
  } catch (error) {
    console.error('Error updating credit application:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !['ADMIN', 'ASESOR'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const creditApplication = await prisma.creditApplication.findUnique({
      where: { id: params.id },
      include: {
        loan: true,
      },
    });

    if (!creditApplication) {
      return NextResponse.json(
        { error: 'Solicitud de crédito no encontrada' },
        { status: 404 }
      );
    }

    // Only ADMIN or the ASESOR who created it can delete
    if (session.user.role === UserRole.ASESOR && creditApplication.asesorId !== session.user.id) {
      return NextResponse.json(
        { error: 'No tienes permisos para eliminar esta solicitud' },
        { status: 403 }
      );
    }

    // Cannot delete if there's an associated loan
    if (creditApplication.loan) {
      return NextResponse.json(
        { error: 'No se puede eliminar una solicitud que ya tiene un préstamo asociado' },
        { status: 400 }
      );
    }

    await prisma.creditApplication.delete({
      where: { id: params.id },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email!,
        action: 'DELETE_CREDIT_APPLICATION',
        resource: 'CreditApplication',
        resourceId: params.id,
        details: JSON.stringify({
          deletedApplication: {
            clientId: creditApplication.clientId,
            loanType: creditApplication.loanType,
            requestedAmount: creditApplication.requestedAmount.toString(),
          },
        }),
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json({ message: 'Solicitud de crédito eliminada exitosamente' });
  } catch (error) {
    console.error('Error deleting credit application:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
