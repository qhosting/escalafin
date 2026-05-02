
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

async function main() {
    const prisma = new PrismaClient();
    const targetSlug = 'prestamossjr';
    const dataPath = 'c:\\Users\\Admin\\Proyectos\\escalafin\\app\\scratch\\extraction_results.md';

    try {
        const tenant = await prisma.tenant.findUnique({
            where: { slug: targetSlug }
        });

        if (!tenant) {
            console.error(`Tenant ${targetSlug} not found`);
            return;
        }

        const tenantId = tenant.id;
        console.log(`Checking database for tenant: ${tenant.name} (${tenantId})`);

        if (!fs.existsSync(dataPath)) {
            console.error(`File not found: ${dataPath}`);
            return;
        }

        const content = fs.readFileSync(dataPath, 'utf-8');
        const clientBlocks = content.split('### ').slice(1);
        
        const results = [];

        for (const block of clientBlocks) {
            const lines = block.split('\n');
            const name = lines[0].trim();
            
            // Extract expected payments from block
            const paymentLines = block.split('\n').filter(l => l.includes('|') && !l.includes('Semana') && !l.includes('---'));
            const expectedPaymentsCount = paymentLines.filter(l => l.includes('$') || l.includes('✓')).length;

            // Search for client in DB
            const dbClient = await prisma.client.findFirst({
                where: { 
                    tenantId,
                    firstName: { contains: name.split(' ')[0], mode: 'insensitive' }
                },
                include: {
                    loans: {
                        include: {
                            payments: true
                        }
                    }
                }
            });

            if (dbClient) {
                const totalPayments = dbClient.loans.reduce((sum, loan) => sum + loan.payments.length, 0);
                const totalAmountPaid = dbClient.loans.reduce((sum, loan) => 
                    sum + loan.payments.reduce((pSum, p) => pSum + Number(p.amount), 0), 0);

                results.push({
                    name,
                    status: 'EXISTS',
                    expectedPayments: expectedPaymentsCount,
                    dbPayments: totalPayments,
                    dbAmount: totalAmountPaid,
                    diff: expectedPaymentsCount - totalPayments
                });
            } else {
                results.push({
                    name,
                    status: 'MISSING',
                    expectedPayments: expectedPaymentsCount,
                    dbPayments: 0,
                    dbAmount: 0,
                    diff: expectedPaymentsCount
                });
            }
        }

        console.log('\n--- DETAILED PAYMENT RECONCILIATION ---');
        console.table(results.map(r => ({
            "Cliente": r.name,
            "Estado": r.status,
            "Pagos (Extracción)": r.expectedPayments,
            "Pagos (DB)": r.dbPayments,
            "Diferencia": r.diff === 0 ? 'OK' : (r.diff > 0 ? `FALTAN ${r.diff}` : `EXTRA ${Math.abs(r.diff)}`),
            "Total Pagado (DB)": `$${r.dbAmount.toFixed(2)}`
        })));

        const missing = results.filter(r => r.diff > 0).length;
        const total = results.length;
        console.log(`\nResumen: ${missing}/${total} clientes tienen pagos pendientes por cargar o no existen.`);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
