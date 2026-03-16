
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import { mlTrainingService } from '@/lib/ml-training-service';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = params;

    if (!session?.user || (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.SUPER_ADMIN)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    await mlTrainingService.activateModel(id);

    return NextResponse.json({
      success: true,
      message: 'Modelo activado exitosamente'
    });
  } catch (error) {
    console.error('Error activating ML model:', error);
    return NextResponse.json(
      { error: 'Error al activar el modelo' },
      { status: 500 }
    );
  }
}
