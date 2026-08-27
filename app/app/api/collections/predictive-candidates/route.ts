import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { predictiveCollectionService } from '@/lib/predictive-collection-service';
import { UserRole } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role === UserRole.CLIENTE) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const advisorId = searchParams.get('advisorId') || undefined;
    const minDaysOverdue = searchParams.get('minDaysOverdue')
      ? parseInt(searchParams.get('minDaysOverdue')!, 10)
      : 1;
    const maxCandidates = searchParams.get('maxCandidates')
      ? parseInt(searchParams.get('maxCandidates')!, 10)
      : 50;

    const tenantId = session.user.tenantId || '';
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant no especificado' }, { status: 400 });
    }

    const candidates = await predictiveCollectionService.getPredictiveCandidates(tenantId, {
      advisorId: session.user.role === UserRole.ASESOR ? session.user.id : advisorId,
      minDaysOverdue,
      maxCandidates,
    });

    const totalDebt = candidates.reduce((sum, c) => sum + c.amountDue, 0);
    const totalExpectedRecovery = candidates.reduce((sum, c) => sum + c.scoring.estimatedRecoveryAmount, 0);
    const avgScore = candidates.length > 0
      ? Math.round(candidates.reduce((sum, c) => sum + c.scoring.score, 0) / candidates.length)
      : 0;

    return NextResponse.json({
      candidates,
      summary: {
        totalCandidates: candidates.length,
        totalDebt,
        totalExpectedRecovery,
        averageRecoveryScore: avgScore,
      },
    });
  } catch (error) {
    console.error('Error fetching predictive collection candidates:', error);
    return NextResponse.json(
      { error: 'Error al obtener candidatos predictivos de cobranza' },
      { status: 500 }
    );
  }
}
