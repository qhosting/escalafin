/**
 * API: Comisiones
 * GET  - Listar comisiones
 * POST - Calcular comisión manualmente
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
        const advisorId = searchParams.get('advisorId') || undefined;
        const status = searchParams.get('status') as any;
        const type = searchParams.get('type') as any;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');

        if (!tenantId) {
            return NextResponse.json({ error: 'tenantId requerido' }, { status: 400 });
        }

        const result = await commissionService.list({
            tenantId,
            advisorId,
            status: status || undefined,
            type: type || undefined,
            page,
            limit,
        });

        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession();
        if (!session?.user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const body = await request.json();
        const { type, sourceId, advisorId, tenantId: bodyTenantId } = body;
        const tenantId = bodyTenantId || (session.user as any).tenantId;

        if (!type || !sourceId || !advisorId || !tenantId) {
            return NextResponse.json(
                { error: 'Campos requeridos: type (ORIGINATION|COLLECTION), sourceId, advisorId' },
                { status: 400 }
            );
        }

        let result;
        if (type === 'ORIGINATION') {
            result = await commissionService.calculateOriginationCommission(sourceId, advisorId, tenantId);
        } else if (type === 'COLLECTION') {
            result = await commissionService.calculateCollectionCommission(sourceId, advisorId, tenantId);
        } else {
            return NextResponse.json({ error: 'Tipo no válido' }, { status: 400 });
        }

        if (!result) {
            return NextResponse.json({ message: 'No se generó comisión (sin esquema activo o ya existe)' }, { status: 200 });
        }

        return NextResponse.json(result, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
