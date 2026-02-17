/**
 * API: Dashboard de Comisiones
 * GET - Resumen general de comisiones
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { commissionService } from '@/lib/commission-service';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession();
        if (!session?.user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const tenantId = searchParams.get('tenantId') || (session.user as any).tenantId;
        const period = searchParams.get('period') || 'month';

        if (!tenantId) {
            return NextResponse.json({ error: 'tenantId requerido' }, { status: 400 });
        }

        const dashboard = await commissionService.getDashboard(tenantId, period);
        return NextResponse.json(dashboard);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
