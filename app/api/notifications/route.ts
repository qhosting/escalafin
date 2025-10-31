import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NotificationType, NotificationChannel } from '@prisma/client'

// Mapa de tipos de notificación para el frontend
const mapNotificationTypeToUI = (type: NotificationType) => {
  const map = {
    LOAN_APPROVED: 'success',
    LOAN_REJECTED: 'error',
    PAYMENT_OVERDUE: 'warning',
    PAYMENT_DUE: 'info',
    REMINDER: 'info',
    SYSTEM_ALERT: 'warning',
    MARKETING: 'info'
  }
  return map[type] || 'info'
}

// GET /api/notifications - Obtener notificaciones del usuario
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener el usuario
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const includeRead = searchParams.get('includeRead') === 'true'

    // Obtener notificaciones de la base de datos
    const notifications = await prisma.notification.findMany({
      where: {
        userId: user.id,
        channel: NotificationChannel.IN_APP,
        ...(includeRead ? {} : { readAt: null })
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    })

    // Transformar al formato que espera el frontend
    const transformedNotifications = notifications.map(n => ({
      id: n.id,
      title: n.title,
      message: n.message,
      type: mapNotificationTypeToUI(n.type),
      channel: n.channel.toLowerCase(),
      read: !!n.readAt,
      archived: false, // Por ahora no tenemos campo archived
      createdAt: n.createdAt.toISOString(),
      userId: n.userId,
      metadata: n.data ? JSON.parse(n.data) : null
    }))

    return NextResponse.json({ 
      notifications: transformedNotifications,
      total: notifications.length
    })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST /api/notifications - Crear nueva notificación
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Solo admin puede crear notificaciones para otros usuarios
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const body = await request.json()
    const { userId, type, title, message, channel = 'IN_APP', data } = body

    const notification = await prisma.notification.create({
      data: {
        userId,
        type: type as NotificationType,
        channel: channel as NotificationChannel,
        title,
        message,
        data: data ? JSON.stringify(data) : null
      }
    })

    return NextResponse.json({ 
      success: true, 
      notification: {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: mapNotificationTypeToUI(notification.type),
        channel: notification.channel.toLowerCase(),
        read: false,
        createdAt: notification.createdAt.toISOString()
      }
    })
  } catch (error) {
    console.error('Error creating notification:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}