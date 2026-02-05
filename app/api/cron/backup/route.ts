
import { NextRequest, NextResponse } from 'next/server';
import { performBackup } from '@/lib/backup-service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Ejecutar backup (no esperar si es muy largo, pero para V1.0 esperamos para ver resultado)
        // En un entorno serverless estricto esto podría dar timeout.
        // En EasyPanel (Docker container) debería estar bien si el timeout no es corto.

        console.log('[Cron] Iniciando proceso de backup...');

        // Ejecutamos y esperamos para reportar éxito/error
        await performBackup();

        return NextResponse.json({
            success: true,
            message: 'Backup completado exitosamente.'
        });

    } catch (error) {
        console.error('[Cron] Error en backup:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
