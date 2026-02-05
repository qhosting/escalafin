/**
 * API Endpoint: Conversaciones de WhatsApp
 * GET /api/conversations - Listar conversaciones
 * POST /api/conversations - Crear conversación
 * GET /api/conversations/[id]/messages - Obtener mensajes
 * POST /api/conversations/[id]/send - Enviar mensaje
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { conversationService } from '@/lib/conversation-service';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status') as any;
        const assignedToId = searchParams.get('assignedToId') || undefined;
        const clientId = searchParams.get('clientId') || undefined;
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');

        // Si es asesor, solo ver conversaciones asignadas
        const filters: any = {};
        if (session.user.role === 'ASESOR') {
            filters.assignedToId = session.user.id;
        } else if (assignedToId) {
            filters.assignedToId = assignedToId;
        }

        if (status) filters.status = status;
        if (clientId) filters.clientId = clientId;
        filters.limit = limit;
        filters.offset = offset;

        const conversations = await conversationService.getConversations(filters);

        return NextResponse.json({ conversations });
    } catch (error) {
        console.error('Error obteniendo conversaciones:', error);
        return NextResponse.json(
            { error: 'Error obteniendo conversaciones' },
            { status: 500 }
        );
    }
}
