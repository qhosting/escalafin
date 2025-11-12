
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

interface MigrationClient {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  currentBalance: number;
  lastPaymentDate?: string;
  monthlyIncome?: number;
  employmentType?: string;
  employerName?: string;
  workAddress?: string;
  yearsEmployed?: number;
  creditScore?: number;
  bankName?: string;
  accountNumber?: string;
  status?: string;
  notes?: string;
  originalSystem?: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado. Solo administradores pueden migrar clientes.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { clients, migration } = body;

    if (!Array.isArray(clients) || clients.length === 0) {
      return NextResponse.json(
        { error: 'Debe proporcionar al menos un cliente para migrar' },
        { status: 400 }
      );
    }

    if (!migration) {
      return NextResponse.json(
        { error: 'La bandera de migración debe estar activada' },
        { status: 400 }
      );
    }

    // Validar que todos los clientes tengan campos requeridos
    for (let i = 0; i < clients.length; i++) {
      const client = clients[i];
      if (!client.firstName || !client.lastName || !client.email || !client.phone) {
        return NextResponse.json(
          { error: `Cliente ${i + 1}: Faltan campos requeridos (nombre, apellido, email, teléfono)` },
          { status: 400 }
        );
      }
    }

    // Verificar emails duplicados en la base de datos
    const existingEmails = await prisma.client.findMany({
      where: {
        email: {
          in: clients.map(c => c.email).filter(Boolean)
        }
      },
      select: { email: true }
    });

    if (existingEmails.length > 0) {
      const duplicates = existingEmails.map(e => e.email).join(', ');
      return NextResponse.json(
        { error: `Los siguientes emails ya existen en el sistema: ${duplicates}` },
        { status: 400 }
      );
    }

    // Crear clientes migrados
    const createdClients = await Promise.all(
      clients.map(async (clientData: MigrationClient) => {
        const data: any = {
          firstName: clientData.firstName,
          lastName: clientData.lastName,
          email: clientData.email,
          phone: clientData.phone,
          status: (clientData.status as any) || 'ACTIVE',
          migratedFrom: clientData.originalSystem || 'Sistema Anterior',
          migrationDate: new Date(),
          initialBalance: clientData.currentBalance || 0,
        };

        // Agregar campos opcionales solo si existen
        if (clientData.dateOfBirth) {
          data.dateOfBirth = new Date(clientData.dateOfBirth);
        }
        if (clientData.address) data.address = clientData.address;
        if (clientData.city) data.city = clientData.city;
        if (clientData.state) data.state = clientData.state;
        if (clientData.postalCode) data.postalCode = clientData.postalCode;
        if (clientData.lastPaymentDate) {
          data.lastPaymentDate = new Date(clientData.lastPaymentDate);
        }
        if (clientData.monthlyIncome) data.monthlyIncome = clientData.monthlyIncome;
        if (clientData.employmentType) data.employmentType = clientData.employmentType;
        if (clientData.employerName) data.employerName = clientData.employerName;
        if (clientData.workAddress) data.workAddress = clientData.workAddress;
        if (clientData.yearsEmployed) data.yearsEmployed = clientData.yearsEmployed;
        if (clientData.creditScore) data.creditScore = clientData.creditScore;
        if (clientData.bankName) data.bankName = clientData.bankName;
        if (clientData.accountNumber) data.accountNumber = clientData.accountNumber;
        if (clientData.notes) data.notes = clientData.notes;

        // Crear el cliente
        const client = await prisma.client.create({
          data,
        });

        return {
          id: client.id,
          firstName: client.firstName,
          lastName: client.lastName,
          email: client.email,
          phone: client.phone,
          initialBalance: client.initialBalance,
          migratedFrom: client.migratedFrom,
        };
      })
    );

    return NextResponse.json({
      message: `Se migraron ${createdClients.length} cliente(s) exitosamente`,
      clients: createdClients,
    });

  } catch (error) {
    console.error('Error en migración de clientes:', error);
    return NextResponse.json(
      { error: 'Error al migrar clientes. Verifique los datos e intente nuevamente.' },
      { status: 500 }
    );
  }
}
