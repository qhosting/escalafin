
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const notificationId = params.id;

    // Verificar que la notificación pertenece al usuario
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId: user.id
      }
    });

    if (!notification) {
      return NextResponse.json({ error: 'Notificación no encontrada' }, { status: 404 });
    }

    // Marcar como leída
    await prisma.notification.update({
      where: { id: notificationId },
      data: { 
        readAt: new Date(),
        status: 'READ'
      }
    });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Notificación marcada como leída',
      id: notificationId 
    });

  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}