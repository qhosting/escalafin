/**
 * API: Rutas de Cobranza
 * GET  - Listar rutas
 * POST - Crear nueva ruta
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
        const advisorId = searchParams.get('advisorId');
        const status = searchParams.get('status') as any;
        const date = searchParams.get('date');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');

        if (!tenantId) {
            return NextResponse.json({ error: 'tenantId requerido' }, { status: 400 });
        }

        const result = await collectionRouteService.getRoutes({
            tenantId,
            advisorId: advisorId || undefined,
            status: status || undefined,
            date: date ? new Date(date) : undefined,
            page,
            limit,
        });

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('[API] Error en GET /api/collections/routes:', error);
        return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession();
        if (!session?.user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const body = await request.json();
        const { name, date, advisorId, clientIds, autoOptimize, maxVisits, tenantId: bodyTenantId } = body;
        const tenantId = bodyTenantId || (session.user as any).tenantId;

        if (!tenantId || !name) {
            return NextResponse.json({ error: 'Faltan campos requeridos: name, tenantId' }, { status: 400 });
        }

        const result = await collectionRouteService.createRoute({
            advisorId: advisorId || (session.user as any).id,
            tenantId,
            name,
            date: date ? new Date(date) : new Date(),
            clientIds,
            autoOptimize: autoOptimize ?? true,
            maxVisits,
        });

        return NextResponse.json(result, { status: 201 });
    } catch (error: any) {
        console.error('[API] Error en POST /api/collections/routes:', error);
        return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 });
    }
}
