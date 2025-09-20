
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { ClientStatus, EmploymentType } from '@prisma/client';

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

    const client = await prisma.client.findUnique({
      where: { id: params.id },
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
          include: {
            amortizationSchedule: {
              select: {
                id: true,
                paymentNumber: true,
                paymentDate: true,
                isPaid: true
              }
            },
            payments: {
              select: {
                id: true,
                amount: true,
                paymentDate: true,
                status: true
              },
              orderBy: { paymentDate: 'desc' },
              take: 5
            }
          }
        },
        creditApplications: {
          orderBy: { createdAt: 'desc' }
        },
        creditScores: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    });

    if (!client) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    // Verificar permisos
    if (user.role === 'ASESOR' && client.asesorId !== user.id) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
    } else if (user.role === 'CLIENTE') {
      const clientProfile = await prisma.client.findFirst({
        where: { userId: user.id }
      });
      
      if (client.id !== clientProfile?.id) {
        return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
      }
    }

    return NextResponse.json(client);

  } catch (error) {
    console.error('Error fetching client:', error);
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

    const client = await prisma.client.findUnique({
      where: { id: params.id }
    });

    if (!client) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    // Verificar permisos de asesor
    if (user.role === 'ASESOR' && client.asesorId !== user.id) {
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
      status,
      asesorId
    } = body;

    // Verificar email único si se está actualizando
    if (email && email !== client.email) {
      const existingClient = await prisma.client.findUnique({
        where: { email }
      });
      
      if (existingClient) {
        return NextResponse.json({ error: 'El email ya está registrado' }, { status: 400 });
      }
    }

    const updateData: any = {};
    
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    if (address !== undefined) updateData.address = address;
    if (city !== undefined) updateData.city = city;
    if (state !== undefined) updateData.state = state;
    if (postalCode !== undefined) updateData.postalCode = postalCode;
    if (monthlyIncome !== undefined) updateData.monthlyIncome = monthlyIncome ? parseFloat(monthlyIncome) : null;
    if (employmentType !== undefined) updateData.employmentType = employmentType as EmploymentType || null;
    if (employerName !== undefined) updateData.employerName = employerName;
    if (workAddress !== undefined) updateData.workAddress = workAddress;
    if (yearsEmployed !== undefined) updateData.yearsEmployed = yearsEmployed ? parseInt(yearsEmployed) : null;
    if (creditScore !== undefined) updateData.creditScore = creditScore ? parseInt(creditScore) : null;
    if (bankName !== undefined) updateData.bankName = bankName;
    if (accountNumber !== undefined) updateData.accountNumber = accountNumber;
    
    // Solo admin puede cambiar status y asesor asignado
    if (user.role === 'ADMIN') {
      if (status && Object.values(ClientStatus).includes(status as ClientStatus)) {
        updateData.status = status as ClientStatus;
      }
      if (asesorId !== undefined) updateData.asesorId = asesorId;
    }

    const updatedClient = await prisma.client.update({
      where: { id: params.id },
      data: updateData,
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

    return NextResponse.json(updatedClient);

  } catch (error) {
    console.error('Error updating client:', error);
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
      return NextResponse.json({ error: 'Solo administradores pueden eliminar clientes' }, { status: 403 });
    }

    const client = await prisma.client.findUnique({
      where: { id: params.id },
      include: {
        loans: true,
        creditApplications: true
      }
    });

    if (!client) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    // No permitir eliminar clientes con préstamos activos
    if (client.loans.length > 0) {
      return NextResponse.json({ 
        error: 'No se puede eliminar un cliente con préstamos registrados' 
      }, { status: 400 });
    }

    // Eliminar cliente (esto también eliminará las solicitudes de crédito por CASCADE)
    await prisma.client.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Cliente eliminado exitosamente' });

  } catch (error) {
    console.error('Error deleting client:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
