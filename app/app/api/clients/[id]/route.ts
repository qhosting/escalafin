
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

    const clientId = params.id;

    // Verificar permisos
    let whereClause: any = { id: clientId };
    if (user.role === 'ASESOR') {
      whereClause.asesorId = user.id;
    }

    const client = await prisma.client.findFirst({
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
            interestRate: true,
            status: true,
            startDate: true,
            endDate: true,
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
          select: {
            id: true,
            requestedAmount: true,
            status: true,
            createdAt: true,
            reviewedAt: true
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!client) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    return NextResponse.json(client);

  } catch (error) {
    console.error('Error fetching client:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PATCH(
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

    const clientId = params.id;
    const body = await request.json();

    // Verificar que el cliente existe y el usuario tiene permisos
    let whereClause: any = { id: clientId };
    if (user.role === 'ASESOR') {
      whereClause.asesorId = user.id;
    }

    const existingClient = await prisma.client.findFirst({
      where: whereClause
    });

    if (!existingClient) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

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
    if (email && email !== existingClient.email) {
      const emailExists = await prisma.client.findUnique({
        where: { email }
      });
      
      if (emailExists) {
        return NextResponse.json({ error: 'El email ya está registrado' }, { status: 400 });
      }
    }

    // Solo admin puede cambiar el asesor asignado
    const finalAsesorId = user.role === 'ADMIN' && asesorId ? asesorId : existingClient.asesorId;

    const updatedClient = await prisma.client.update({
      where: { id: clientId },
      data: {
        firstName: firstName || existingClient.firstName,
        lastName: lastName || existingClient.lastName,
        email: email || existingClient.email,
        phone: phone || existingClient.phone,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : existingClient.dateOfBirth,
        address: address || existingClient.address,
        city: city || existingClient.city,
        state: state || existingClient.state,
        postalCode: postalCode || existingClient.postalCode,
        monthlyIncome: monthlyIncome ? parseFloat(monthlyIncome) : existingClient.monthlyIncome,
        employmentType: employmentType as EmploymentType || existingClient.employmentType,
        employerName: employerName || existingClient.employerName,
        workAddress: workAddress || existingClient.workAddress,
        yearsEmployed: yearsEmployed ? parseInt(yearsEmployed) : existingClient.yearsEmployed,
        creditScore: creditScore ? parseInt(creditScore) : existingClient.creditScore,
        bankName: bankName || existingClient.bankName,
        accountNumber: accountNumber || existingClient.accountNumber,
        status: status as ClientStatus || existingClient.status,
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

    const clientId = params.id;

    // Verificar que el cliente no tenga préstamos activos
    const activeLoans = await prisma.loan.findMany({
      where: {
        clientId,
        status: 'ACTIVE'
      }
    });

    if (activeLoans.length > 0) {
      return NextResponse.json({ 
        error: 'No se puede eliminar un cliente con préstamos activos' 
      }, { status: 400 });
    }

    await prisma.client.delete({
      where: { id: clientId }
    });

    return NextResponse.json({ message: 'Cliente eliminado exitosamente' });

  } catch (error) {
    console.error('Error deleting client:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
