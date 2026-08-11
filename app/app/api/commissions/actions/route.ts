import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { commissionService } from '@/lib/commission-service';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const role = session.user.role;
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
    }

    const body = await request.json();
    const { action, commissionIds } = body;

    if (!action || !commissionIds || !Array.isArray(commissionIds) || commissionIds.length === 0) {
      return NextResponse.json(
        { error: 'Campos requeridos: action (approve|pay|cancel), commissionIds (array de IDs)' },
        { status: 400 }
      );
    }

    let result;
    switch (action) {
      case 'approve':
        result = await commissionService.approveCommissions(session.user.tenantId, commissionIds);
        break;
      case 'pay':
        result = await commissionService.payCommissions(session.user.tenantId, commissionIds);
        break;
      case 'cancel':
        result = await commissionService.cancelCommissions(session.user.tenantId, commissionIds);
        break;
      default:
        return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
    }

    return NextResponse.json({ success: true, updatedCount: result.count });
  } catch (error: any) {
    console.error('Error executing commission action:', error);
    return NextResponse.json({ error: error.message || 'Error al ejecutar acción' }, { status: 500 });
  }
}
