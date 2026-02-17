/**
 * API: Acciones sobre comisiones
 * POST - Aprobar o pagar comisiones en lote
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { commissionService } from '@/lib/commission-service';

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession();
        if (!session?.user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        // Solo ADMIN puede aprobar/pagar comisiones
        const role = (session.user as any).role;
        if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
        }

        const body = await request.json();
        const { action, commissionIds } = body;

        if (!action || !commissionIds || !Array.isArray(commissionIds)) {
            return NextResponse.json(
                { error: 'Campos requeridos: action (approve|pay), commissionIds (array)' },
                { status: 400 }
            );
        }

        let result;
        switch (action) {
            case 'approve':
                result = await commissionService.approveCommissions(commissionIds);
                break;
            case 'pay':
                result = await commissionService.payCommissions(commissionIds);
                break;
            default:
                return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
        }

        return NextResponse.json({ success: true, updated: result.count });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
