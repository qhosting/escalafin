/**
 * API: Promesa individual
 * PATCH - Actualizar estado (cumplida/cancelada)
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { promiseToPayService } from '@/lib/promise-service';

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
        const { action } = body;

        let promise;
        switch (action) {
            case 'fulfill':
                promise = await promiseToPayService.markFulfilled(params.id);
                break;
            case 'cancel':
                promise = await promiseToPayService.cancel(params.id);
                break;
            default:
                return NextResponse.json({ error: 'Acción no válida. Usar: fulfill, cancel' }, { status: 400 });
        }

        return NextResponse.json(promise);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
