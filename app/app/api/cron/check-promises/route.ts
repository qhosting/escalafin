/**
 * API: Verificar promesas vencidas (Cron Job)
 * POST - Ejecutar verificación de promesas expiradas
 */
import { NextRequest, NextResponse } from 'next/server';
import { promiseToPayService } from '@/lib/promise-service';

export async function POST(request: NextRequest) {
    try {
        // Validar cron secret
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET || 'escalafin-cron-2026';

        if (authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const body = await request.json().catch(() => ({}));
        const tenantId = body.tenantId; // opcional, si no se envía procesa todos

        const result = await promiseToPayService.checkExpiredPromises(tenantId);

        return NextResponse.json({
            success: true,
            ...result,
            executedAt: new Date().toISOString(),
        });
    } catch (error: any) {
        console.error('[CRON] Error verificando promesas:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
