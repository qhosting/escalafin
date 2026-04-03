
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PenaltyService } from '@/lib/penalty-service';

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const { id } = params;
        const tenantId = session.user.tenantId;
        const body = await request.json();

        const penaltyService = new PenaltyService(tenantId);
        const updated = await penaltyService.updatePenalty(id, body);

        return NextResponse.json({ success: true, penalty: updated });

    } catch (error) {
        console.error('Error in penalty PATCH:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const { id } = params;
        const tenantId = session.user.tenantId;

        const penaltyService = new PenaltyService(tenantId);
        await penaltyService.deletePenalty(id);

        return NextResponse.json({ success: true, message: 'Penalización eliminada' });

    } catch (error) {
        console.error('Error in penalty DELETE:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
