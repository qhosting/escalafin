
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
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acceso no autorizado. Solo administradores pueden acceder.' },
        { status: 401 }
      );
    }

    const config = await prisma.evolutionAPIConfig.findFirst({
      where: { isActive: true }
    });

    // No retornar información sensible como API key completa
    const sanitizedConfig = config ? {
      id: config.id,
      instanceName: config.instanceName,
      baseUrl: config.baseUrl,
      webhookUrl: config.webhookUrl,
      isActive: config.isActive,
      apiKeyPreview: config.apiKey ? config.apiKey.substring(0, 8) + '...' : null,
      paymentReceivedTemplate: config.paymentReceivedTemplate,
      paymentReminderTemplate: config.paymentReminderTemplate,
      loanApprovedTemplate: config.loanApprovedTemplate,
      loanUpdateTemplate: config.loanUpdateTemplate,
      marketingTemplate: config.marketingTemplate,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt
    } : null;

    return NextResponse.json({ config: sanitizedConfig });
  } catch (error) {
    console.error('Error obteniendo configuración EvolutionAPI:', error);
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
        { error: 'Acceso no autorizado. Solo administradores pueden configurar.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      instanceName,
      apiKey,
      baseUrl,
      webhookUrl,
      paymentReceivedTemplate,
      paymentReminderTemplate,
      loanApprovedTemplate,
      loanUpdateTemplate,
      marketingTemplate
    } = body;

    // Validaciones básicas
    if (!instanceName || !apiKey || !baseUrl) {
      return NextResponse.json(
        { error: 'instanceName, apiKey y baseUrl son obligatorios' },
        { status: 400 }
      );
    }

    // Desactivar configuraciones existentes
    await prisma.evolutionAPIConfig.updateMany({
      where: { isActive: true },
      data: { isActive: false }
    });

    // Crear nueva configuración
    const config = await prisma.evolutionAPIConfig.create({
      data: {
        instanceName,
        apiKey,
        baseUrl,
        webhookUrl,
        isActive: true,
        paymentReceivedTemplate,
        paymentReminderTemplate,
        loanApprovedTemplate,
        loanUpdateTemplate,
        marketingTemplate
      }
    });

    // Log de auditoría
    const auditLogger = new AuditLogger(prisma);
    await auditLogger.log({
      userId: session.user.id,
      userEmail: session.user.email,
      action: 'EVOLUTION_API_CONFIG_CREATE',
      resource: 'EvolutionAPIConfig',
      resourceId: config.id,
      details: {
        instanceName,
        baseUrl,
        webhookUrl,
        hasApiKey: !!apiKey
      },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    });

    return NextResponse.json({
      message: 'Configuración de EvolutionAPI guardada exitosamente',
      configId: config.id
    });
  } catch (error) {
    console.error('Error configurando EvolutionAPI:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
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

    const updatedConfig = await prisma.evolutionAPIConfig.update({
      where: { id },
      data: updateData
    });

    // Log de auditoría
    const auditLogger = new AuditLogger(prisma);
    await auditLogger.log({
      userId: session.user.id,
      userEmail: session.user.email,
      action: 'EVOLUTION_API_CONFIG_UPDATE',
      resource: 'EvolutionAPIConfig',
      resourceId: updatedConfig.id,
      details: updateData,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    });

    return NextResponse.json({
      message: 'Configuración actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error actualizando configuración EvolutionAPI:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
