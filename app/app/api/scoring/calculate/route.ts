export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { CreditScoringSystem } from '@/lib/scoring';
import { AuditLogger } from '@/lib/audit';
import { extractRequestInfo } from '@/lib/audit';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Solo admins y asesores pueden calcular scoring
    if (session.user.role === 'CLIENTE') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { factors, clientId, applicationId } = body;

    if (!factors) {
      return NextResponse.json(
        { error: 'Factores de scoring requeridos' },
        { status: 400 }
      );
    }

    const scoringSystem = new CreditScoringSystem(prisma);
    const result = await scoringSystem.calculateScore(factors);

    // Guardar el resultado si se proporciona un ID de préstamo o aplicación
    if (clientId || applicationId) {
      await scoringSystem.saveScoringResult(
        applicationId || clientId, 
        result
      );
    }

    // Log de auditoría
    const auditLogger = new AuditLogger(prisma);
    const requestInfo = extractRequestInfo(request);
    await auditLogger.log({
      userId: session.user.id,
      userEmail: session.user.email,
      action: 'SCORING_CALCULATE',
      resource: 'CreditScore',
      resourceId: clientId || applicationId,
      details: {
        score: result.score,
        risk: result.risk,
        recommendation: result.recommendation,
      },
      ...requestInfo,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error calculating credit score:', error);
    return NextResponse.json(
      { error: 'Error al calcular el score crediticio' },
      { status: 500 }
    );
  }
}
