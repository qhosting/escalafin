
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, WhatsAppMessageStatus } from '@prisma/client';

const prisma = new PrismaClient();

// Types for Waha Webhook Payload
interface WahaWebhookPayload {
  event: string;
  payload: any;
  engine?: string;
  [key: string]: any;
}

export async function POST(request: NextRequest) {
  try {
    const data: WahaWebhookPayload = await request.json();
    
    // Log for debugging (optional for production to avoid log noise)
    // console.log('Waha Webhook:', JSON.stringify(data, null, 2));

    const { event, payload } = data;

    if (event === 'message.ack') {
      await handleMessageAck(payload);
    } else if (event === 'message') {
      await handleIncomingMessage(payload);
    } else if (event === 'session.status') {
      // Logic to update session status if needed
      // console.log('Session status update:', payload);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing Waha webhook:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

async function handleMessageAck(payload: any) {
  // Payload: { id: "false_..._@c.us_...", ack: 2, ... }
  // ack: 0 (CLOCK), 1 (SENT - SERVER), 2 (RECEIVED - DEVICE), 3 (READ), 4 (PLAYED)
  // -1 (ERROR)

  const wahaMessageId = payload.id;
  const ack = payload.ack;

  if (!wahaMessageId) return;

  let newStatus: WhatsAppMessageStatus | null = null;
  let errorMessage: string | null = null;

  switch (ack) {
    case -1:
      newStatus = 'FAILED';
      errorMessage = 'Error reported by WhatsApp (ACK -1)';
      break;
    case 1:
      // Keep as SENT (default after sending) or set explicitly
      newStatus = 'SENT';
      break;
    case 2:
      newStatus = 'DELIVERED';
      break;
    case 3:
    case 4:
      newStatus = 'READ';
      break;
    default:
      // 0 or others, ignore or keep current
      break;
  }

  if (newStatus) {
    await prisma.whatsAppMessage.updateMany({
      where: { 
        wahaMessageId: wahaMessageId,
        // Only update if status implies progress (e.g. don't go from READ back to DELIVERED)
        // Ideally we check current status, but updateMany doesn't allow robust conditional logic easily without transaction or read-first.
        // For simplicity, we just update. WhatsApp ACKs usually come in order.
      },
      data: { 
        status: newStatus,
        ...(newStatus === 'DELIVERED' ? { deliveredAt: new Date() } : {}),
        ...(newStatus === 'READ' ? { readAt: new Date() } : {}),
        ...(errorMessage ? { errorMessage } : {})
      }
    });
  }
}

async function handleIncomingMessage(payload: any) {
  // Payload: { id: "...", from: "...", body: "...", type: "chat", ... }
  // Logic to handle auto-replies or save to inbox could go here.
  
  // For now, we just log highly relevant info or match against a client
  const from = payload.from;
  const body = payload.body;
  
  // Example: simple keyword auto-reply could be triggered here via WahaService
  console.log(`Incoming WhatsApp from ${from}: ${body}`);
}
