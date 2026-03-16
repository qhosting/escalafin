export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { WhatsAppNotificationService } from '@/lib/whatsapp-notification';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    const body = await request.json();
    const { paymentId, fileBase64 } = body;

    if (!paymentId || !fileBase64) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
    }

    const whatsappService = new WhatsAppNotificationService(tenantId);
    
    // El envío es asíncrono, pero esperamos la confirmación inicial de WAHA
    await whatsappService.sendPaymentReceiptPDF(paymentId, fileBase64);

    return NextResponse.json({ success: true, message: 'Recibo enviado correctamente' });
  } catch (error) {
    console.error('Error enviando recibo PDF:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
