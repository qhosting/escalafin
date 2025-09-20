
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { ClientStatus, EmploymentType } from '@prisma/client';

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const asesorId = searchParams.get('asesorId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    let whereClause: any = {};

    // Filtros según rol
    if (user.role === 'ASESOR') {
      // Asesor solo ve sus clientes asignados
      whereClause.asesorId = user.id;
    }

    // Filtros adicionales
    if (status && Object.values(ClientStatus).includes(status as ClientStatus)) {
      whereClause.status = status as ClientStatus;
    }
    
    if (asesorId && user.role === 'ADMIN') {
      whereClause.asesorId = asesorId;
    }

    const [clients, totalCount] = await Promise.all([
      prisma.client.findMany({
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
      prisma.client.count({ where: whereClause })
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

    // Verificar email único si se proporciona
    if (email) {
      const existingClient = await prisma.client.findUnique({
        where: { email }
      });
      
      if (existingClient) {
        return NextResponse.json({ error: 'El email ya está registrado' }, { status: 400 });
      }
    }

    // Si el usuario es asesor, el cliente se asigna automáticamente a él
    const finalAsesorId = user.role === 'ASESOR' ? user.id : asesorId;

    const client = await prisma.client.create({
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
