
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { WhatsAppNotificationService } from '@/lib/whatsapp-notification';
import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

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
    const { clientId } = body;

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID requerido' },
        { status: 400 }
      );
    }

    // Obtener un pago reciente del cliente para simular notificación
    const recentPayment = await prisma.payment.findFirst({
      where: {
        loan: {
          clientId
        }
      },
      include: {
        loan: {
          include: {
            client: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!recentPayment) {
      return NextResponse.json(
        { error: 'No se encontró ningún pago para este cliente' },
        { status: 404 }
      );
    }

    // Enviar notificación de prueba
    const whatsappService = new WhatsAppNotificationService();
    await whatsappService.sendPaymentReceivedNotification(recentPayment.id, {
      skipIfDisabled: false // Forzar envío para prueba
    });

    return NextResponse.json({
      success: true,
      message: 'Notificación de prueba enviada exitosamente',
      paymentId: recentPayment.id,
      clientName: `${recentPayment.loan.client.firstName} ${recentPayment.loan.client.lastName}`,
      amount: recentPayment.amount
    });
  } catch (error: any) {
    console.error('Error enviando notificación de prueba:', error);
    return NextResponse.json(
      { 
        error: 'Error enviando notificación de prueba',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
