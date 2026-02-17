/**
 * API: Visitas de Cobranza - Registrar resultado
 * PATCH - Registrar outcome de visita
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { collectionRouteService } from '@/lib/collection-route-service';

export async function PATCH(
    request: NextRequest,
    { params }: { params: { visitId: string } }
) {
    try {
        const session = await getServerSession();
        if (!session?.user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const body = await request.json();
        const { outcome, notes, latitude, longitude, photoUrl, promiseDate, promiseAmount } = body;

        if (!outcome) {
            return NextResponse.json({ error: 'outcome requerido' }, { status: 400 });
        }

        const visit = await collectionRouteService.recordVisitOutcome(params.visitId, {
            outcome,
            notes,
            latitude,
            longitude,
            photoUrl,
            promiseDate: promiseDate ? new Date(promiseDate) : undefined,
            promiseAmount,
        });

        return NextResponse.json(visit);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
