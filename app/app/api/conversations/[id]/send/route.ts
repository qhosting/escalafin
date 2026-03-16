
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { conversationService } from '@/lib/conversation-service';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { content } = await request.json();
    if (!content) {
      return NextResponse.json({ error: 'El contenido es requerido' }, { status: 400 });
    }

    await conversationService.sendMessage(params.id, content, session.user.id);

    return NextResponse.json({
      success: true,
      message: 'Mensaje enviado exitosamente'
    });
  } catch (error) {
    console.error('Error sending conversation message:', error);
    return NextResponse.json(
      { error: 'Error al enviar el mensaje' },
      { status: 500 }
    );
  }
}
