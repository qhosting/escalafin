
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Simulación de notificaciones para el MVP - En producción esto vendría de la BD
const generateMockNotifications = async (userId: string, userRole: string) => {
  const baseNotifications = [
    {
      id: '1',
      type: 'success' as const,
      title: 'Préstamo Aprobado',
      message: 'El préstamo de María García por $50,000 ha sido aprobado exitosamente',
      read: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
      userId,
      actionUrl: userRole === 'ADMIN' ? '/admin/dashboard' : '/asesor/dashboard',
      actionLabel: 'Ver Detalles'
    },
    {
      id: '2',
      type: 'info' as const,
      title: 'Pago Recibido',
      message: 'Pago de $2,500 recibido de Ana Martínez',
      read: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      userId,
      actionUrl: '/asesor/dashboard',
      actionLabel: 'Ver Pagos'
    },
    {
      id: '3',
      type: 'warning' as const,
      title: 'Pago Vencido',
      message: 'Carlos Rodríguez tiene un pago vencido hace 3 días',
      read: userRole === 'CLIENTE',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      userId,
      actionUrl: '/asesor/dashboard',
      actionLabel: 'Gestionar'
    }
  ]

  if (userRole === 'ADMIN') {
    baseNotifications.push({
      id: '4',
      type: 'info' as const,
      title: 'Nueva Solicitud',
      message: 'Carlos López ha enviado una nueva solicitud de crédito',
      read: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 15), // 15 min ago
      userId,
      actionUrl: '/admin/dashboard',
      actionLabel: 'Revisar'
    })
  }

  if (userRole === 'CLIENTE') {
    return [
      {
        id: '5',
        type: 'info' as const,
        title: 'Próximo Pago',
        message: 'Tu próximo pago de $2,500 vence el 25 de septiembre',
        read: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
        userId,
        actionUrl: '/cliente/dashboard',
        actionLabel: 'Ver Préstamo'
      },
      {
        id: '6',
        type: 'success' as const,
        title: 'Pago Procesado',
        message: 'Tu pago de $2,500 ha sido procesado exitosamente',
        read: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
        userId,
        actionUrl: '/cliente/dashboard',
        actionLabel: 'Ver Historial'
      }
    ]
  }

  return baseNotifications
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId || userId !== session.user.email) {
      return NextResponse.json({ error: 'Usuario no válido' }, { status: 403 })
    }

    // Obtener el usuario para conocer su rol
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Generar notificaciones mock basadas en el rol
    const notifications = await generateMockNotifications(userId, user.role)

    return NextResponse.json(notifications)
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { notificationId, action } = body

    // En un entorno de producción, aquí actualizarías la base de datos
    // Por ahora, solo devolvemos una respuesta exitosa
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating notification:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
