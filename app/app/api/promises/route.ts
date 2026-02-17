/**
 * API: Promesas de Pago
 * GET  - Listar promesas
 * POST - Crear promesa
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
        const clientId = searchParams.get('clientId') || undefined;
        const loanId = searchParams.get('loanId') || undefined;
        const status = searchParams.get('status') as any;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');

        if (!tenantId) {
            return NextResponse.json({ error: 'tenantId requerido' }, { status: 400 });
        }

        const result = await promiseToPayService.list({
            tenantId,
            clientId,
            loanId,
            status: status || undefined,
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
        const { loanId, clientId, amount, promiseDate, notes, collectionVisitId, tenantId: bodyTenantId } = body;
        const tenantId = bodyTenantId || (session.user as any).tenantId;

        if (!loanId || !clientId || !amount || !promiseDate) {
            return NextResponse.json(
                { error: 'Campos requeridos: loanId, clientId, amount, promiseDate' },
                { status: 400 }
            );
        }

        const promise = await promiseToPayService.create({
            loanId,
            clientId,
            amount: parseFloat(amount),
            promiseDate: new Date(promiseDate),
            notes,
            collectionVisitId,
            tenantId,
        });

        return NextResponse.json(promise, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
