
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { collectionRouteService } from '@/lib/collection-route-service';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { visitId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const body = await request.json();
    const result = await collectionRouteService.recordVisitOutcome(params.visitId, body);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error recording visit outcome:', error);
    return NextResponse.json({ error: 'Error al registrar visita' }, { status: 500 });
  }
}
