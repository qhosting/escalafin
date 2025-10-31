
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NotificationChannel } from '@prisma/client';

export async function POST(request: NextRequest) {
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

    // Marcar todas las notificaciones del usuario como leídas
    const result = await prisma.notification.updateMany({
      where: {
        userId: user.id,
        channel: NotificationChannel.IN_APP,
        readAt: null
      },
      data: {
        readAt: new Date()
      }
    });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Todas las notificaciones marcadas como leídas',
      count: result.count
    });

  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
