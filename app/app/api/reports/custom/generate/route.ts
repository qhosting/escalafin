
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { customReportService } from '@/lib/custom-report-service';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { templateId, parameters } = await request.json();
    if (!templateId) return NextResponse.json({ error: 'templateId es requerido' }, { status: 400 });

    const generationId = await customReportService.generateReport(templateId, session.user.id, parameters);

    return NextResponse.json({
      success: true,
      generationId
    });
  } catch (error) {
    console.error('Error generating custom report:', error);
    return NextResponse.json(
      { error: 'Error al generar el reporte: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}
