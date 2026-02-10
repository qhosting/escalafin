
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getTenantPrisma } from '@/lib/tenant-db';
import { AuditLogger } from '@/lib/audit';
import { subDays } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const tenantId = session.user.tenantId;
    const tenantPrisma = getTenantPrisma(tenantId);

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate')!)
      : subDays(new Date(), 30);
    const endDate = searchParams.get('endDate')
      ? new Date(searchParams.get('endDate')!)
      : new Date();

    const auditLogger = new AuditLogger(tenantPrisma as any);
    const stats = await auditLogger.getLogStats(startDate, endDate);

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching audit stats:', error);
    return NextResponse.json(
      { error: 'Error al obtener estadísticas de auditoría' },
      { status: 500 }
    );
  }
}
