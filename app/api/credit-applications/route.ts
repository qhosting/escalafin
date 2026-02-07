
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getTenantPrisma } from '@/lib/tenant-db';
import { CreateCreditApplicationData } from '@/lib/api/credit-applications';
import { UserRole, ApplicationStatus } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !['ADMIN', 'ASESOR', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const tenantId = session.user.tenantId;
    const tenantPrisma = getTenantPrisma(tenantId);

    const data: CreateCreditApplicationData = await request.json();

    // Validation
    if (!data.clientId || !data.loanType || !data.requestedAmount || !data.requestedTerm || !data.purpose) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      );
    }

    if (data.requestedAmount <= 0) {
      return NextResponse.json(
        { error: 'El monto solicitado debe ser mayor a 0' },
        { status: 400 }
      );
    }

    if (data.requestedTerm <= 0 || data.requestedTerm > 360) {
      return NextResponse.json(
        { error: 'El plazo debe estar entre 1 y 360 meses' },
        { status: 400 }
      );
    }

    // Verify client exists (scoped to tenant)
    const client = await tenantPrisma.client.findUnique({
      where: { id: data.clientId },
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    // Create credit application (tenantId is injected)
    const creditApplication = await tenantPrisma.creditApplication.create({
      data: {
        clientId: data.clientId,
        asesorId: session.user.id,
        loanType: data.loanType,
        requestedAmount: data.requestedAmount,
        requestedTerm: data.requestedTerm,
        purpose: data.purpose,
        status: ApplicationStatus.PENDING,
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
      },
    });

    // Create audit log (tenantId is injected)
    await tenantPrisma.auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email!,
        action: 'CREATE_CREDIT_APPLICATION',
        resource: 'CreditApplication',
        resourceId: creditApplication.id,
        details: JSON.stringify({
          clientId: data.clientId,
          loanType: data.loanType,
          requestedAmount: data.requestedAmount,
          requestedTerm: data.requestedTerm,
        }),
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json(creditApplication, { status: 201 });
  } catch (error) {
    console.error('Error creating credit application:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const tenantId = session.user.tenantId;
    const tenantPrisma = getTenantPrisma(tenantId);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as ApplicationStatus | null;
    const clientId = searchParams.get('clientId');
    const asesorId = searchParams.get('asesorId');

    // Build filter conditions
    const where: any = {};

    // Role-based filtering
    if (session.user.role === UserRole.ASESOR) {
      where.asesorId = session.user.id;
    } else if (session.user.role === UserRole.CLIENTE) {
      const clientProfile = await tenantPrisma.client.findUnique({
        where: { userId: session.user.id },
      });
      if (clientProfile) {
        where.clientId = clientProfile.id;
      } else {
        return NextResponse.json([], { status: 200 });
      }
    }

    // Apply additional filters
    if (status) where.status = status;
    if (clientId) where.clientId = clientId;
    if (asesorId && (session.user.role === UserRole.ADMIN || session.user.role === UserRole.SUPER_ADMIN)) {
      where.asesorId = asesorId;
    }

    const creditApplications = await tenantPrisma.creditApplication.findMany({
      where,
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(creditApplications);
  } catch (error) {
    console.error('Error fetching credit applications:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
