/**
 * API: Ruta de cobranza individual
 * GET    - Obtener detalle
 * PATCH  - Actualizar estado
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { collectionRouteService } from '@/lib/collection-route-service';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession();
        if (!session?.user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const tenantId = (session.user as any).tenantId;
        const result = await collectionRouteService.getRoutes({
            tenantId,
            page: 1,
            limit: 1,
        });

        const route = result.routes.find(r => r.id === params.id);
        if (!route) {
            return NextResponse.json({ error: 'Ruta no encontrada' }, { status: 404 });
        }

        return NextResponse.json(route);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession();
        if (!session?.user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const body = await request.json();
        const { status } = body;

        if (!status) {
            return NextResponse.json({ error: 'status requerido' }, { status: 400 });
        }

        const route = await collectionRouteService.updateRouteStatus(params.id, status);
        return NextResponse.json(route);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
