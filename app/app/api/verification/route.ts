/**
 * API: Verificación de Identidad (KYC)
 * GET  - Listar verificaciones
 * POST - Iniciar verificación
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { identityVerificationService } from '@/lib/identity-verification-service';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession();
        if (!session?.user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const tenantId = searchParams.get('tenantId') || (session.user as any).tenantId;
        const clientId = searchParams.get('clientId') || undefined;
        const status = searchParams.get('status') as any;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');

        if (!tenantId) {
            return NextResponse.json({ error: 'tenantId requerido' }, { status: 400 });
        }

        // Si se pide un cliente específico, devolver su estado
        if (clientId) {
            const clientStatus = await identityVerificationService.getClientVerificationStatus(clientId);
            return NextResponse.json(clientStatus);
        }

        const result = await identityVerificationService.list({
            tenantId,
            status: status || undefined,
            page,
            limit,
        });

        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession();
        if (!session?.user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const body = await request.json();
        const { clientId, documentType, frontImageUrl, backImageUrl, selfieUrl, tenantId: bodyTenantId } = body;
        const tenantId = bodyTenantId || (session.user as any).tenantId;

        if (!clientId || !documentType) {
            return NextResponse.json(
                { error: 'Campos requeridos: clientId, documentType' },
                { status: 400 }
            );
        }

        const verification = await identityVerificationService.startVerification({
            clientId,
            documentType,
            frontImageUrl,
            backImageUrl,
            selfieUrl,
            tenantId,
        });

        return NextResponse.json(verification, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
