
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getTenantPrisma } from '@/lib/tenant-db';
import { calculateLoanDetails, generateAmortizationSchedule } from '@/lib/loan-calculations';
import { LoanCalculationType, PaymentFrequency, LoanType } from '@prisma/client';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    const tenantPrisma = getTenantPrisma(tenantId);

    // Permite ADMIN y SUPER_ADMIN
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Sin permisos: Solo administradores pueden migrar clientes' },
        { status: 403 }
      );
    }

    const { clients, migration, loanSettings } = await req.json();

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
        const existingClient = await tenantPrisma.client.findFirst({
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
        const newClient = await tenantPrisma.client.create({
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
            lateFeeType: loanSettings?.lateFeeType || 'DAILY_FIXED',
            lateFeeAmount: loanSettings?.lateFeeAmount ? parseFloat(loanSettings.lateFeeAmount.toString()) : 200,
            lateFeeMaxWeekly: loanSettings?.lateFeeMaxWeekly ? parseFloat(loanSettings.lateFeeMaxWeekly.toString()) : 800
          }
        });

        // El saldo inicial se guarda en el campo initialBalance del cliente
        // Si hay configuración de préstamo, crearlo automáticamente
        if (loanSettings && clientData.currentBalance > 0) {
          const principal = parseFloat(clientData.currentBalance.toString());
          const calculations = calculateLoanDetails({
            loanCalculationType: loanSettings.loanCalculationType as LoanCalculationType,
            principalAmount: principal,
            numberOfPayments: parseInt(loanSettings.termMonths.toString()),
            paymentFrequency: loanSettings.paymentFrequency as PaymentFrequency,
            annualInterestRate: parseFloat((loanSettings.interestRate || 0).toString()) / 100,
            startDate: new Date(loanSettings.startDate || new Date())
          });

          const currentYear = new Date().getFullYear();
          const loanCount = await tenantPrisma.loan.count() + 1;
          const loanNumber = `MIG-${currentYear}-${loanCount.toString().padStart(4, '0')}`;

          const loan = await tenantPrisma.loan.create({
            data: {
              clientId: newClient.id,
              loanNumber,
              loanType: 'PERSONAL' as LoanType, // Default para migración
              loanCalculationType: loanSettings.loanCalculationType as LoanCalculationType,
              principalAmount: principal,
              interestRate: parseFloat((loanSettings.interestRate || 0).toString()) / 100,
              termMonths: parseInt(loanSettings.termMonths.toString()),
              paymentFrequency: loanSettings.paymentFrequency as PaymentFrequency,
              monthlyPayment: calculations.paymentAmount,
              totalAmount: calculations.totalAmount,
              balanceRemaining: principal,
              startDate: new Date(loanSettings.startDate || new Date()),
              endDate: calculations.endDate,
              notes: `Migración masiva - ${clientData.originalSystem || 'Manual'}`,
              lateFeeType: loanSettings.lateFeeType || 'DAILY_FIXED',
              lateFeeAmount: loanSettings.lateFeeAmount ? parseFloat(loanSettings.lateFeeAmount.toString()) : 200,
              lateFeeMaxWeekly: loanSettings.lateFeeMaxWeekly ? parseFloat(loanSettings.lateFeeMaxWeekly.toString()) : 800
            }
          });

          // Amortización
          const amortizationEntries = generateAmortizationSchedule({
            principalAmount: principal,
            numberOfPayments: parseInt(loanSettings.termMonths.toString()),
            paymentFrequency: loanSettings.paymentFrequency as PaymentFrequency,
            loanCalculationType: loanSettings.loanCalculationType as LoanCalculationType,
            annualInterestRate: parseFloat((loanSettings.interestRate || 0).toString()) / 100,
            startDate: new Date(loanSettings.startDate || new Date()),
            paymentAmount: calculations.paymentAmount
          });

          await (tenantPrisma as any).amortizationSchedule.createMany({
            data: amortizationEntries.map(entry => ({
              loanId: loan.id,
              paymentNumber: entry.paymentNumber,
              paymentDate: entry.paymentDate,
              principalPayment: entry.principalPayment,
              interestPayment: entry.interestPayment,
              totalPayment: entry.totalPayment,
              remainingBalance: entry.remainingBalance
            }))
          });
        }

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
    await tenantPrisma.auditLog.create({
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

    if (!session?.user?.id || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const tenantId = session.user.tenantId;
    const tenantPrisma = getTenantPrisma(tenantId);

    // Obtener estadísticas de migración
    const migratedClients = await tenantPrisma.client.findMany({
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
