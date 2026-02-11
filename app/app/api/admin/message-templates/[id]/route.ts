
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateTemplateSchema = z.object({
  name: z.string().min(3).optional(),
  description: z.string().optional(),
  category: z.enum([
    'ACCOUNT_CREATED',
    'PAYMENT_RECEIVED',
    'PAYMENT_REMINDER',
    'PAYMENT_OVERDUE',
    'LOAN_APPROVED',
    'LOAN_DISBURSED',
    'LOAN_REJECTED',
    'LOAN_UPDATE',
    'CREDIT_APPLICATION_RECEIVED',
    'CREDIT_APPLICATION_APPROVED',
    'CREDIT_APPLICATION_REJECTED',
    'WELCOME',
    'MARKETING',
    'CUSTOM',
  ]).optional(),
  channel: z.enum(['SMS', 'WHATSAPP', 'EMAIL', 'PUSH']).optional(),
  template: z.string().min(1).optional(),
  variables: z.string().optional(),
  maxLength: z.number().optional(),
  isActive: z.boolean().optional(),
});

// GET - Obtener una plantilla específica
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const template = await prisma.messageTemplate.findUnique({
      where: { id: params.id },
    });

    if (!template) {
      return NextResponse.json(
        { error: 'Plantilla no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({ template });
  } catch (error) {
    console.error('Error fetching message template:', error);
    return NextResponse.json(
      { error: 'Error al obtener plantilla' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar plantilla
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const data = updateTemplateSchema.parse(body);

    // Verificar que la plantilla existe
    const existing = await prisma.messageTemplate.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Plantilla no encontrada' },
        { status: 404 }
      );
    }

    // Validar longitud para SMS
    const channel = data.channel || existing.channel;
    const template = data.template || existing.template;

    if (channel === 'SMS' && template.length > 160) {
      return NextResponse.json(
        { error: 'Las plantillas SMS no pueden exceder 160 caracteres' },
        { status: 400 }
      );
    }

    // Actualizar plantilla
    const updated = await prisma.messageTemplate.update({
      where: { id: params.id },
      data: {
        ...data,
        maxLength: channel === 'SMS' ? 160 : data.maxLength,
      },
    });

    return NextResponse.json({ template: updated });
  } catch (error) {
    console.error('Error updating message template:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error al actualizar plantilla' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar plantilla
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const existing = await prisma.messageTemplate.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Plantilla no encontrada' },
        { status: 404 }
      );
    }

    await prisma.messageTemplate.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting message template:', error);
    return NextResponse.json(
      { error: 'Error al eliminar plantilla' },
      { status: 500 }
    );
  }
}
