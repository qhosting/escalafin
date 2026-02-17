/**
 * API: Resumen de cobranza
 * GET - Obtener resumen de cobranza por período
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
        const period = searchParams.get('period') || 'month'; // week, month, quarter

        if (!tenantId) {
            return NextResponse.json({ error: 'tenantId requerido' }, { status: 400 });
        }

        const now = new Date();
        let startDate: Date;

        switch (period) {
            case 'week':
                startDate = new Date(now);
                startDate.setDate(startDate.getDate() - 7);
                break;
            case 'quarter':
                startDate = new Date(now);
                startDate.setMonth(startDate.getMonth() - 3);
                break;
            case 'month':
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
        }

        const summary = await collectionRouteService.getCollectionSummary(tenantId, startDate, now);

        return NextResponse.json(summary);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
