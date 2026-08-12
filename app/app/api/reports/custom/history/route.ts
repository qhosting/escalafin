import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { customReportService } from '@/lib/custom-report-service';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const history = await customReportService.getHistory(session.user.tenantId);

    return NextResponse.json({
      success: true,
      history
    });
  } catch (error: any) {
    console.error('Error fetching report history:', error);
    return NextResponse.json(
      { error: 'Error al cargar historial de reportes' },
      { status: 500 }
    );
  }
}
