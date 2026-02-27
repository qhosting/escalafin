
import { PrismaClient, PaymentFrequency, LoanType, LoanCalculationType, LoanStatus } from '@prisma/client';

async function main() {
    const url = "postgres://postgres:7fc6f898f29e38e2ea54@cloud.qhosting.net:1088/escalafin-db?sslmode=disable";
    const prisma = new PrismaClient({ datasources: { db: { url } } });

    const targetSlug = 'prestamossjr';

    try {
        const tenant = await prisma.tenant.findUnique({
            where: { slug: targetSlug }
        });

        if (!tenant) {
            console.error(`Tenant ${targetSlug} not found`);
            return;
        }

        const tenantId = tenant.id;
        console.log(`Found tenant: ${tenant.name} (${tenantId})`);

        const clientsWithBalance = await prisma.client.findMany({
            where: {
                tenantId,
                initialBalance: { gt: 0 },
                loans: { none: {} } // Solo los que no tengan préstamos ya creados
            }
        });

        console.log(`Found ${clientsWithBalance.length} clients with balance needing a migration loan.`);

        let createdCount = 0;

        for (const client of clientsWithBalance) {
            try {
                // Extraer pago semanal de las notas si existe
                let weeklyPayment = 0;
                if (client.notes) {
                    const match = client.notes.match(/PAGO SEMANAL:\s*(\d+(\.\d+)?)/i);
                    if (match) {
                        weeklyPayment = parseFloat(match[1]);
                    }
                }

                const loanNumber = `MIG-${client.firstName.substring(0, 3).toUpperCase()}-${client.phone.slice(-4)}-${Math.floor(Math.random() * 1000)}`;

                const balance = client.initialBalance ? Number(client.initialBalance) : 0;

                await prisma.loan.create({
                    data: {
                        tenantId,
                        clientId: client.id,
                        loanNumber,
                        loanType: LoanType.PERSONAL,
                        loanCalculationType: LoanCalculationType.INTERES,
                        principalAmount: balance,
                        interestRate: 0,
                        termMonths: 12,
                        paymentFrequency: weeklyPayment > 0 ? PaymentFrequency.SEMANAL : PaymentFrequency.MENSUAL,
                        monthlyPayment: weeklyPayment > 0 ? weeklyPayment : 0,
                        totalAmount: balance,
                        balanceRemaining: balance,
                        status: LoanStatus.ACTIVE,
                        startDate: new Date(),
                        endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
                    }
                });

                console.log(`Created migration loan for ${client.firstName} ${client.lastName} - Balance: ${balance}`);
                createdCount++;
            } catch (loanError) {
                console.error(`Error creating loan for client ${client.id}:`, loanError);
            }
        }

        console.log(`\n--- MIGRATION LOANS SUMMARY ---`);
        console.log(`Created: ${createdCount}`);

    } catch (err) {
        console.error('Fatal error:', err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
