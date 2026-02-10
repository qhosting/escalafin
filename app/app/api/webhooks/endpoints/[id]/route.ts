
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { WebhooksService, WEBHOOK_EVENTS } from '@/lib/webhooks';

/**
 * GET /api/webhooks/endpoints/[id] - Obtener detalle
 * PUT /api/webhooks/endpoints/[id] - Actualizar o Toggle
 * DELETE /api/webhooks/endpoints/[id] - Eliminar
 */

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.tenantId) {
            return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
        }

        const endpoint = await WebhooksService.getEndpoint(session.user.tenantId, params.id);
        if (!endpoint) {
            return NextResponse.json({ success: false, error: 'No encontrado' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            endpoint: {
                ...endpoint,
                events: JSON.parse(endpoint.events)
            }
        });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.tenantId) {
            return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
        }

        const body = await request.json();
        const { isActive, url, description, events, regenerateSecret } = body;

        // Toggle Active
        if (isActive !== undefined) {
            await WebhooksService.toggleEndpoint(session.user.tenantId, params.id, isActive);
        }

        // Regenerate Secret
        if (regenerateSecret) {
            const newSecret = await WebhooksService.regenerateSecret(session.user.tenantId, params.id);
            return NextResponse.json({ success: true, secret: newSecret });
        }

        // Update Fields
        if (url || description || events) {
            const updated = await WebhooksService.updateEndpoint(session.user.tenantId, params.id, {
                url,
                description,
                events
            });
            if (!updated) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Actualizado correctamente' });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Error al actualizar' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.tenantId) {
            return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
        }

        const deleted = await WebhooksService.deleteEndpoint(session.user.tenantId, params.id);
        if (!deleted) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

        return NextResponse.json({ success: true, message: 'Eliminado correctamente' });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Error al eliminar' }, { status: 500 });
    }
}
