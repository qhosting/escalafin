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

    const result = await commissionService.recalculateTenantCommissions(session.user.tenantId);

    return NextResponse.json({
      success: true,
      message: 'Recálculo de comisiones completado con éxito',
      result
    });
  } catch (error: any) {
    console.error('Error recalculating commissions:', error);
    return NextResponse.json({ error: error.message || 'Error al recalcular comisiones' }, { status: 500 });
  }
}
