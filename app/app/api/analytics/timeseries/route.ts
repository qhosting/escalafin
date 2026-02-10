export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getTenantPrisma } from '@/lib/tenant-db';
import { AnalyticsService } from '@/lib/analytics';

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
    const days = parseInt(searchParams.get('days') || '30');

    const analyticsService = new AnalyticsService(tenantPrisma as any);
    const timeSeriesData = await analyticsService.getTimeSeriesData(days);

    return NextResponse.json(timeSeriesData);
  } catch (error) {
    console.error('Error fetching time series data:', error);
    return NextResponse.json(
      { error: 'Error al obtener datos de series temporales' },
      { status: 500 }
    );
  }
}
