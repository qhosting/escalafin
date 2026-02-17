/**
 * API: Clientes morosos para cobranza
 * GET - Obtener lista de clientes con pagos vencidos
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { collectionRouteService } from '@/lib/collection-route-service';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession();
        if (!session?.user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const tenantId = searchParams.get('tenantId') || (session.user as any).tenantId;
        const minDays = parseInt(searchParams.get('minDaysOverdue') || '1');
        const maxClients = parseInt(searchParams.get('maxClients') || '50');

        if (!tenantId) {
            return NextResponse.json({ error: 'tenantId requerido' }, { status: 400 });
        }

        const clients = await collectionRouteService.getDelinquentClients(tenantId, {
            minDaysOverdue: minDays,
            maxClients,
        });

        return NextResponse.json({
            clients,
            total: clients.length,
            summary: {
                totalAmountDue: clients.reduce((s, c) => s + c.amountDue, 0),
                avgDaysOverdue: clients.length > 0
                    ? Math.round(clients.reduce((s, c) => s + c.daysOverdue, 0) / clients.length)
                    : 0,
                highPriority: clients.filter(c => c.priority === 1).length,
                mediumPriority: clients.filter(c => c.priority === 2).length,
                lowPriority: clients.filter(c => c.priority === 3).length,
            },
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
