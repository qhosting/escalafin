/**
 * API: Dashboard de Verificación de Identidad
 * GET - Resumen de verificaciones
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

        const tenantId = (session.user as any).tenantId;
        if (!tenantId) {
            return NextResponse.json({ error: 'tenantId requerido' }, { status: 400 });
        }

        const dashboard = await identityVerificationService.getDashboard(tenantId);
        return NextResponse.json(dashboard);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
