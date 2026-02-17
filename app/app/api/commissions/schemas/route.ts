/**
 * API: Esquemas de Comisiones
 * GET  - Listar esquemas
 * POST - Crear esquema
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

        const tenantId = (session.user as any).tenantId;
        if (!tenantId) {
            return NextResponse.json({ error: 'tenantId requerido' }, { status: 400 });
        }

        const schemas = await commissionService.listSchemas(tenantId);
        return NextResponse.json(schemas);
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

        const role = (session.user as any).role;
        if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
        }

        const body = await request.json();
        const tenantId = body.tenantId || (session.user as any).tenantId;

        const schema = await commissionService.createSchema({
            name: body.name,
            description: body.description,
            type: body.type,
            rules: body.rules,
            tenantId,
        });

        return NextResponse.json(schema, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
