
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import { parse } from 'csv-parse/sync';

async function main() {
    const url = "postgres://postgres:7fc6f898f29e38e2ea54@cloud.qhosting.net:1088/escalafin-db?sslmode=disable";
    const prisma = new PrismaClient({ datasources: { db: { url } } });

    const targetSlug = 'prestamossjr';
    const csvPath = 'c:\\Users\\Admin\\Proyectos\\escalafin\\temporal\\PLANTILLA_CON_SALDOS_ACTUALIZADOS.csv';

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

        console.log('Reading CSV...');
        const fileContent = fs.readFileSync(csvPath, 'utf-8');
        const records = parse(fileContent, {
            columns: true,
            skip_empty_lines: true,
            bom: true
        });

        console.log(`Parsed ${records.length} records.`);

        let successCount = 0;
        let skipCount = 0;
        let errorCount = 0;

        for (const record of records) {
            const { NOMBRE, APELLIDO, EMAIL, TELEFONO, DIRECCION, SALDO_ACTUAL, NOTAS } = record;

            const cleanPhone = TELEFONO ? TELEFONO.toString().trim() : '';
            const cleanEmail = EMAIL ? EMAIL.toString().trim() : '';

            try {
                // Build OR condition carefully
                const orConditions = [];
                if (cleanEmail) orConditions.push({ email: cleanEmail });
                if (cleanPhone) orConditions.push({ phone: cleanPhone });

                let existing = null;
                if (orConditions.length > 0) {
                    existing = await prisma.client.findFirst({
                        where: {
                            tenantId,
                            OR: orConditions
                        }
                    });
                }

                if (existing) {
                    console.log(`Skipping existing client: ${NOMBRE} ${APELLIDO} (${cleanPhone})`);
                    skipCount++;
                    continue;
                }

                await prisma.client.create({
                    data: {
                        tenantId,
                        firstName: NOMBRE || 'SIN NOMBRE',
                        lastName: APELLIDO || '',
                        email: cleanEmail || null,
                        phone: cleanPhone || '0000000000',
                        address: DIRECCION || null,
                        initialBalance: SALDO_ACTUAL ? parseFloat(SALDO_ACTUAL.toString()) : 0,
                        notes: NOTAS || null,
                        status: 'ACTIVE',
                        migratedFrom: 'Direct CSV Injection',
                        migrationDate: new Date(),
                    }
                });
                console.log(`Injected: ${NOMBRE} ${APELLIDO}`);
                successCount++;
            } catch (clientError) {
                console.error(`Error injecting ${NOMBRE} ${APELLIDO}:`, clientError);
                errorCount++;
            }
        }

        console.log(`\n--- INJECTION SUMMARY ---`);
        console.log(`Success: ${successCount}`);
        console.log(`Skipped: ${skipCount}`);
        console.log(`Errors: ${errorCount}`);

    } catch (err) {
        console.error('Fatal error:', err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
