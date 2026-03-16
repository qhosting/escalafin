
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.SUPER_ADMIN)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const { trigger, triggerType, response, responseType, priority, isActive, conditions, actions } = body;

    const rule = await prisma.chatbotRule.update({
      where: { id: params.id },
      data: {
        trigger,
        triggerType,
        response,
        responseType,
        priority,
        isActive,
        conditions: conditions ? (typeof conditions === 'string' ? conditions : JSON.stringify(conditions)) : null,
        actions: actions ? (typeof actions === 'string' ? actions : JSON.stringify(actions)) : null,
      }
    });

    return NextResponse.json({
      success: true,
      rule
    });
  } catch (error) {
    console.error('Error updating chatbot rule:', error);
    return NextResponse.json(
      { error: 'Error al actualizar la regla del chatbot' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.SUPER_ADMIN)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    await prisma.chatbotRule.delete({
      where: { id: params.id }
    });

    return NextResponse.json({
      success: true,
      message: 'Regla eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error deleting chatbot rule:', error);
    return NextResponse.json(
      { error: 'Error al eliminar la regla del chatbot' },
      { status: 500 }
    );
  }
}
