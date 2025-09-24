
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { AuditLogger } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const clientId = params.id;

    // Verificar que el usuario tenga acceso a este cliente
    if (session.user.role !== 'ADMIN') {
      // Si no es admin, verificar que sea el cliente mismo o su asesor
      const client = await prisma.client.findUnique({
        where: { id: clientId },
        select: { userId: true, asesorId: true }
      });

      if (!client || (client.userId !== session.user.id && client.asesorId !== session.user.id)) {
        return NextResponse.json(
          { error: 'Acceso no autorizado' },
          { status: 403 }
        );
      }
    }

    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        whatsappNotificationsEnabled: true,
        whatsappPaymentReceived: true,
        whatsappPaymentReminder: true,
        whatsappLoanUpdates: true,
        whatsappMarketingMessages: true
      }
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ client });
  } catch (error) {
    console.error('Error obteniendo configuraciones WhatsApp:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acceso no autorizado. Solo administradores pueden modificar estas configuraciones.' },
        { status: 401 }
      );
    }

    const clientId = params.id;
    const body = await request.json();
    
    const {
      whatsappNotificationsEnabled,
      whatsappPaymentReceived,
      whatsappPaymentReminder,
      whatsappLoanUpdates,
      whatsappMarketingMessages
    } = body;

    // Verificar que el cliente existe
    const existingClient = await prisma.client.findUnique({
      where: { id: clientId }
    });

    if (!existingClient) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    // Actualizar configuraciones
    const updatedClient = await prisma.client.update({
      where: { id: clientId },
      data: {
        whatsappNotificationsEnabled: whatsappNotificationsEnabled ?? existingClient.whatsappNotificationsEnabled,
        whatsappPaymentReceived: whatsappPaymentReceived ?? existingClient.whatsappPaymentReceived,
        whatsappPaymentReminder: whatsappPaymentReminder ?? existingClient.whatsappPaymentReminder,
        whatsappLoanUpdates: whatsappLoanUpdates ?? existingClient.whatsappLoanUpdates,
        whatsappMarketingMessages: whatsappMarketingMessages ?? existingClient.whatsappMarketingMessages
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        whatsappNotificationsEnabled: true,
        whatsappPaymentReceived: true,
        whatsappPaymentReminder: true,
        whatsappLoanUpdates: true,
        whatsappMarketingMessages: true
      }
    });

    // Log de auditoría
    const auditLogger = new AuditLogger(prisma);
    await auditLogger.log({
      userId: session.user.id,
      userEmail: session.user.email,
      action: 'CLIENT_WHATSAPP_SETTINGS_UPDATE',
      resource: 'Client',
      resourceId: clientId,
      details: {
        previousSettings: {
          whatsappNotificationsEnabled: existingClient.whatsappNotificationsEnabled,
          whatsappPaymentReceived: existingClient.whatsappPaymentReceived,
          whatsappPaymentReminder: existingClient.whatsappPaymentReminder,
          whatsappLoanUpdates: existingClient.whatsappLoanUpdates,
          whatsappMarketingMessages: existingClient.whatsappMarketingMessages
        },
        newSettings: {
          whatsappNotificationsEnabled: updatedClient.whatsappNotificationsEnabled,
          whatsappPaymentReceived: updatedClient.whatsappPaymentReceived,
          whatsappPaymentReminder: updatedClient.whatsappPaymentReminder,
          whatsappLoanUpdates: updatedClient.whatsappLoanUpdates,
          whatsappMarketingMessages: updatedClient.whatsappMarketingMessages
        }
      },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    });

    return NextResponse.json({
      message: 'Configuraciones de WhatsApp actualizadas exitosamente',
      client: updatedClient
    });
  } catch (error) {
    console.error('Error actualizando configuraciones WhatsApp:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
