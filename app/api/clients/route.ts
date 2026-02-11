


import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getTenantPrisma } from '@/lib/tenant-db'; // Importar helper multi-tenant
import { UserRole, EmploymentType, ClientStatus } from '@prisma/client';
import { AuditLogger } from '@/lib/audit';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status');
    const asesorId = searchParams.get('asesorId');

    const skip = (page - 1) * limit;

    // Obtener instancia de Prisma con scope de Tenant
    // Si no tiene tenantId (ej. superadmin global o legacy), usar fallback o error
    const tenantId = session.user.tenantId;
    if (!tenantId) {
      console.warn('⚠️ Usuario sin tenantId intentando acceder a clientes');
      return NextResponse.json({ error: 'Error de configuración de cuenta (Sin Tenant)' }, { status: 403 });
    }

    const db = getTenantPrisma(tenantId);

    // Build where clause based on user role
    // NOTA: tenantId ya se inyecta automáticamente por getTenantPrisma en db.client.findMany
    const where: any = {};

    // If user is ASESOR, show only their clients
    if (session.user.role === UserRole.ASESOR) {
      where.asesorId = session.user.id;
    }

    // If asesorId is provided and user is ADMIN, filter by asesor
    if (asesorId && session.user.role === UserRole.ADMIN) {
      where.asesorId = asesorId;
    }

    // Filter by status if provided
    if (status) {
      where.status = status as ClientStatus;
    }

    // Count total records
    const totalCount = await db.client.count({ where });
    const totalPages = Math.ceil(totalCount / limit);

    // Get clients with related data
    const clients = await db.client.findMany({
      where,
      include: {
        asesor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        _count: {
          select: {
            loans: true,
            creditApplications: true
          }
        },
        loans: {
          select: {
            id: true,
            principalAmount: true,
            balanceRemaining: true,
            status: true
          }
        }
      },
      orderBy: [
        { createdAt: 'desc' }
      ],
      skip,
      take: limit
    });

    // Format response with aggregated data
    const formattedClients = clients.map((client: any) => {
      const totalLoans = client._count.loans;
      const totalAmount = client.loans.reduce(
        (sum: number, loan: any) => sum + Number(loan.balanceRemaining || 0),
        0
      );

      return {
        id: client.id,
        name: `${client.firstName} ${client.lastName}`,
        firstName: client.firstName,
        lastName: client.lastName,
        email: client.email || '',
        phone: client.phone,
        documentNumber: client.phone, // Using phone as document for now
        status: client.status,
        totalLoans,
        totalAmount,
        createdAt: client.createdAt,
        asesor: client.asesor ? {
          id: client.asesor.id,
          name: `${client.asesor.firstName} ${client.asesor.lastName}`,
          email: client.asesor.email
        } : null
      };
    });

    return NextResponse.json({
      data: formattedClients,
      meta: {
        total: totalCount,
        pages: totalPages,
        currentPage: page
      }
    }); // Ajusté respuesta a formato { data, meta } si es posible, o mantengo array si el frontend lo espera. 
    // MANTENER FORMATO ORIGINAL ARRAY PARA NO ROMPER FRONTEND POR AHORA
    return NextResponse.json(formattedClients);

  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json(
      { error: 'Error al cargar clientes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.ASESOR)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }


    // Obtener Tenant ID
    const tenantId = session.user.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: 'Configuración de cuenta inválida (Sin Tenant)' }, { status: 403 });
    }
    const db = getTenantPrisma(tenantId);

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
      asesorId,
      guarantor,
      collaterals
    } = body;

    // Validate required fields
    if (!firstName || !lastName || !phone) {
      return NextResponse.json(
        { error: 'Los campos nombre, apellido y teléfono son requeridos' },
        { status: 400 }
      );
    }

    // Check if email or phone already exists IN THIS TENANT
    if (email || phone) {
      const existingClient = await db.client.findFirst({
        where: {
          OR: [
            ...(email ? [{ email }] : []),
            ...(phone ? [{ phone }] : [])
          ]
        }
      });

      if (existingClient) {
        return NextResponse.json(
          { error: 'Ya existe un cliente con este email o teléfono en esta organización' },
          { status: 409 }
        );
      }
    }

    // Prepare data for creation
    const clientData: any = {
      firstName,
      lastName,
      email: email || null,
      phone,
      status: ClientStatus.ACTIVE,
      // tenantId se inyecta automáticamente por db.client.create, PERO en $transaction a veces es tricky si usamos tx.
      // El extension funciona sobre 'db'. Si usamos db.$transaction, tx hereda la extensión? 
      // SÍ, Prisma extensions transactions heredan contexto.
    };

    // Add optional fields
    if (dateOfBirth) clientData.dateOfBirth = new Date(dateOfBirth);
    if (address) clientData.address = address;
    if (city) clientData.city = city;
    if (state) clientData.state = state;
    if (postalCode) clientData.postalCode = postalCode;
    if (monthlyIncome) clientData.monthlyIncome = parseFloat(monthlyIncome);
    if (employmentType) clientData.employmentType = employmentType as EmploymentType;
    if (employerName) clientData.employerName = employerName;
    if (workAddress) clientData.workAddress = workAddress;
    if (yearsEmployed) clientData.yearsEmployed = parseInt(yearsEmployed);
    if (creditScore) clientData.creditScore = parseInt(creditScore);
    if (bankName) clientData.bankName = bankName;
    if (accountNumber) clientData.accountNumber = accountNumber;

    // Set asesorId - validate and handle empty strings
    if (session.user.role === UserRole.ADMIN) {
      // Only set asesorId if provided and not empty
      if (asesorId && asesorId.trim() !== '') {
        // Verify the asesor exists and has ASESOR role AND belongs to tenant
        // Usamos db.user.findFirst que inyecta tenantId
        const asesorExists = await db.user.findFirst({
          where: {
            id: asesorId,
            role: UserRole.ASESOR,
            status: 'ACTIVE'
          }
        });

        if (!asesorExists) {
          return NextResponse.json(
            { error: 'El asesor seleccionado no existe o no está activo' },
            { status: 400 }
          );
        }

        clientData.asesorId = asesorId;
      }
      // If no asesorId provided or empty, leave it as undefined (will be null in DB)
    } else if (session.user.role === UserRole.ASESOR) {
      // Asesores always assign clients to themselves
      clientData.asesorId = session.user.id;
    }

    // Create client with guarantor and collaterals in a transaction
    // Usamos db.$transaction para mantener el scope del tenant en las operaciones internas
    const result = await (db as any).$transaction(async (tx: any) => {
      // Create the client
      const client = await tx.client.create({
        data: clientData,
        include: {
          asesor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      // Create guarantor if provided
      if (guarantor && guarantor.fullName) {
        await tx.guarantor.create({
          data: {
            clientId: client.id,
            fullName: guarantor.fullName,
            address: guarantor.address || '',
            phone: guarantor.phone || '',
            relationship: guarantor.relationship || 'OTHER'
          }
        });
      }

      // Create collaterals if provided
      if (collaterals && Array.isArray(collaterals) && collaterals.length > 0) {
        const collateralData = collaterals.map((description: string) => ({
          clientId: client.id,
          description
        }));

        await tx.collateral.createMany({
          data: collateralData
        });
      }

      return client;
    });

    // Audit log
    await AuditLogger.quickLog(request, 'CLIENT_CREATE', {
      clientName: `${result.firstName} ${result.lastName}`,
      phone: result.phone
    }, 'Client', result.id, session);

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('Error creating client:', error);

    // Handle Prisma unique constraint violation
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Ya existe un cliente con este email o teléfono' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Error al crear cliente', details: error.message },
      { status: 500 }
    );
  }
}
