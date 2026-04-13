
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import { mlTrainingService } from '@/lib/ml-training-service';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Solo SUPER_ADMIN o ADMIN pueden acceder a métricas de ML
    if (!session?.user || (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.SUPER_ADMIN)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const models = await mlTrainingService.getAllModels();

    return NextResponse.json({
      success: true,
      models
    });
  } catch (error) {
    console.error('Error fetching ML models:', error);
    return NextResponse.json(
      { error: 'Error al cargar los modelos de ML' },
      { status: 500 }
    );
  }
}
