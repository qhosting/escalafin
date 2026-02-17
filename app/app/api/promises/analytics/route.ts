/**
 * API: Analytics de Promesas de Pago
 * GET - Obtener analytics y métricas
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { promiseToPayService } from '@/lib/promise-service';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession();
        if (!session?.user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const tenantId = searchParams.get('tenantId') || (session.user as any).tenantId;
        const dateFrom = searchParams.get('dateFrom');
        const dateTo = searchParams.get('dateTo');

        if (!tenantId) {
            return NextResponse.json({ error: 'tenantId requerido' }, { status: 400 });
        }

        const analytics = await promiseToPayService.getAnalytics(
            tenantId,
            dateFrom ? new Date(dateFrom) : undefined,
            dateTo ? new Date(dateTo) : undefined
        );

        return NextResponse.json(analytics);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
