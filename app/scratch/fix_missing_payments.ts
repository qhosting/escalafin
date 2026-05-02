
import { PrismaClient, PaymentMethod, LoanStatus } from '@prisma/client';
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
        const adminUser = await prisma.user.findFirst({
            where: { tenantId, role: 'ADMIN' }
        });

        console.log(`Starting payment correction for: ${tenant.name}`);

        if (!fs.existsSync(dataPath)) {
            console.error(`File not found: ${dataPath}`);
            return;
        }

        const content = fs.readFileSync(dataPath, 'utf-8');
        const clientBlocks = content.split('### ').slice(1);
        
        let totalPaymentsCreated = 0;
        let clientsProcessed = 0;

        for (const block of clientBlocks) {
            const lines = block.split('\n');
            const name = lines[0].trim();
            
            // Find client in DB
            const dbClient = await prisma.client.findFirst({
                where: { 
                    tenantId,
                    firstName: { contains: name.split(' ')[0], mode: 'insensitive' }
                },
                include: {
                    loans: {
                        where: { status: { in: ['ACTIVE', 'DEFAULTED'] } },
                        include: {
                            payments: true,
                            amortizationSchedule: {
                                orderBy: { paymentNumber: 'asc' }
                            }
                        }
                    }
                }
            });

            if (!dbClient || dbClient.loans.length === 0) {
                // If no active loan, check for PAID loans too if we want to backfill
                continue;
            }

            const loan = dbClient.loans[0]; // Assuming one primary loan for this correction
            const existingPayments = loan.payments;
            
            // Parse payments from block
            const paymentLines = block.split('\n').filter(l => l.includes('|') && !l.includes('Semana') && !l.includes('---'));
            
            let clientPaymentsCreated = 0;

            for (const pl of paymentLines) {
                const cells = pl.split('|').map(c => c.trim()).filter(c => c !== '');
                if (cells.length < 3) continue;

                const weekNum = parseInt(cells[0]);
                const amountStr = cells[2];
                const isPaid = amountStr.includes('$') || amountStr.toLowerCase() === '✓';
                
                if (!isPaid) continue;

                const amount = parseFloat(amountStr.replace('$', '').replace(/,/g, '')) || (Number(loan.monthlyPayment));

                // Check if this payment already exists
                // We compare amount and week number (if stored in notes or matches schedule)
                const alreadyExists = existingPayments.some(p => 
                    Math.abs(Number(p.amount) - amount) < 0.01 && 
                    (p.notes?.includes(`semana ${weekNum}`) || p.notes?.includes(`Semana ${weekNum}`))
                );

                if (!alreadyExists) {
                    // Try to find matching schedule entry
                    const scheduleEntry = loan.amortizationSchedule.find(s => s.paymentNumber === weekNum);

                    // Create Payment
                    await prisma.payment.create({
                        data: {
                            tenantId,
                            loanId: loan.id,
                            amortizationScheduleId: scheduleEntry?.id,
                            amount: amount,
                            paymentDate: scheduleEntry?.paymentDate || new Date(),
                            paymentMethod: PaymentMethod.CASH,
                            processedBy: adminUser?.id,
                            status: 'COMPLETED',
                            notes: `Corrección: Pago extraído semana ${weekNum}`
                        }
                    });
                    clientPaymentsCreated++;
                    totalPaymentsCreated++;
                }
            }

            if (clientPaymentsCreated > 0) {
                // Recalculate loan balance
                const allPayments = await prisma.payment.findMany({
                    where: { loanId: loan.id, status: 'COMPLETED' }
                });
                const totalPaid = allPayments.reduce((sum, p) => sum + Number(p.amount), 0);
                const newBalance = Number(loan.totalAmount) - totalPaid;

                await prisma.loan.update({
                    where: { id: loan.id },
                    data: {
                        balanceRemaining: Math.max(0, newBalance),
                        status: newBalance <= 0.1 ? LoanStatus.PAID : LoanStatus.ACTIVE
                    }
                });
                
                console.log(`Updated ${name}: Added ${clientPaymentsCreated} payments. New balance: $${newBalance.toFixed(2)}`);
            }
            clientsProcessed++;
        }

        console.log(`\n--- FINAL SUMMARY ---`);
        console.log(`Clients processed: ${clientsProcessed}`);
        console.log(`Total new payments created: ${totalPaymentsCreated}`);

    } catch (err) {
        console.error('Error during correction:', err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
