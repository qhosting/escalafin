export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getTenantPrisma } from '@/lib/tenant-db';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const tenantId = session.user.tenantId;
        const { searchParams } = new URL(request.url);
        const dateFrom = searchParams.get('dateFrom');
        const dateTo = searchParams.get('dateTo');

        const tenantPrisma = getTenantPrisma(tenantId);

        let whereClause: any = {
            status: 'COMPLETED'
        };

        if (dateFrom && dateTo) {
            whereClause.paymentDate = {
                gte: new Date(dateFrom),
                lte: new Date(dateTo)
            };
        }

        const payments = await tenantPrisma.payment.findMany({
            where: whereClause,
            include: {
                processedByUser: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true
                    }
                },
                cashCollection: true
            }
        });

        // Agrupar por colector (usuario que procesó el pago)
        const collectorsMap = new Map();
        let totalCollectedAmount = 0;
        let totalVisits = 0;

        payments.forEach(payment => {
            const collector = payment.processedByUser;
            if (!collector) return;

            const collectorId = collector.id;
            const amount = parseFloat(payment.amount.toString());
            totalCollectedAmount += amount;

            if (!collectorsMap.has(collectorId)) {
                collectorsMap.set(collectorId, {
                    id: collectorId,
                    collectorName: `${collector.firstName} ${collector.lastName}`,
                    totalCollections: 0,
                    totalAmount: 0,
                    loansVisited: 0, // En un sistema real esto vendría de una tabla de visitas
                    date: payment.paymentDate
                });
            }

            const collectorData = collectorsMap.get(collectorId);
            collectorData.totalCollections += 1;
            collectorData.totalAmount += amount;
            // Para efectos de reporte, asumimos que cada pago es una visita exitosa
            collectorData.loansVisited += 1;
            totalVisits += 1;
        });

        const reportData = {
            collections: Array.from(collectorsMap.values()),
            stats: {
                totalCollected: totalCollectedAmount,
                activeCollectors: collectorsMap.size,
                totalVisits: totalVisits
            }
        };

        return NextResponse.json(reportData);

    } catch (error) {
        console.error('Error fetching collections report:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
