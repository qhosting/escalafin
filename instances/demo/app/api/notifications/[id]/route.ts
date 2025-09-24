

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const notificationId = params.id;

    // TODO: Implementar lógica real para eliminar notificación
    // Por ahora, simplemente devolvemos éxito
    
    return NextResponse.json({ 
      success: true, 
      message: 'Notificación eliminada',
      id: notificationId 
    });

  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
