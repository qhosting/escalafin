/**
 * API Route: API Keys
 * GET /api/api-keys - Lista API keys del tenant
 * POST /api/api-keys - Crea una nueva API key
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ApiKeysService, API_SCOPES as SCOPES } from '@/lib/api-keys';
import { LimitsService } from '@/lib/billing/limits';

/**
 * GET /api/api-keys
 * Lista todas las API keys del tenant
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

        // Verificar si el plan permite acceso a API
        const hasApiAccess = await LimitsService.hasFeature(
            session.user.tenantId,
            'apiAccess'
        );

        if (!hasApiAccess) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'El acceso a la API no está incluido en tu plan',
                    upgradeRequired: true
                },
                { status: 403 }
            );
        }

        const apiKeys = await ApiKeysService.listApiKeys(session.user.tenantId);

        return NextResponse.json({
            success: true,
            apiKeys,
            availableScopes: Object.entries(SCOPES).map(([key, description]) => ({
                scope: key,
                description
            }))
        });

    } catch (error) {
        console.error('Error listing API keys:', error);
        return NextResponse.json(
            { success: false, error: 'Error al listar API keys' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/api-keys
 * Crea una nueva API key
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

        // Solo admins pueden crear API keys
        if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json(
                { success: false, error: 'No autorizado' },
                { status: 403 }
            );
        }

        // Verificar si el plan permite acceso a API
        const hasApiAccess = await LimitsService.hasFeature(
            session.user.tenantId,
            'apiAccess'
        );

        if (!hasApiAccess) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'El acceso a la API no está incluido en tu plan',
                    upgradeRequired: true
                },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { name, description, scopes, expiresInDays, rateLimit } = body;

        if (!name || typeof name !== 'string') {
            return NextResponse.json(
                { success: false, error: 'El nombre es requerido' },
                { status: 400 }
            );
        }

        if (!scopes || !Array.isArray(scopes) || scopes.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Debe seleccionar al menos un scope' },
                { status: 400 }
            );
        }

        // Validar scopes
        const validScopes = Object.keys(SCOPES);
        const invalidScopes = scopes.filter(s => !validScopes.includes(s));
        if (invalidScopes.length > 0) {
            return NextResponse.json(
                { success: false, error: `Scopes inválidos: ${invalidScopes.join(', ')}` },
                { status: 400 }
            );
        }

        const result = await ApiKeysService.createApiKey({
            tenantId: session.user.tenantId,
            name,
            description,
            scopes,
            expiresInDays,
            rateLimit
        });

        return NextResponse.json({
            success: true,
            message: 'API key creada correctamente',
            apiKey: result.apiKey,
            secretKey: result.secretKey, // Solo se muestra una vez
            warning: 'Guarda esta clave de forma segura. No podrás verla nuevamente.'
        }, { status: 201 });

    } catch (error) {
        console.error('Error creating API key:', error);
        return NextResponse.json(
            { success: false, error: 'Error al crear la API key' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/api-keys?id=xxx
 * Elimina una API key
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
        const keyId = searchParams.get('id');

        if (!keyId) {
            return NextResponse.json(
                { success: false, error: 'ID de API key requerido' },
                { status: 400 }
            );
        }

        await ApiKeysService.deleteApiKey(session.user.tenantId, keyId);

        return NextResponse.json({
            success: true,
            message: 'API key eliminada correctamente'
        });

    } catch (error) {
        console.error('Error deleting API key:', error);
        return NextResponse.json(
            { success: false, error: 'Error al eliminar la API key' },
            { status: 500 }
        );
    }
}
