
import { NextRequest, NextResponse } from 'next/server';
import ScheduledTasksService from '@/lib/scheduled-tasks';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log('[Cron] Procesando recordatorios de pagos...');
        const tasks = new ScheduledTasksService();
        await tasks.processPaymentReminders();

        return NextResponse.json({
            success: true,
            message: 'Recordatorios procesados correctamente'
        });

    } catch (error) {
        console.error('[Cron] Error recordatorios:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
