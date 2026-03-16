
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.SUPER_ADMIN)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const rules = await prisma.chatbotRule.findMany({
      orderBy: { priority: 'desc' }
    });

    return NextResponse.json({
      success: true,
      rules
    });
  } catch (error) {
    console.error('Error fetching chatbot rules:', error);
    return NextResponse.json(
      { error: 'Error al cargar las reglas del chatbot' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.SUPER_ADMIN)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const { trigger, triggerType, response, responseType, priority, isActive, conditions, actions } = body;

    const rule = await prisma.chatbotRule.create({
      data: {
        trigger,
        triggerType: triggerType || 'KEYWORD',
        response,
        responseType: responseType || 'TEXT',
        priority: priority || 0,
        isActive: isActive !== undefined ? isActive : true,
        conditions: conditions ? JSON.stringify(conditions) : null,
        actions: actions ? JSON.stringify(actions) : null,
      }
    });

    return NextResponse.json({
      success: true,
      rule
    });
  } catch (error) {
    console.error('Error creating chatbot rule:', error);
    return NextResponse.json(
      { error: 'Error al crear la regla del chatbot' },
      { status: 500 }
    );
  }
}
