
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import WhatsAppNotificationService from '@/lib/whatsapp-notification';
import { z } from 'zod';

const sendNotificationSchema = z.object({
  type: z.enum(['payment_received', 'payment_reminder', 'loan_approved', 'custom']),
  clientId: z.string().optional(),
  loanId: z.string().optional(),
  paymentId: z.string().optional(),
  customMessage: z.string().optional(),
  scheduleFor: z.string().optional(),
  includeMedia: z.boolean().optional(),
  mediaUrl: z.string().optional()
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !['ADMIN', 'ADVISOR'].includes(session.user.role || '')) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const data = sendNotificationSchema.parse(body);

    const whatsappService = new WhatsAppNotificationService();
    const options = {
      scheduleFor: data.scheduleFor ? new Date(data.scheduleFor) : undefined,
      includeMedia: data.includeMedia,
      mediaUrl: data.mediaUrl
    };

    switch (data.type) {
      case 'payment_received':
        if (!data.paymentId) {
          return NextResponse.json(
            { error: 'paymentId es requerido para notificaciones de pago recibido' },
            { status: 400 }
          );
        }
        await whatsappService.sendPaymentReceivedNotification(data.paymentId, options);
        break;

      case 'payment_reminder':
        if (!data.loanId) {
          return NextResponse.json(
            { error: 'loanId es requerido para recordatorios de pago' },
            { status: 400 }
          );
        }
        await whatsappService.sendPaymentReminderNotification(data.loanId, options);
        break;

      case 'loan_approved':
        if (!data.loanId) {
          return NextResponse.json(
            { error: 'loanId es requerido para notificaciones de préstamo aprobado' },
            { status: 400 }
          );
        }
        await whatsappService.sendLoanApprovedNotification(data.loanId, options);
        break;

      case 'custom':
        if (!data.clientId || !data.customMessage) {
          return NextResponse.json(
            { error: 'clientId y customMessage son requeridos para mensajes personalizados' },
            { status: 400 }
          );
        }
        await whatsappService.sendCustomMessage(
          data.clientId,
          data.customMessage,
          'CUSTOM',
          options
        );
        break;

      default:
        return NextResponse.json(
          { error: 'Tipo de notificación no válido' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: 'Notificación enviada exitosamente'
    });

  } catch (error) {
    console.error('Error sending WhatsApp notification:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
