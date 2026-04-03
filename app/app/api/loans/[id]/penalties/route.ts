
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PenaltyService } from '@/lib/penalty-service';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const tenantId = session.user.tenantId;
        if (!tenantId) {
            return NextResponse.json({ error: 'Tenant ID is missing' }, { status: 400 });
        }

        const loanId = params.id;
        const penaltyService = new PenaltyService(tenantId);
        const penalties = await penaltyService.getPendingPenalties(loanId);

        return NextResponse.json({ penalties });

    } catch (error) {
        console.error('Error fetching penalties:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
