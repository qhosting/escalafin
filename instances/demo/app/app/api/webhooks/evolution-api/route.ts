
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { AuditLogger } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  let body: any = {};
  try {
    body = await request.json();
    console.log('Webhook EvolutionAPI recibido:', body);

    const { event, data } = body;

    if (!event || !data) {
      return NextResponse.json(
        { error: 'Datos del webhook inválidos' },
        { status: 400 }
      );
    }

    // Procesar diferentes tipos de eventos
    switch (event) {
      case 'messages.upsert':
        await handleMessageUpdate(data);
        break;
      case 'message.ack':
        await handleMessageAck(data);
        break;
      case 'connection.update':
        await handleConnectionUpdate(data);
        break;
      default:
        console.log(`Evento no manejado: ${event}`);
    }

    // Log de auditoría
    const auditLogger = new AuditLogger(prisma);
    await auditLogger.log({
      action: 'EVOLUTION_WEBHOOK_RECEIVED',
      resource: 'WhatsAppMessage',
      details: {
        event,
        data: typeof data === 'object' ? data : { raw: data },
      },
      ipAddress: request.headers.get('x-forwarded-for') || 'evolution-webhook',
      userAgent: request.headers.get('user-agent') || 'evolution-webhook',
    });

    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error('Error procesando webhook de EvolutionAPI:', error);
    
    // Log de error en auditoría
    try {
      const auditLogger = new AuditLogger(prisma);
      await auditLogger.log({
        action: 'EVOLUTION_WEBHOOK_ERROR',
        resource: 'WhatsAppMessage',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          body: body || {},
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'evolution-webhook',
        userAgent: request.headers.get('user-agent') || 'evolution-webhook',
      });
    } catch (auditError) {
      console.error('Error logging evolution webhook error:', auditError);
    }

    return NextResponse.json(
      { error: 'Error procesando webhook' },
      { status: 500 }
    );
  }
}

async function handleMessageUpdate(data: any) {
  try {
    if (data.messages && Array.isArray(data.messages)) {
      for (const message of data.messages) {
        const messageId = message.key?.id;
        if (messageId) {
          // Buscar el mensaje en nuestra base de datos
          const whatsappMessage = await prisma.whatsAppMessage.findFirst({
            where: {
              evolutionMessageId: messageId
            }
          });

          if (whatsappMessage) {
            // Actualizar el estado del mensaje
            await prisma.whatsAppMessage.update({
              where: { id: whatsappMessage.id },
              data: {
                status: 'SENT',
                sentAt: new Date(),
                evolutionResponse: JSON.stringify(message)
              }
            });
          }
        }
      }
    }
  } catch (error) {
    console.error('Error actualizando mensaje:', error);
  }
}

async function handleMessageAck(data: any) {
  try {
    const messageId = data.messageId || data.id;
    const ack = data.ack;

    if (messageId) {
      const whatsappMessage = await prisma.whatsAppMessage.findFirst({
        where: {
          evolutionMessageId: messageId
        }
      });

      if (whatsappMessage) {
        let newStatus = whatsappMessage.status;
        let updateData: any = {
          evolutionResponse: JSON.stringify(data)
        };

        // Procesar diferentes tipos de ACK
        switch (ack) {
          case 1: // Mensaje enviado al servidor
            newStatus = 'SENT';
            updateData.sentAt = new Date();
            break;
          case 2: // Mensaje entregado al dispositivo
            newStatus = 'DELIVERED';
            updateData.deliveredAt = new Date();
            break;
          case 3: // Mensaje leído por el usuario
            newStatus = 'READ';
            updateData.readAt = new Date();
            break;
        }

        updateData.status = newStatus;

        await prisma.whatsAppMessage.update({
          where: { id: whatsappMessage.id },
          data: updateData
        });
      }
    }
  } catch (error) {
    console.error('Error procesando ACK de mensaje:', error);
  }
}

async function handleConnectionUpdate(data: any) {
  try {
    console.log('Actualización de conexión:', data);
    
    // Aquí podrías actualizar el estado de la conexión en la configuración
    const config = await prisma.evolutionAPIConfig.findFirst({
      where: { isActive: true }
    });

    if (config && data.state) {
      // Log de auditoría para cambios de conexión
      const auditLogger = new AuditLogger(prisma);
      await auditLogger.log({
        action: 'EVOLUTION_CONNECTION_UPDATE',
        resource: 'EvolutionAPIConfig',
        resourceId: config.id,
        details: {
          connectionState: data.state,
          instanceName: config.instanceName,
        },
        ipAddress: 'evolution-webhook',
        userAgent: 'evolution-webhook',
      });
    }
  } catch (error) {
    console.error('Error procesando actualización de conexión:', error);
  }
}
