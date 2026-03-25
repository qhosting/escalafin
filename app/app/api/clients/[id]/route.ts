export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getTenantPrisma } from '@/lib/tenant-db';
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

    const tenantId = session.user.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant no encontrado' }, { status: 400 });
    }

    const tenantPrisma = getTenantPrisma(tenantId);
    const clientId = params.id;

    // Verificar permisos de rol
    let whereClause: any = { id: clientId };
    if (session.user.role === 'ASESOR') {
      whereClause.asesorId = session.user.id;
    }

    const client = await (tenantPrisma.client as any).findFirst({
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
        },
        guarantor: true,
        collaterals: true
      }
    });

    if (!client) {
      return NextResponse.json({ error: 'Cliente no encontrado o no pertenece a su tenant' }, { status: 404 });
    }

    const auditLogs = await (tenantPrisma.auditLog as any).findMany({
      where: {
        OR: [
          { resourceId: clientId },
          { details: { contains: clientId } }
        ]
      },
      select: {
        id: true,
        action: true,
        resource: true,
        details: true,
        timestamp: true,
        userEmail: true
      },
      orderBy: { timestamp: 'desc' },
      take: 10
    });

    return NextResponse.json({
      ...client,
      auditLogs
    });

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

    const tenantId = session.user.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant no encontrado' }, { status: 400 });
    }

    const tenantPrisma = getTenantPrisma(tenantId);
    const clientId = params.id;
    const body = await request.json();

    // Verificar permisos
    let whereClause: any = { id: clientId };
    if (session.user.role === 'ASESOR') {
      whereClause.asesorId = session.user.id;
    }

    const existingClient = await (tenantPrisma.client as any).findFirst({
      where: whereClause,
      include: { guarantor: true }
    });

    if (!existingClient) {
      return NextResponse.json({ error: 'Cliente no encontrado o no pertenece a su tenant' }, { status: 404 });
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
      asesorId,
      latitude,
      longitude,
      guarantor,
      collaterals,
      lateFeeType,
      lateFeeAmount,
      lateFeeMaxWeekly
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
    const finalAsesorId = session.user.role === 'ADMIN' && asesorId ? asesorId : existingClient.asesorId;

    const updatedClient = await (tenantPrisma.client as any).update({
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
        employmentType: employmentType as any || existingClient.employmentType,
        employerName: employerName || existingClient.employerName,
        workAddress: workAddress || existingClient.workAddress,
        yearsEmployed: yearsEmployed ? parseInt(yearsEmployed) : existingClient.yearsEmployed,
        creditScore: creditScore ? parseInt(creditScore) : existingClient.creditScore,
        bankName: bankName || existingClient.bankName,
        accountNumber: accountNumber || existingClient.accountNumber,
        status: status as any || existingClient.status,
        asesorId: finalAsesorId,
        latitude: latitude ? parseFloat(latitude) : existingClient.latitude,
        longitude: longitude ? parseFloat(longitude) : existingClient.longitude,
        guarantor: guarantor !== undefined ? (
          guarantor === null ? (existingClient.guarantor ? { delete: true } : undefined) : {
            upsert: {
              create: {
                fullName: guarantor.fullName,
                address: guarantor.address || '',
                phone: guarantor.phone || '',
                relationship: guarantor.relationship || 'OTHER',
                latitude: guarantor.latitude ? parseFloat(guarantor.latitude) : null,
                longitude: guarantor.longitude ? parseFloat(guarantor.longitude) : null,
                tenantId: existingClient.tenantId
              },
              update: {
                fullName: guarantor.fullName,
                address: guarantor.address || '',
                phone: guarantor.phone || '',
                relationship: guarantor.relationship || 'OTHER',
                latitude: guarantor.latitude ? parseFloat(guarantor.latitude) : (existingClient.guarantor as any)?.latitude,
                longitude: guarantor.longitude ? parseFloat(guarantor.longitude) : (existingClient.guarantor as any)?.longitude
              }
            }
          }
        ) : undefined,
        collaterals: collaterals !== undefined ? {
          deleteMany: {},
          create: collaterals.map((description: string) => ({
            description,
            tenantId: existingClient.tenantId
          }))
        } : undefined,
        lateFeeType: lateFeeType || (existingClient as any).lateFeeType,
        lateFeeAmount: lateFeeAmount ? parseFloat(lateFeeAmount) : (existingClient as any).lateFeeAmount,
        lateFeeMaxWeekly: lateFeeMaxWeekly ? parseFloat(lateFeeMaxWeekly) : (existingClient as any).lateFeeMaxWeekly
      },
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

    const tenantId = session.user.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant no encontrado' }, { status: 400 });
    }

    const tenantPrisma = getTenantPrisma(tenantId);
    const clientId = params.id;

    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Solo administradores pueden eliminar clientes' }, { status: 403 });
    }

    // Verificar que el cliente no tenga préstamos activos en este tenant
    const activeLoans = await (tenantPrisma.loan as any).findMany({
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

    await (tenantPrisma.client as any).delete({
      where: { id: clientId }
    });

    return NextResponse.json({ message: 'Cliente eliminado exitosamente' });

  } catch (error) {
    console.error('Error deleting client:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
