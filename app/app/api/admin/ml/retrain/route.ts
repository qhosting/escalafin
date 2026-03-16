
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import { mlTrainingService } from '@/lib/ml-training-service';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.SUPER_ADMIN)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Iniciar el reentrenamiento en segundo plano o esperar (dependiendo de la duración)
    // Para este MVP, esperaremos a que termine y devolveremos el resultado
    await mlTrainingService.monthlyRetraining();

    return NextResponse.json({
      success: true,
      message: 'Reentrenamiento completado exitosamente'
    });
  } catch (error) {
    console.error('Error in ML retraining:', error);
    return NextResponse.json(
      { error: 'Error durante el reentrenamiento del modelo: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}
