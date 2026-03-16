
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { conversationService } from '@/lib/conversation-service';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const assignedToId = searchParams.get('assignedToId');
    const clientId = searchParams.get('clientId');

    const conversations = await conversationService.getConversations({
      status: status || undefined,
      assignedToId: assignedToId || undefined,
      clientId: clientId || undefined,
    });

    return NextResponse.json({
      success: true,
      conversations
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Error al cargar conversaciones' },
      { status: 500 }
    );
  }
}
