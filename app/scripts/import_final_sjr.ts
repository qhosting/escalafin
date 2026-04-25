
import { PrismaClient, PaymentFrequency, LoanType, LoanCalculationType, LoanStatus, PaymentMethod, ClientStatus } from '@prisma/client';
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
        console.log(`Found tenant: ${tenant.name} (${tenantId})`);

        // Find an admin user to process payments
        const adminUser = await prisma.user.findFirst({
            where: { tenantId, role: 'ADMIN' }
        });

        console.log('Reading extracted data...');
        const content = fs.readFileSync(dataPath, 'utf-8');
        
        // Split content by client headers
        const clientBlocks = content.split('### ').slice(1);
        console.log(`Found ${clientBlocks.length} potential records.`);

        let successCount = 0;
        let errorCount = 0;

        for (const block of clientBlocks) {
            const lines = block.split('\n');
            const name = lines[0].trim();
            
            const amountMatch = block.match(/\*\*Monto de Crédito:\*\*\s*\$(.*)/);
            const startDateMatch = block.match(/\*\*Fecha de Inicio:\*\*\s*(.*)/);
            
            if (!amountMatch) {
                console.warn(`Skip ${name}: No amount found`);
                continue;
            }

            const principalAmount = parseFloat(amountMatch[1].replace(/,/g, '').trim());
            const startDateStr = startDateMatch ? startDateMatch[1].trim() : '';
            
            // Parse start date
            let startDate = new Date();
            if (startDateStr && startDateStr.toLowerCase() !== 'no especificada') {
                try {
                    const months: any = { 
                        'enero': 0, 'febrero': 1, 'marzo': 2, 'abril': 3, 'mayo': 4, 'junio': 5, 
                        'julio': 6, 'agosto': 7, 'septiembre': 8, 'octubre': 9, 'noviembre': 10, 'diciembre': 11,
                        'ene': 0, 'feb': 1, 'mzo': 2, 'abr': 3, 'may': 4, 'jun': 5, 'jul': 6, 'ago': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dic': 11
                    };
                    
                    const parts = startDateStr.split(' de ');
                    if (parts.length === 3) {
                        const day = parseInt(parts[0]);
                        const month = months[parts[1].toLowerCase()] || 0;
                        const year = parseInt(parts[2]);
                        startDate = new Date(year, month, day);
                    } else {
                        // Try DD-Mon-YY or similar
                        const shortParts = startDateStr.split('-');
                        if (shortParts.length >= 2) {
                            const day = parseInt(shortParts[0]);
                            const month = months[shortParts[1].toLowerCase()] || 0;
                            const year = shortParts[2] ? (parseInt(shortParts[2]) < 100 ? 2000 + parseInt(shortParts[2]) : parseInt(shortParts[2])) : 2026;
                            startDate = new Date(year, month, day);
                        }
                    }
                } catch (e) {
                    console.warn(`Failed to parse date ${startDateStr} for ${name}, using current date.`);
                }
            }

            try {
                // 1. Create or Find Client
                let client = await prisma.client.findFirst({
                    where: { tenantId, firstName: name }
                });

                if (!client) {
                    client = await prisma.client.create({
                        data: {
                            tenantId,
                            firstName: name,
                            lastName: '',
                            phone: '0000000000',
                            status: ClientStatus.ACTIVE,
                            notes: `Migración de datos de libretas.`,
                            migratedFrom: 'Libreta Extraction',
                            migrationDate: new Date(),
                        }
                    });
                }

                // 2. Parse Payments Table
                const paymentLines = block.split('\n').filter(l => l.includes('|') && !l.includes('Semana') && !l.includes('---'));
                const payments: { week: number, date: string, amount: number, isPaid: boolean }[] = [];
                
                let firstPaymentAmount = 0;

                for (const pl of paymentLines) {
                    const cells = pl.split('|').map(c => c.trim()).filter(c => c !== '');
                    if (cells.length < 3) continue;

                    const week = parseInt(cells[0]);
                    const dateStr = cells[1];
                    const amountStr = cells[2];
                    
                    const isPaid = amountStr.includes('$');
                    const amount = isPaid ? parseFloat(amountStr.replace('$', '').replace(/,/g, '')) : 0;
                    
                    if (isPaid && firstPaymentAmount === 0) firstPaymentAmount = amount;

                    payments.push({ week, date: dateStr, amount, isPaid });
                }

                // 3. Create Loan
                // If we have a payment, use it to estimate the weekly amount
                // Standard is 12% or 12.5%. If no payments, assume 12%.
                const weeklyPaymentAmount = firstPaymentAmount || (principalAmount * 0.12);
                const totalAmount = weeklyPaymentAmount * 16;
                
                const loanNumber = `PRE-${name.substring(0, 3).toUpperCase()}-${Math.floor(Math.random() * 10000)}`;
                
                const loan = await prisma.loan.create({
                    data: {
                        tenantId,
                        clientId: client.id,
                        loanNumber,
                        loanType: LoanType.PERSONAL,
                        loanCalculationType: LoanCalculationType.POR_MIL_120, // Most common
                        principalAmount: principalAmount,
                        interestRate: 0.92, // (120*16 - 1000) / 1000
                        termMonths: 4, // 16 weeks ~ 4 months
                        paymentFrequency: PaymentFrequency.SEMANAL,
                        monthlyPayment: weeklyPaymentAmount,
                        totalAmount: totalAmount,
                        balanceRemaining: totalAmount,
                        status: LoanStatus.ACTIVE,
                        startDate: startDate,
                        endDate: new Date(startDate.getTime() + 16 * 7 * 24 * 60 * 60 * 1000),
                    }
                });

                // 4. Create Amortization Schedule and Payments
                let totalPaid = 0;
                for (let i = 1; i <= 16; i++) {
                    const p = payments.find(pay => pay.week === i);
                    
                    // Estimate payment date for amortization if not in table
                    const schedDate = new Date(startDate.getTime() + i * 7 * 24 * 60 * 60 * 1000);
                    
                    const schedule = await prisma.amortizationSchedule.create({
                        data: {
                            loanId: loan.id,
                            paymentNumber: i,
                            paymentDate: schedDate,
                            principalPayment: principalAmount / 16,
                            interestPayment: (totalAmount - principalAmount) / 16,
                            totalPayment: weeklyPaymentAmount,
                            remainingBalance: totalAmount - (weeklyPaymentAmount * i),
                            isPaid: p ? p.isPaid : false
                        }
                    });

                    if (p && p.isPaid) {
                        // Try to parse payment date from "DD-mon"
                        let payDate = schedDate;
                        if (p.date && p.date.includes('-')) {
                            try {
                                const months: any = { 'ene': 0, 'feb': 1, 'mzo': 2, 'abr': 3, 'may': 4, 'jun': 5, 'jul': 6, 'ago': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dic': 11 };
                                const dp = p.date.split('-');
                                const m = months[dp[1].toLowerCase()] || schedDate.getMonth();
                                payDate = new Date(schedDate.getFullYear(), m, parseInt(dp[0]));
                            } catch {}
                        }

                        await prisma.payment.create({
                            data: {
                                tenantId,
                                loanId: loan.id,
                                amortizationScheduleId: schedule.id,
                                amount: p.amount,
                                paymentDate: payDate,
                                paymentMethod: PaymentMethod.CASH,
                                processedBy: adminUser?.id,
                                status: 'COMPLETED',
                                notes: `Migración de pago semana ${i}`
                            }
                        });
                        totalPaid += p.amount;
                    }
                }

                // Update final balance
                await prisma.loan.update({
                    where: { id: loan.id },
                    data: {
                        balanceRemaining: totalAmount - totalPaid,
                        status: (totalAmount - totalPaid <= 0) ? LoanStatus.PAID : LoanStatus.ACTIVE
                    }
                });

                console.log(`Imported: ${name} - Principal: $${principalAmount} - Paid: $${totalPaid}`);
                successCount++;
            } catch (err) {
                console.error(`Error importing ${name}:`, err);
                errorCount++;
            }
        }

        console.log(`\n--- IMPORT SUMMARY ---`);
        console.log(`Success: ${successCount}`);
        console.log(`Errors: ${errorCount}`);

    } catch (err) {
        console.error('Fatal error:', err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
