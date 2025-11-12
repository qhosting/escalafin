
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole, EmploymentType, ClientStatus } from '@prisma/client';

// GET - Obtener un cliente por ID con aval y garantías
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { id: params.id },
      include: {
        asesor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        guarantor: true,
        collaterals: {
          orderBy: {
            createdAt: 'desc'
          }
        },
        loans: {
          select: {
            id: true,
            loanNumber: true,
            principalAmount: true,
            balanceRemaining: true,
            status: true,
            startDate: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        creditApplications: {
          select: {
            id: true,
            status: true,
            requestedAmount: true,
            createdAt: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        _count: {
          select: {
            loans: true,
            creditApplications: true
          }
        }
      }
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    // Check if user has permission to view this client
    if (session.user.role === UserRole.ASESOR && client.asesorId !== session.user.id) {
      return NextResponse.json(
        { error: 'No autorizado para ver este cliente' },
        { status: 403 }
      );
    }

    return NextResponse.json(client);
  } catch (error) {
    console.error('Error fetching client:', error);
    return NextResponse.json(
      { error: 'Error al cargar cliente' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar un cliente con aval y garantías
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      status,
      asesorId,
      guarantor,
      collaterals
    } = body;

    // Check if client exists and user has permission
    const existingClient = await prisma.client.findUnique({
      where: { id: params.id }
    });

    if (!existingClient) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    if (session.user.role === UserRole.ASESOR && existingClient.asesorId !== session.user.id) {
      return NextResponse.json(
        { error: 'No autorizado para editar este cliente' },
        { status: 403 }
      );
    }

    // Prepare update data
    const updateData: any = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (email !== undefined) updateData.email = email || null;
    if (phone !== undefined) updateData.phone = phone;
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    if (address !== undefined) updateData.address = address;
    if (city !== undefined) updateData.city = city;
    if (state !== undefined) updateData.state = state;
    if (postalCode !== undefined) updateData.postalCode = postalCode;
    if (monthlyIncome !== undefined) updateData.monthlyIncome = monthlyIncome ? parseFloat(monthlyIncome) : null;
    if (employmentType !== undefined) updateData.employmentType = employmentType as EmploymentType;
    if (employerName !== undefined) updateData.employerName = employerName;
    if (workAddress !== undefined) updateData.workAddress = workAddress;
    if (yearsEmployed !== undefined) updateData.yearsEmployed = yearsEmployed ? parseInt(yearsEmployed) : null;
    if (creditScore !== undefined) updateData.creditScore = creditScore ? parseInt(creditScore) : null;
    if (bankName !== undefined) updateData.bankName = bankName;
    if (accountNumber !== undefined) updateData.accountNumber = accountNumber;
    if (status !== undefined) updateData.status = status as ClientStatus;
    
    // Only ADMIN can change asesorId
    if (session.user.role === UserRole.ADMIN && asesorId !== undefined) {
      if (asesorId && asesorId.trim() !== '') {
        // Verify the asesor exists
        const asesorExists = await prisma.user.findFirst({
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
        updateData.asesorId = asesorId;
      } else {
        updateData.asesorId = null;
      }
    }

    // Update client with guarantor and collaterals in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update the client
      const updatedClient = await tx.client.update({
        where: { id: params.id },
        data: updateData,
        include: {
          asesor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          guarantor: true,
          collaterals: true
        }
      });

      // Handle guarantor update/creation
      if (guarantor !== undefined) {
        if (guarantor && guarantor.fullName) {
          // Check if guarantor exists
          const existingGuarantor = await tx.guarantor.findUnique({
            where: { clientId: params.id }
          });

          if (existingGuarantor) {
            // Update existing guarantor
            await tx.guarantor.update({
              where: { clientId: params.id },
              data: {
                fullName: guarantor.fullName,
                address: guarantor.address || '',
                phone: guarantor.phone || '',
                relationship: guarantor.relationship || 'OTHER'
              }
            });
          } else {
            // Create new guarantor
            await tx.guarantor.create({
              data: {
                clientId: params.id,
                fullName: guarantor.fullName,
                address: guarantor.address || '',
                phone: guarantor.phone || '',
                relationship: guarantor.relationship || 'OTHER'
              }
            });
          }
        } else if (guarantor === null) {
          // Delete guarantor if explicitly set to null
          await tx.guarantor.deleteMany({
            where: { clientId: params.id }
          });
        }
      }

      // Handle collaterals update
      if (collaterals !== undefined && Array.isArray(collaterals)) {
        // Delete existing collaterals
        await tx.collateral.deleteMany({
          where: { clientId: params.id }
        });

        // Create new collaterals
        if (collaterals.length > 0) {
          const collateralData = collaterals.map((description: string) => ({
            clientId: params.id,
            description
          }));
          
          await tx.collateral.createMany({
            data: collateralData
          });
        }
      }

      return updatedClient;
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error updating client:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Ya existe un cliente con este email o teléfono' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error al actualizar cliente', details: error.message },
      { status: 500 }
    );
  }
}

// PATCH - Alias for PUT (same logic)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return PUT(request, { params });
}

// DELETE - Eliminar un cliente
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Check if client exists
    const client = await prisma.client.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            loans: true,
            creditApplications: true
          }
        }
      }
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    // Check if client has loans or credit applications
    if (client._count.loans > 0 || client._count.creditApplications > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar un cliente con préstamos o solicitudes de crédito asociadas' },
        { status: 400 }
      );
    }

    // Delete client (guarantor and collaterals will be deleted by cascade)
    await prisma.client.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Cliente eliminado exitosamente' });
  } catch (error) {
    console.error('Error deleting client:', error);
    return NextResponse.json(
      { error: 'Error al eliminar cliente' },
      { status: 500 }
    );
  }
}
