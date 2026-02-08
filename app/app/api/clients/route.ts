export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getTenantPrisma } from '@/lib/tenant-db';
import { ClientStatus, EmploymentType } from '@prisma/client';

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
    const asesorId = searchParams.get('asesorId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    let whereClause: any = {};

    // Filtros según rol (El aislamiento por tenant ya lo hace getTenantPrisma)
    if (session.user.role === 'ASESOR') {
      // Asesor solo ve sus clientes asignados
      whereClause.asesorId = session.user.id;
    }

    // Filtros adicionales
    if (status && Object.values(ClientStatus).includes(status as ClientStatus)) {
      whereClause.status = status as ClientStatus;
    }

    if (asesorId && session.user.role === 'ADMIN') {
      whereClause.asesorId = asesorId;
    }

    const [clients, totalCount] = await Promise.all([
      tenantPrisma.client.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              email: true,
              role: true,
              status: true,
              createdAt: true
            }
          },
          asesor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          loans: {
            select: {
              id: true,
              loanNumber: true,
              principalAmount: true,
              balanceRemaining: true,
              status: true
            }
          },
          creditApplications: {
            select: {
              id: true,
              status: true,
              requestedAmount: true,
              createdAt: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      tenantPrisma.client.count({ where: whereClause })
    ]);

    return NextResponse.json({
      clients,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching clients:', error);
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
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      address,
      city,
      state,
      postalCode,
      monthlyIncome,
      employmentType,
      employerName,
      workAddress,
      yearsEmployed,
      creditScore,
      bankName,
      accountNumber,
      asesorId
    } = body;

    // Validaciones
    if (!firstName || !lastName || !phone) {
      return NextResponse.json({ error: 'Campos requeridos: firstName, lastName, phone' }, { status: 400 });
    }

    // Verificar email único si se proporciona (dentro del tenant)
    if (email) {
      const existingClient = await tenantPrisma.client.findFirst({
        where: { email }
      });

      if (existingClient) {
        return NextResponse.json({ error: 'El email ya está registrado en esta organización' }, { status: 400 });
      }
    }

    // Set asesorId - validate and handle empty strings
    let finalAsesorId: string | undefined = undefined;

    if (session.user.role === 'ASESOR') {
      // Asesores always assign clients to themselves
      finalAsesorId = session.user.id;
    } else if (session.user.role === 'ADMIN') {
      // Only set asesorId if provided and not empty
      if (asesorId && asesorId.trim() !== '') {
        // Verify the asesor exists and has ASESOR role
        const asesorExists = await tenantPrisma.user.findFirst({
          where: {
            id: asesorId,
            role: 'ASESOR',
            status: 'ACTIVE'
          }
        });

        if (!asesorExists) {
          return NextResponse.json(
            { error: 'El asesor seleccionado no existe o no está activo en esta organización' },
            { status: 400 }
          );
        }

        finalAsesorId = asesorId;
      }
    }

    const client = await tenantPrisma.client.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        address,
        city,
        state,
        postalCode,
        monthlyIncome: monthlyIncome ? parseFloat(monthlyIncome) : null,
        employmentType: employmentType as EmploymentType || null,
        employerName,
        workAddress,
        yearsEmployed: yearsEmployed ? parseInt(yearsEmployed) : null,
        creditScore: creditScore ? parseInt(creditScore) : null,
        bankName,
        accountNumber,
        asesorId: finalAsesorId
      },
      include: {
        asesor: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json(client, { status: 201 });

  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
