
import { PrismaClient, PaymentFrequency, LoanType, LoanCalculationType, LoanStatus, PaymentMethod } from '@prisma/client';
import fs from 'fs';
import path from 'path';

async function main() {
    const url = "postgres://postgres:7fc6f898f29e38e2ea54@100.75.220.89:1088/escalafin-db?sslmode=disable";
    const prisma = new PrismaClient({ datasources: { db: { url } } });

    const targetSlug = 'prestamossjr';
    const dataPath = 'c:\\Users\\Admin\\Proyectos\\escalafin\\TEMP\\extracted_data.md';

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

        console.log('Reading extracted data...');
        const content = fs.readFileSync(dataPath, 'utf-8');
        
        // Split content into entry chunks
        const entries = content.split(/---/).filter(e => e.trim().includes('**Person:**'));
        console.log(`Found ${entries.length} potential records.`);

        let successCount = 0;
        let errorCount = 0;

        for (const entry of entries) {
            const nameMatch = entry.match(/\*\*Person:\*\*\s*(.*)/);
            const totalMatch = entry.match(/\*\*Total:\*\*\s*\$(.*)/);
            const startDateMatch = entry.match(/\*\*Start Date:\*\*\s*(.*)/);
            const marksMatch = entry.match(/\*\*Marks:\*\*\s*(.*)/);

            if (!nameMatch || !totalMatch) continue;

            const name = nameMatch[1].trim();
            const totalAmount = parseFloat(totalMatch[1].replace(/,/g, '').trim());
            const startDateStr = startDateMatch ? startDateMatch[1].trim() : '01-Jan';
            const marks = marksMatch ? marksMatch[1].trim() : '';

            // Handle date parsing (assuming 2026 based on metadata)
            let startDate = new Date();
            try {
                // Simple parser for "DD-Mon" format
                const months: any = { 'Ene': 0, 'Feb': 1, 'Mzo': 2, 'Abr': 3, 'May': 4, 'Jun': 5, 'Jul': 6, 'Ago': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dic': 11 };
                const parts = startDateStr.split('-');
                const month = months[parts[1]] || 0;
                startDate = new Date(2026, month, parseInt(parts[0]));
            } catch (e) {
                console.warn(`Failed to parse date ${startDateStr} for ${name}, using current date.`);
            }

            try {
                // 1. Create Client
                const client = await prisma.client.create({
                    data: {
                        tenantId,
                        firstName: name,
                        lastName: '',
                        phone: '0000000000', // Placeholder
                        status: 'ACTIVE',
                        notes: `Migrated from image extraction. OCR Marks: ${marks}`,
                        migratedFrom: 'Image Extraction',
                        migrationDate: new Date(),
                    }
                });

                // 2. Calculate Balance and Payments
                // Logic: Numbers crossed out are payments. (No Pago) or [X] are non-payments.
                // For simplicity in this migration script, we'll create the loan with the full total
                // and then create individual payment records if specified.
                
                const loanNumber = `MIG-IMG-${name.substring(0, 3).toUpperCase()}-${Math.floor(Math.random() * 10000)}`;
                
                const loan = await prisma.loan.create({
                    data: {
                        tenantId,
                        clientId: client.id,
                        loanNumber,
                        loanType: LoanType.PERSONAL,
                        loanCalculationType: LoanCalculationType.INTERES,
                        principalAmount: totalAmount,
                        interestRate: 0,
                        termMonths: 12,
                        paymentFrequency: PaymentFrequency.SEMANAL,
                        monthlyPayment: 0,
                        totalAmount: totalAmount,
                        balanceRemaining: totalAmount,
                        status: LoanStatus.ACTIVE,
                        startDate: startDate,
                        endDate: new Date(startDate.getTime() + 365 * 24 * 60 * 60 * 1000),
                    }
                });

                // 3. Process Payments from Marks
                // This is a complex parsing. We'll look for currency symbols followed by dates.
                const paymentRegex = /\$(\d+(?:\.\d+)?)\s+on\s+([0-9]{2}-[A-Za-z]{3})/g;
                let match;
                let totalPaid = 0;

                while ((match = paymentRegex.exec(entry)) !== null) {
                    const amount = parseFloat(match[1]);
                    const payDateStr = match[2];
                    
                    // Only record if NOT followed by (No Pago) in the vicinity
                    const slice = entry.substring(match.index, match.index + 50);
                    if (!slice.includes('(No Pago)')) {
                        await prisma.payment.create({
                            data: {
                                tenantId,
                                loanId: loan.id,
                                amount: amount,
                                paymentDate: new Date(), // Using current for simplicity or parse payDateStr
                                paymentMethod: PaymentMethod.CASH,
                                notes: `Migrated payment for date ${payDateStr}`,
                                status: 'COMPLETED'
                            }
                        });
                        totalPaid += amount;
                    }
                }

                // Update loan balance
                if (totalPaid > 0) {
                    await prisma.loan.update({
                        where: { id: loan.id },
                        data: {
                            balanceRemaining: totalAmount - totalPaid
                        }
                    });
                }

                console.log(`Migrated: ${name} - Total: $${totalAmount} - Paid: $${totalPaid}`);
                successCount++;
            } catch (clientError) {
                console.error(`Error migrating ${name}:`, clientError);
                errorCount++;
            }
        }

        console.log(`\n--- MIGRATION SUMMARY ---`);
        console.log(`Success: ${successCount}`);
        console.log(`Errors: ${errorCount}`);

    } catch (err) {
        console.error('Fatal error:', err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
