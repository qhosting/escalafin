

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole, EmploymentType, ClientStatus } from '@prisma/client';

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

    // Build where clause based on user role
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
    const totalCount = await prisma.client.count({ where });
    const totalPages = Math.ceil(totalCount / limit);

    // Get clients with related data
    const clients = await prisma.client.findMany({
      where,
      include: {
        asesor: {
          select: {
            id: true,
            name: true,
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
            loanAmount: true,
            remainingBalance: true,
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
        (sum: number, loan: any) => sum + Number(loan.remainingBalance || 0), 
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
        asesor: client.asesor
      };
    });

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

    // Validate required fields
    if (!firstName || !lastName || !phone) {
      return NextResponse.json(
        { error: 'Los campos nombre, apellido y teléfono son requeridos' },
        { status: 400 }
      );
    }

    // Check if email or phone already exists
    if (email) {
      const existingClient = await prisma.client.findFirst({
        where: {
          OR: [
            { email },
            { phone }
          ]
        }
      });

      if (existingClient) {
        return NextResponse.json(
          { error: 'Ya existe un cliente con este email o teléfono' },
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

    // Set asesorId
    if (session.user.role === UserRole.ADMIN && asesorId) {
      clientData.asesorId = asesorId;
    } else if (session.user.role === UserRole.ASESOR) {
      clientData.asesorId = session.user.id;
    }

    // Create client
    const client = await prisma.client.create({
      data: clientData,
      include: {
        asesor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json(client, { status: 201 });
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
