import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import webpush from 'web-push';

export const dynamic = 'force-dynamic';

function getVapidConfigured(): boolean {
  const subject = process.env.VAPID_SUBJECT || 'mailto:admin@escalafin.com';
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (publicKey && privateKey) {
    try {
      webpush.setVapidDetails(subject, publicKey, privateKey);
      return true;
    } catch (e) {
      console.error('Error inicializando VAPID:', e);
      return false;
    }
  }
  return false;
}

export async function POST(request: NextRequest) {
  try {
    if (!getVapidConfigured()) {
      return NextResponse.json({
        error: 'Las claves VAPID no están configuradas en el entorno del servidor'
      }, { status: 503 });
    }
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo ADMIN y SUPER_ADMIN pueden disparar notificaciones push
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
    }

    const body = await request.json();
    const { userIds, title, message, url, type } = body;

    if (!title || !message) {
      return NextResponse.json({ error: 'Título y mensaje son requeridos' }, { status: 400 });
    }

    // Buscar subscripciones: si se pasan userIds, filtrar por ellos; si no, mandar a todos del tenant
    const whereClause: any = {};
    if (userIds && Array.isArray(userIds) && userIds.length > 0) {
      whereClause.userId = { in: userIds };
    } else if (session.user.tenantId) {
      // Enviar a todos los usuarios del mismo tenant
      whereClause.user = { tenantId: session.user.tenantId };
    }

    const subscriptions = await prisma.pushSubscription.findMany({
      where: whereClause,
      include: { user: { select: { id: true, email: true, role: true } } }
    });

    if (subscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        sent: 0,
        message: 'No hay dispositivos suscritos para estos usuarios'
      });
    }

    const payload = JSON.stringify({
      title,
      body: message,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      url: url || '/',
      data: { type: type || 'general', timestamp: new Date().toISOString() }
    });

    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth }
            },
            payload
          );
          return { userId: sub.userId, status: 'sent' };
        } catch (err: any) {
          // Si el endpoint ya expiró (410), limpiar la suscripción inválida
          if (err.statusCode === 410) {
            await prisma.pushSubscription.delete({ where: { id: sub.id } });
          }
          return { userId: sub.userId, status: 'failed', error: err.message };
        }
      })
    );

    const sent = results.filter(r => r.status === 'fulfilled' && (r.value as any).status === 'sent').length;
    const failed = results.length - sent;

    return NextResponse.json({
      success: true,
      sent,
      failed,
      total: subscriptions.length,
      message: `Notificación enviada a ${sent} dispositivo(s)`
    });

  } catch (error) {
    console.error('Error sending push notification:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
