
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { PredictiveScoringModel } from '@/lib/predictive-model';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['ADMIN', 'ASESOR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const clientId = params.id;
    const body = await request.json();
    const requestedAmount = body.requestedAmount || 0;

    const scoringModel = new PredictiveScoringModel();
    const result = await scoringModel.calculateScore(clientId, requestedAmount);

    // Save to Database
    const creditScore = await prisma.creditScore.create({
      data: {
        clientId,
        score: result.score,
        risk: result.riskLevel,
        recommendation: result.riskLevel === 'VERY_HIGH' ? 'REJECT' : (result.riskLevel === 'HIGH' ? 'REVIEW' : 'APPROVE'),
        maxAmount: result.maxRecommendedAmount,
        factors: JSON.stringify(result.factors),
        // For PD storage we might need a metadata field or assume score maps to it.
        // Schema doesn't have pd field, so we just stick to score.
      }
    });

    // Update Client's latest score
    await prisma.client.update({
      where: { id: clientId },
      data: { creditScore: result.score }
    });

    return NextResponse.json({
      success: true,
      data: result,
      recordId: creditScore.id
    });

  } catch (error: any) {
    console.error('Error calculating score:', error);
    return NextResponse.json({ error: error.message || 'Internal Error' }, { status: 500 });
  }
}
