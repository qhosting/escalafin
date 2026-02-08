
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const messageTemplateSchema = z.object({
  name: z.string().min(3),
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
  ]),
  channel: z.enum(['SMS', 'WHATSAPP', 'CHATWOOT', 'EMAIL', 'PUSH']),
  template: z.string().min(1),
  variables: z.string().optional(),
  maxLength: z.number().optional(),
  isActive: z.boolean().default(true),
});

// GET - Obtener todas las plantillas
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const channel = searchParams.get('channel');
    const category = searchParams.get('category');
    const isActive = searchParams.get('isActive');

    const where: any = {
      tenantId: session.user.tenantId
    };

    if (channel) where.channel = channel;
    if (category) where.category = category;
    if (isActive) where.isActive = isActive === 'true';

    const templates = await prisma.messageTemplate.findMany({
      where,
      orderBy: [{ channel: 'asc' }, { category: 'asc' }],
    });

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Error fetching message templates:', error);
    return NextResponse.json(
      { error: 'Error al obtener plantillas de mensajes' },
      { status: 500 }
    );
  }
}

// POST - Crear nueva plantilla
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const data = messageTemplateSchema.parse(body);

    // Validar longitud para SMS (160 caracteres)
    if (data.channel === 'SMS' && data.template.length > 160) {
      return NextResponse.json(
        { error: 'Las plantillas SMS no pueden exceder 160 caracteres' },
        { status: 400 }
      );
    }

    // Verificar que no exista una plantilla con el mismo nombre en este tenant
    const existing = await prisma.messageTemplate.findFirst({
      where: {
        name: data.name,
        tenantId: session.user.tenantId
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe una plantilla con ese nombre' },
        { status: 400 }
      );
    }

    const template = await prisma.messageTemplate.create({
      data: {
        ...data,
        tenantId: session.user.tenantId,
        maxLength: data.channel === 'SMS' ? 160 : data.maxLength,
      },
    });

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    console.error('Error creating message template:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error al crear plantilla de mensaje' },
      { status: 500 }
    );
  }
}
