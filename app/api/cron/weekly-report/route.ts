
import { NextRequest, NextResponse } from 'next/server';
import ScheduledTasksService from '@/lib/scheduled-tasks';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log('[Cron] Generando reporte semanal...');
        const tasks = new ScheduledTasksService();
        const report = await tasks.sendWeeklyReport();

        return NextResponse.json({
            success: true,
            message: 'Reporte semanal generado y enviado',
            data: report
        });

    } catch (error) {
        console.error('[Cron] Error reporte semanal:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
