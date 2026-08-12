import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { customReportService } from '@/lib/custom-report-service';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { templateId, parameters } = body;

    if (!templateId) {
      return NextResponse.json({ error: 'ID de plantilla requerido' }, { status: 400 });
    }

    const generationId = await customReportService.generateReport(
      session.user.tenantId,
      templateId,
      session.user.id,
      parameters
    );

    return NextResponse.json({
      success: true,
      generationId
    });
  } catch (error: any) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: error.message || 'Error al generar el reporte' },
      { status: 500 }
    );
  }
}
