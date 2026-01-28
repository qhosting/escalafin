
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { AuditLogger } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  let body: any = {};
  try {
    body = await request.json();
    console.log('Webhook Waha recibido:', body);

    // Waha puede enviar arrays de eventos o eventos individuales
    // El formato de webhook de Waha puede ser { event: "...", payload: {...} } o directo.
    // Asumiremos formato Waha estándar

    const event = body.event;
    const payload = body.payload || body; // Fallback

    if (!event) {
        // Si no hay evento, quizás es un ping o formato no reconocido
        // Waha a veces manda { type: 'message', ... }
        console.log("Evento no identificado claramente:", body);
        return NextResponse.json({ status: 'ok', message: 'No event processed' });
    }

    // Procesar diferentes tipos de eventos
    switch (event) {
      case 'message':
      case 'message.any':
        await handleMessage(payload);
        break;
      case 'message.ack':
        await handleMessageAck(payload);
        break;
      case 'session.status':
        await handleSessionStatus(payload);
        break;
      default:
        console.log(`Evento Waha no manejado: ${event}`);
    }

    // Log de auditoría
    const auditLogger = new AuditLogger(prisma);
    await auditLogger.log({
      action: 'WAHA_WEBHOOK_RECEIVED',
      resource: 'WhatsAppMessage',
      details: {
        event,
        payload: typeof payload === 'object' ? payload : { raw: payload },
      },
      ipAddress: request.headers.get('x-forwarded-for') || 'waha-webhook',
      userAgent: request.headers.get('user-agent') || 'waha-webhook',
    });

    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error('Error procesando webhook de Waha:', error);

    // Log de error en auditoría
    try {
      const auditLogger = new AuditLogger(prisma);
      await auditLogger.log({
        action: 'WAHA_WEBHOOK_ERROR',
        resource: 'WhatsAppMessage',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          body: body || {},
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'waha-webhook',
        userAgent: request.headers.get('user-agent') || 'waha-webhook',
      });
    } catch (auditError) {
      console.error('Error logging waha webhook error:', auditError);
    }

    return NextResponse.json(
      { error: 'Error procesando webhook' },
      { status: 500 }
    );
  }
}

async function handleMessage(data: any) {
  try {
      // Waha incoming message
      // { id: "...", from: "...", body: "..." }
      // Aquí podríamos procesar mensajes entrantes si fuera un bot
      console.log("Mensaje entrante:", data);
  } catch (error) {
    console.error('Error procesando mensaje entrante:', error);
  }
}

async function handleMessageAck(data: any) {
  try {
    // Waha ACK structure: { id: "...", ack: 1/2/3/4 }
    const messageId = data.id || data.messageId;
    const ack = data.ack; // 1: sent, 2: received, 3: read, 4: played

    if (messageId) {
      const whatsappMessage = await prisma.whatsAppMessage.findFirst({
        where: {
          wahaMessageId: messageId
        }
      });

      if (whatsappMessage) {
        let newStatus = whatsappMessage.status;
        let updateData: any = {
          wahaResponse: JSON.stringify(data)
        };

        // Procesar diferentes tipos de ACK
        switch (ack) {
          case 1: // Sent
            newStatus = 'SENT';
            updateData.sentAt = new Date();
            break;
          case 2: // Received
            newStatus = 'DELIVERED';
            updateData.deliveredAt = new Date();
            break;
          case 3: // Read
          case 4: // Played
            newStatus = 'READ';
            updateData.readAt = new Date();
            break;
          case -1: // Error
             newStatus = 'FAILED';
             updateData.errorMessage = "Failed delivery reported by ACK";
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

async function handleSessionStatus(data: any) {
  try {
    console.log('Actualización de estado de sesión:', data);
    // data: { name: 'default', status: '...' }

    const config = await prisma.wahaConfig.findFirst({
      where: { isActive: true }
    });

    if (config && data.name === config.sessionId) {
      // Log de auditoría
      const auditLogger = new AuditLogger(prisma);
      await auditLogger.log({
        action: 'WAHA_SESSION_UPDATE',
        resource: 'WahaConfig',
        resourceId: config.id,
        details: {
          status: data.status,
          sessionId: config.sessionId,
        },
        ipAddress: 'waha-webhook',
        userAgent: 'waha-webhook',
      });
    }
  } catch (error) {
    console.error('Error procesando actualización de sesión:', error);
  }
}
