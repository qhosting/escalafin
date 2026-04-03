
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PenaltyService } from '@/lib/penalty-service';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const tenantId = session.user.tenantId;
        if (!tenantId) {
            return NextResponse.json({ error: 'Tenant ID is missing' }, { status: 400 });
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const status = searchParams.get('status') || undefined;
        const clientId = searchParams.get('clientId') || undefined;
        const loanId = searchParams.get('loanId') || undefined;
        const startDateParam = searchParams.get('startDate');
        const endDateParam = searchParams.get('endDate');

        const startDate = startDateParam ? new Date(startDateParam) : undefined;
        const endDate = endDateParam ? new Date(endDateParam) : undefined;

        const penaltyService = new PenaltyService(tenantId);
        const result = await penaltyService.getAllPenalties({
            page,
            limit,
            status,
            clientId,
            loanId,
            startDate,
            endDate
        });

        return NextResponse.json(result);

    } catch (error) {
        console.error('Error in penalties GET:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const tenantId = session.user.tenantId;
        const body = await request.json();
        const { loanId, amount, reason, installmentId } = body;

        if (!loanId || !amount || !reason) {
            return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
        }

        const penaltyService = new PenaltyService(tenantId);
        const penalty = await penaltyService.createManualPenalty({
            loanId,
            amount: parseFloat(amount),
            reason,
            installmentId
        });

        return NextResponse.json({ success: true, penalty });

    } catch (error) {
        console.error('Error in penalties POST:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
