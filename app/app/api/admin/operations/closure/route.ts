
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PenaltyService } from '@/lib/penalty-service';

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 0 }); // 401
        }

        const tenantId = session.user.tenantId;
        if (!tenantId) {
            return NextResponse.json({ error: 'Tenant ID is missing' }, { status: 400 });
        }

        const penaltyService = new PenaltyService(tenantId);
        
        // El cuerpo del request puede opcionalmente contener un loanId
        let loanId: string | undefined;
        try {
            const body = await request.json();
            loanId = body.loanId;
        } catch (e) {
            // Ignorar error si no hay body
        }

        const penaltiesCount = await penaltyService.applyPenalties(loanId);

        return NextResponse.json({
            success: true,
            count: penaltiesCount.length,
            message: `Se aplicaron ${penaltiesCount.length} penalizaciones por incumplimiento.`
        });

    } catch (error) {
        console.error('Error in closure operation:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
