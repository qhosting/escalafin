
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acceso no autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status');
    const messageType = searchParams.get('messageType');

    // Construcción de filtros
    const where: any = {};
    if (clientId) where.clientId = clientId;
    if (status) where.status = status;
    if (messageType) where.messageType = messageType;

    // Obtener mensajes con paginación
    const [messages, totalCount] = await Promise.all([
      prisma.whatsAppMessage.findMany({
        where,
        include: {
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.whatsAppMessage.count({ where })
    ]);

    return NextResponse.json({
      messages,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Error obteniendo mensajes WhatsApp:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acceso no autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { clientIds, message, messageType = 'CUSTOM', scheduleFor } = body;

    if (!clientIds || !Array.isArray(clientIds) || clientIds.length === 0) {
      return NextResponse.json(
        { error: 'Se debe especificar al menos un cliente' },
        { status: 400 }
      );
    }

    if (!message) {
      return NextResponse.json(
        { error: 'El mensaje es obligatorio' },
        { status: 400 }
      );
    }

    // Obtener información de los clientes
    const clients = await prisma.client.findMany({
      where: { id: { in: clientIds } },
      select: { id: true, phone: true, firstName: true, lastName: true }
    });

    const results = [];
    
    for (const client of clients) {
      try {
        const whatsappMessage = await prisma.whatsAppMessage.create({
          data: {
            clientId: client.id,
            phone: client.phone,
            message,
            messageType,
            status: scheduleFor ? 'PENDING' : 'PENDING',
            scheduledFor: scheduleFor ? new Date(scheduleFor) : undefined
          }
        });

        results.push({
          clientId: client.id,
          clientName: `${client.firstName} ${client.lastName}`,
          messageId: whatsappMessage.id,
          success: true
        });
      } catch (error) {
        results.push({
          clientId: client.id,
          clientName: `${client.firstName} ${client.lastName}`,
          success: false,
          error: error instanceof Error ? error.message : 'Error desconocido'
        });
      }
    }

    return NextResponse.json({
      message: 'Mensajes programados exitosamente',
      results,
      totalSent: results.filter(r => r.success).length,
      totalFailed: results.filter(r => !r.success).length
    });
  } catch (error) {
    console.error('Error enviando mensajes WhatsApp:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
