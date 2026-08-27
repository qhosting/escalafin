import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { predictiveCollectionService } from '@/lib/predictive-collection-service';
import { UserRole } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role === UserRole.CLIENTE) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const tenantId = session.user.tenantId || '';
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant no identificado' }, { status: 400 });
    }

    const body = await request.json();
    const {
      advisorId,
      name,
      date,
      maxVisits,
      startTime,
      startLocation,
      targetClientIds,
      minRecoveryScore,
    } = body;

    const assignedAdvisorId = advisorId || session.user.id;
    const routeDate = date ? new Date(date) : new Date();
    const routeName = name || `Ruta Predictiva IA - ${routeDate.toLocaleDateString('es-MX')}`;

    const result = await predictiveCollectionService.generateAIRoute({
      tenantId,
      advisorId: assignedAdvisorId,
      name: routeName,
      date: routeDate,
      maxVisits: maxVisits ? parseInt(maxVisits, 10) : 15,
      startTime: startTime || '08:30',
      startLocation,
      targetClientIds,
      minRecoveryScore: minRecoveryScore ? parseInt(minRecoveryScore, 10) : undefined,
    });

    return NextResponse.json({
      success: true,
      message: 'Ruta inteligente creada exitosamente con IA',
      ...result,
    });
  } catch (error) {
    console.error('Error generating AI collection route:', error);
    return NextResponse.json(
      { error: 'Error al generar la ruta optimizada por IA' },
      { status: 500 }
    );
  }
}
