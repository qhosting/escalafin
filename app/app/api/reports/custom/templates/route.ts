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

    const templates = await customReportService.getTemplates(session.user.tenantId, session.user.id);

    return NextResponse.json({
      success: true,
      templates
    });
  } catch (error: any) {
    console.error('Error fetching report templates:', error);
    return NextResponse.json(
      { error: 'Error al cargar las plantillas de reportes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, config, category, isPublic } = body;

    const template = await customReportService.createTemplate(
      session.user.tenantId,
      name,
      description,
      config,
      session.user.id,
      category,
      isPublic
    );

    return NextResponse.json({
      success: true,
      template
    });
  } catch (error: any) {
    console.error('Error creating report template:', error);
    return NextResponse.json(
      { error: error.message || 'Error al crear la plantilla' },
      { status: 500 }
    );
  }
}
