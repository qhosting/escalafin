export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { AuditLogger } from '@/lib/audit';
import { extractRequestInfo } from '@/lib/audit';

const prisma = new PrismaClient();

// GET - Obtener configuraciones del sistema
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    const where: any = { isActive: true };
    if (category) where.category = category;

    const configs = await prisma.systemConfig.findMany({
      where,
      orderBy: [{ category: 'asc' }, { key: 'asc' }],
    });

    return NextResponse.json(configs);
  } catch (error) {
    console.error('Error fetching system config:', error);
    return NextResponse.json(
      { error: 'Error al obtener configuración del sistema' },
      { status: 500 }
    );
  }
}

// POST - Crear nueva configuración
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { key, value, description, category } = body;

    if (!key || !value) {
      return NextResponse.json(
        { error: 'Key y value son requeridos' },
        { status: 400 }
      );
    }

    // Verificar si ya existe
    const existing = await prisma.systemConfig.findUnique({
      where: { key },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'La configuración ya existe' },
        { status: 409 }
      );
    }

    const config = await prisma.systemConfig.create({
      data: {
        key,
        value,
        description,
        category,
        updatedBy: session.user.id,
      },
    });

    // Log de auditoría
    const auditLogger = new AuditLogger(prisma);
    const requestInfo = extractRequestInfo(request);
    await auditLogger.log({
      userId: session.user.id,
      userEmail: session.user.email,
      action: 'SYSTEM_CONFIG_CREATE',
      resource: 'SystemConfig',
      resourceId: config.id,
      details: { key, category },
      ...requestInfo,
    });

    return NextResponse.json(config, { status: 201 });
  } catch (error) {
    console.error('Error creating system config:', error);
    return NextResponse.json(
      { error: 'Error al crear configuración' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar configuración
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { id, value, description, isActive } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID es requerido' },
        { status: 400 }
      );
    }

    const config = await prisma.systemConfig.update({
      where: { id },
      data: {
        value: value !== undefined ? value : undefined,
        description: description !== undefined ? description : undefined,
        isActive: isActive !== undefined ? isActive : undefined,
        updatedBy: session.user.id,
        updatedAt: new Date(),
      },
    });

    // Log de auditoría
    const auditLogger = new AuditLogger(prisma);
    const requestInfo = extractRequestInfo(request);
    await auditLogger.log({
      userId: session.user.id,
      userEmail: session.user.email,
      action: 'SYSTEM_CONFIG_UPDATE',
      resource: 'SystemConfig',
      resourceId: config.id,
      details: { key: config.key, changes: { value, description, isActive } },
      ...requestInfo,
    });

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error updating system config:', error);
    return NextResponse.json(
      { error: 'Error al actualizar configuración' },
      { status: 500 }
    );
  }
}
