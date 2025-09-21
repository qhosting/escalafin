
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const subscription = await request.json();

    // Store push subscription in database
    // For now, we'll just log it
    console.log('Push subscription received:', {
      userId: session.user.id,
      subscription
    });

    // In a real implementation, you would store this in your database
    // await prisma.pushSubscription.create({
    //   data: {
    //     userId: session.user.id,
    //     endpoint: subscription.endpoint,
    //     p256dh: subscription.keys.p256dh,
    //     auth: subscription.keys.auth,
    //   }
    // });

    return NextResponse.json({ 
      success: true, 
      message: 'Suscripción a notificaciones registrada' 
    });
  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
