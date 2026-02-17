/**
 * API: Verificación individual
 * POST - Procesar (OCR automático) o verificar manualmente
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { identityVerificationService } from '@/lib/identity-verification-service';

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession();
        if (!session?.user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const body = await request.json();
        const { action, approved, rejectionReason } = body;

        switch (action) {
            case 'process':
                // Procesar con OCR/biometría automática
                const result = await identityVerificationService.processVerification(params.id);
                return NextResponse.json(result);

            case 'manual_verify':
                // Verificación manual por admin
                const role = (session.user as any).role;
                if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
                    return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
                }
                const manualResult = await identityVerificationService.manualVerify(
                    params.id,
                    (session.user as any).id,
                    approved ?? false,
                    rejectionReason
                );
                return NextResponse.json(manualResult);

            default:
                return NextResponse.json({ error: 'Acción no válida. Usar: process, manual_verify' }, { status: 400 });
        }
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
