import { PrismaClient, LoanType, LoanCalculationType, LoanStatus, PaymentFrequency } from '@prisma/client';
import * as XLSX from 'xlsx';

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

        console.log('Clearing existing data...');
        // Clear relations first
        await prisma.paymentTransaction.deleteMany({ where: { payment: { loan: { tenantId } } } });
        await prisma.payment.deleteMany({ where: { loan: { tenantId } } });
        const loans = await prisma.loan.findMany({ where: { tenantId }, select: { id: true } });
        const loanIds = loans.map(l => l.id);
        if (loanIds.length > 0) {
            await prisma.amortizationSchedule.deleteMany({ where: { loanId: { in: loanIds } } });
        }
        await prisma.loan.deleteMany({ where: { tenantId } });
        await prisma.personalReference.deleteMany({ where: { client: { tenantId } } });

        // Check if guarantor or collateral have client relation issue. We'll simply try deleting clients since cascade usually exists.
        try {
            const result = await prisma.client.deleteMany({
                where: { tenantId }
            });
            console.log(`Deleted ${result.count} existing clients.`);
        } catch (err) {
            console.warn('Failed initial client delete, falling back to finding clients and deleting relations one by one.');
        }

        console.log('Reading XLSX...');
        const workbook = XLSX.readFile('../temporal/plantilla_sistemaprestamos.xlsx');
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawData = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });

        const rows = rawData.slice(1);
        let injected = 0;

        for (const row of rows) {
            if (!row || !row[0]) continue;

            try {
                const rawName = String(row[0] || '').trim();
                const address = String(row[1] || '').trim();
                const phone = String(row[2] || '').trim();
                const avalName = String(row[3] || '').trim();
                const avalAddress = String(row[4] || '').trim();
                const avalPhone = String(row[5] || '').trim();

                let paymentAmount = 0;
                let balance = 0;
                let originalLoan = 0;

                if (row[21]) paymentAmount = parseFloat(row[21].toString());
                if (row[23]) balance = parseFloat(row[23].toString());
                if (row[24]) originalLoan = parseFloat(row[24].toString());

                const nameParts = rawName.split(' ');
                const firstName = nameParts[0] || 'Desconocido';
                const lastName = nameParts.slice(1).join(' ') || '';

                const fakeEmail = `${firstName.toLowerCase().replace(/[^a-z]/g, '')}.${Math.floor(Math.random() * 100000)}@prestamossjr.local`;

                const client = await prisma.client.create({
                    data: {
                        tenantId,
                        firstName,
                        lastName,
                        email: fakeEmail,
                        phone: phone || '0000000000',
                        address: address || null,
                        initialBalance: balance,
                        migratedFrom: 'plantilla_sistemaprestamos.xlsx',
                        migrationDate: new Date(),
                        notes: `Aval: ${avalName} - Tel: ${avalPhone} - Dir: ${avalAddress}`
                    }
                });

                if (balance > 0) {
                    const loanNumber = `MIG-${firstName.substring(0, 3).toUpperCase()}-${(phone || '0000').slice(-4)}-${Math.floor(Math.random() * 1000)}`;
                    await prisma.loan.create({
                        data: {
                            tenantId,
                            clientId: client.id,
                            loanNumber,
                            loanType: LoanType.PERSONAL,
                            loanCalculationType: LoanCalculationType.INTERES,
                            principalAmount: originalLoan > 0 ? originalLoan : balance,
                            interestRate: 0,
                            termMonths: 12,
                            paymentFrequency: PaymentFrequency.SEMANAL,
                            monthlyPayment: paymentAmount > 0 ? paymentAmount : 0,
                            totalAmount: originalLoan > 0 ? originalLoan : balance,
                            balanceRemaining: balance,
                            status: LoanStatus.ACTIVE,
                            startDate: new Date(),
                            endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
                        }
                    });
                }

                injected++;
            } catch (err) {
                console.error(`Error with row: ${row[0]}`, err);
            }
        }

        console.log(`\n--- MIGRATION COMPLETE ---`);
        console.log(`Successfully injected ${injected} clients and created their active loans.`);

    } catch (err) {
        console.error('Fatal error:', err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
