/**
 * API Route: Webhook Endpoints
 * GET /api/webhooks/endpoints - Lista endpoints de webhook
 * POST /api/webhooks/endpoints - Crea un nuevo endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { WebhooksService, WEBHOOK_EVENTS } from '@/lib/webhooks';
import { LimitsService } from '@/lib/billing/limits';

/**
 * GET /api/webhooks/endpoints
 * Lista todos los endpoints de webhook del tenant
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.tenantId) {
            return NextResponse.json(
                { success: false, error: 'No autenticado' },
                { status: 401 }
            );
        }

        // Verificar si el plan permite acceso a API (webhooks incluidos)
        const hasApiAccess = await LimitsService.hasFeature(
            session.user.tenantId,
            'apiAccess'
        );

        if (!hasApiAccess) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Los webhooks no están incluidos en tu plan',
                    upgradeRequired: true
                },
                { status: 403 }
            );
        }

        const endpoints = await WebhooksService.listEndpoints(session.user.tenantId);

        // Parsear eventos para cada endpoint
        const endpointsWithEvents = endpoints.map(ep => ({
            id: ep.id,
            url: ep.url,
            description: ep.description,
            events: JSON.parse(ep.events),
            isActive: ep.isActive,
            failureCount: ep.failureCount,
            lastTriggeredAt: ep.lastTriggeredAt,
            lastStatusCode: ep.lastStatusCode,
            lastError: ep.lastError,
            createdAt: ep.createdAt
        }));

        return NextResponse.json({
            success: true,
            endpoints: endpointsWithEvents,
            availableEvents: Object.entries(WEBHOOK_EVENTS).map(([event, description]) => ({
                event,
                description
            }))
        });

    } catch (error) {
        console.error('Error listing webhook endpoints:', error);
        return NextResponse.json(
            { success: false, error: 'Error al listar webhooks' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/webhooks/endpoints
 * Crea un nuevo endpoint de webhook
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.tenantId) {
            return NextResponse.json(
                { success: false, error: 'No autenticado' },
                { status: 401 }
            );
        }

        // Solo admins pueden crear webhooks
        if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json(
                { success: false, error: 'No autorizado' },
                { status: 403 }
            );
        }

        // Verificar plan
        const hasApiAccess = await LimitsService.hasFeature(
            session.user.tenantId,
            'apiAccess'
        );

        if (!hasApiAccess) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Los webhooks no están incluidos en tu plan',
                    upgradeRequired: true
                },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { url, description, events } = body;

        // Validaciones
        if (!url || typeof url !== 'string') {
            return NextResponse.json(
                { success: false, error: 'La URL es requerida' },
                { status: 400 }
            );
        }

        // Validar que es una URL válida
        try {
            new URL(url);
        } catch {
            return NextResponse.json(
                { success: false, error: 'La URL no es válida' },
                { status: 400 }
            );
        }

        // Validar protocolo HTTPS (requerido en producción)
        if (process.env.NODE_ENV === 'production' && !url.startsWith('https://')) {
            return NextResponse.json(
                { success: false, error: 'La URL debe usar HTTPS' },
                { status: 400 }
            );
        }

        if (!events || !Array.isArray(events) || events.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Debe seleccionar al menos un evento' },
                { status: 400 }
            );
        }

        // Validar eventos
        const validEvents = Object.keys(WEBHOOK_EVENTS);
        const invalidEvents = events.filter(e => !validEvents.includes(e) && e !== '*');
        if (invalidEvents.length > 0) {
            return NextResponse.json(
                { success: false, error: `Eventos inválidos: ${invalidEvents.join(', ')}` },
                { status: 400 }
            );
        }

        const endpoint = await WebhooksService.createEndpoint({
            tenantId: session.user.tenantId,
            url,
            description,
            events
        });

        return NextResponse.json({
            success: true,
            message: 'Webhook creado correctamente',
            endpoint: {
                id: endpoint.id,
                url: endpoint.url,
                description: endpoint.description,
                events: JSON.parse(endpoint.events),
                secret: endpoint.secret, // Solo se muestra una vez
                isActive: endpoint.isActive,
                createdAt: endpoint.createdAt
            },
            warning: 'Guarda el secret de forma segura. Lo necesitarás para verificar las firmas.'
        }, { status: 201 });

    } catch (error) {
        console.error('Error creating webhook endpoint:', error);
        return NextResponse.json(
            { success: false, error: 'Error al crear el webhook' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/webhooks/endpoints?id=xxx
 * Elimina un endpoint de webhook
 */
export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.tenantId) {
            return NextResponse.json(
                { success: false, error: 'No autenticado' },
                { status: 401 }
            );
        }

        if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json(
                { success: false, error: 'No autorizado' },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(request.url);
        const endpointId = searchParams.get('id');

        if (!endpointId) {
            return NextResponse.json(
                { success: false, error: 'ID de endpoint requerido' },
                { status: 400 }
            );
        }

        const deleted = await WebhooksService.deleteEndpoint(session.user.tenantId, endpointId);

        if (!deleted) {
            return NextResponse.json(
                { success: false, error: 'Endpoint no encontrado' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Webhook eliminado correctamente'
        });

    } catch (error) {
        console.error('Error deleting webhook endpoint:', error);
        return NextResponse.json(
            { success: false, error: 'Error al eliminar el webhook' },
            { status: 500 }
        );
    }
}
