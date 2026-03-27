
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { AuditLogger } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { error: 'Acceso no autorizado. Solo administradores pueden acceder.' },
        { status: 401 }
      );
    }

    const tenantId = session.user.tenantId;

    // Obtener el slug del tenant (para el sessionId por defecto)
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId || '' },
      select: { slug: true }
    });

    const config = await prisma.wahaConfig.findFirst({
      where: { 
        isActive: true,
        tenantId: tenantId || null
      }
    });

    // Combinar con variables de entorno (Prioridad Global)
    const sanitizedConfig = {
      id: config?.id,
      sessionId: config?.sessionId || tenant?.slug || 'default',
      baseUrl: process.env.WAHA_BASE_URL || config?.baseUrl || 'https://waha.qhosting.net',
      webhookUrl: config?.webhookUrl,
      isActive: config?.isActive ?? true,
      apiKeyPreview: (process.env.WAHA_API_KEY || config?.apiKey)?.substring(0, 8) + '...',
      paymentReceivedTemplate: config?.paymentReceivedTemplate,
      paymentReminderTemplate: config?.paymentReminderTemplate,
      loanApprovedTemplate: config?.loanApprovedTemplate,
      loanUpdateTemplate: config?.loanUpdateTemplate,
      marketingTemplate: config?.marketingTemplate,
      n8nWebhookUrl: config?.n8nWebhookUrl,
      createdAt: config?.createdAt,
      updatedAt: config?.updatedAt
    };

    return NextResponse.json({ config: sanitizedConfig });
  } catch (error) {
    console.error('Error obteniendo configuración Waha:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { error: 'Acceso no autorizado. Solo administradores pueden configurar.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const tenantId = session.user.tenantId;

    // Obtener slug del tenant para el sessionId por defecto
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId || '' },
      select: { slug: true }
    });

    const {
      instanceName,
      sessionId,
      apiKey,
      baseUrl,
      webhookUrl,
      paymentReceivedTemplate,
      paymentReminderTemplate,
      loanApprovedTemplate,
      loanUpdateTemplate,
      marketingTemplate,
      n8nWebhookUrl
    } = body;

    // Valores por defecto desde ENV
    const finalBaseUrl = baseUrl || process.env.WAHA_BASE_URL || 'https://waha.qhosting.net';
    const finalSessionId = sessionId || instanceName || tenant?.slug || 'default';
    const finalApiKey = apiKey || process.env.WAHA_API_KEY || null;

    // Desactivar configuraciones existentes del mismo tenant
    await prisma.wahaConfig.updateMany({
      where: { 
        isActive: true,
        tenantId: tenantId || null
      },
      data: { isActive: false }
    });

    // Crear nueva configuración (principalmente para plantillas)
    const config = await prisma.wahaConfig.create({
      data: {
        sessionId: finalSessionId,
        apiKey: finalApiKey,
        baseUrl: finalBaseUrl,
        webhookUrl,
        isActive: true,
        paymentReceivedTemplate,
        paymentReminderTemplate,
        loanApprovedTemplate,
        loanUpdateTemplate,
        marketingTemplate,
        n8nWebhookUrl,
        tenantId: tenantId || null
      }
    });

    // Log de auditoría
    const auditLogger = new AuditLogger(prisma);
    await auditLogger.log({
      userId: session.user.id,
      userEmail: session.user.email,
      action: 'WAHA_CONFIG_CREATE',
      resource: 'WahaConfig',
      resourceId: config.id,
      details: {
        sessionId: finalSessionId,
        baseUrl: finalBaseUrl
      },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    });

    return NextResponse.json({
      message: 'Configuración de Waha guardada exitosamente',
      config: config
    });
  } catch (error) {
    console.error('Error configurando Waha:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { error: 'Acceso no autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID de configuración requerido' },
        { status: 400 }
      );
    }

    // Handle legacy field mapping
    if (updateData.instanceName && !updateData.sessionId) {
      updateData.sessionId = updateData.instanceName;
      delete updateData.instanceName;
    }

    // Verificar pertenecia de WAHA config a este tenant
    const tenantId = session.user.tenantId;
    const existingConfig = await prisma.wahaConfig.findFirst({
      where: { id, tenantId: tenantId || null }
    });

    if (!existingConfig && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Configuración no encontrada o no pertenece a su tenant' }, { status: 404 });
    }

    const updatedConfig = await prisma.wahaConfig.update({
      where: { id },
      data: updateData
    });

    // Log de auditoría
    const auditLogger = new AuditLogger(prisma);
    await auditLogger.log({
      userId: session.user.id,
      userEmail: session.user.email,
      action: 'WAHA_CONFIG_UPDATE',
      resource: 'WahaConfig',
      resourceId: updatedConfig.id,
      details: updateData,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    });

    return NextResponse.json({
      message: 'Configuración actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error actualizando configuración Waha:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
