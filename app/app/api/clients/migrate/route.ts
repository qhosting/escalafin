
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Solo admins pueden migrar clientes
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Solo administradores pueden migrar clientes' },
        { status: 403 }
      );
    }

    const { clients, migration } = await req.json();

    if (!clients || !Array.isArray(clients)) {
      return NextResponse.json(
        { error: 'Datos de clientes inválidos' },
        { status: 400 }
      );
    }

    const migratedClients = [];
    const errors = [];

    for (const clientData of clients) {
      try {
        // Validar campos requeridos
        if (!clientData.firstName || !clientData.lastName || !clientData.email || !clientData.phone) {
          errors.push(`Cliente incompleto: ${clientData.firstName} ${clientData.lastName}`);
          continue;
        }

        // Verificar si el cliente ya existe
        const existingClient = await prisma.client.findFirst({
          where: {
            OR: [
              { email: clientData.email },
              { phone: clientData.phone }
            ]
          }
        });

        if (existingClient) {
          errors.push(`Cliente ya existe: ${clientData.email}`);
          continue;
        }

        // Crear cliente con datos de migración
        const newClient = await prisma.client.create({
          data: {
            firstName: clientData.firstName,
            lastName: clientData.lastName,
            email: clientData.email,
            phone: clientData.phone,
            address: clientData.address || null,
            monthlyIncome: clientData.monthlyIncome ? parseFloat(clientData.monthlyIncome.toString()) : null,
            creditScore: clientData.creditScore ? parseInt(clientData.creditScore.toString()) : null,
            notes: clientData.notes || null,
            // Campos específicos para migración
            migratedFrom: clientData.originalSystem || 'Manual Migration',
            migrationDate: new Date(),
            initialBalance: clientData.currentBalance ? parseFloat(clientData.currentBalance.toString()) : 0,
            lastPaymentDate: clientData.lastPaymentDate ? new Date(clientData.lastPaymentDate) : null,
          }
        });

        // El saldo inicial se guarda en el campo initialBalance del cliente
        // No necesitamos crear pagos sin un préstamo asociado

        migratedClients.push({
          id: newClient.id,
          firstName: newClient.firstName,
          lastName: newClient.lastName,
          email: newClient.email,
          phone: newClient.phone,
          initialBalance: clientData.currentBalance || 0,
          migratedFrom: newClient.migratedFrom
        });

      } catch (clientError) {
        console.error('Error migrating client:', clientError);
        errors.push(`Error procesando ${clientData.firstName} ${clientData.lastName}: ${clientError instanceof Error ? clientError.message : 'Error desconocido'}`);
      }
    }

    // Crear log de auditoría
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'CLIENT_MIGRATION',
        resource: 'Client',
        resourceId: 'BULK',
        details: JSON.stringify({
          totalClients: clients.length,
          successfulMigrations: migratedClients.length,
          errors: errors.length,
          migratedClients: migratedClients.map(c => ({ id: c.id, name: `${c.firstName} ${c.lastName}` }))
        })
      }
    });

    return NextResponse.json({
      success: true,
      clients: migratedClients,
      errors,
      summary: {
        total: clients.length,
        migrated: migratedClients.length,
        failed: errors.length
      }
    });

  } catch (error) {
    console.error('Migration API error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor durante la migración' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Obtener estadísticas de migración
    const migratedClients = await prisma.client.findMany({
      where: {
        migratedFrom: {
          not: null
        }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        migratedFrom: true,
        migrationDate: true,
        initialBalance: true
      },
      orderBy: {
        migrationDate: 'desc'
      }
    });

    const migrationStats = {
      totalMigrated: migratedClients.length,
      bySource: migratedClients.reduce((acc, client) => {
        const source = client.migratedFrom || 'Unknown';
        acc[source] = (acc[source] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      totalInitialBalance: migratedClients.reduce((sum, client) => sum + (client.initialBalance ? Number(client.initialBalance) : 0), 0)
    };

    return NextResponse.json({
      migratedClients,
      stats: migrationStats
    });

  } catch (error) {
    console.error('Migration stats error:', error);
    return NextResponse.json(
      { error: 'Error obteniendo estadísticas de migración' },
      { status: 500 }
    );
  }
}
