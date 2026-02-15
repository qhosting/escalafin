
import { NextRequest, NextResponse } from 'next/server';
import { InvoiceService } from '@/lib/billing/invoice-service';

export const dynamic = 'force-dynamic';

/**
 * Endpoint para ser llamado por un cron job externo (ej. GitHub Actions, Vercel Cron, etc.)
 * Procesa la facturación recurrente de forma automática.
 */
export async function GET(request: NextRequest) {
    try {
        // Verificar token de seguridad si se desea (opcional)
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;

        // Si hay un secreto configurado, validar que coincida
        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        console.log('🕒 Iniciando proceso de facturación recurrente...');
        const results = await InvoiceService.processRecurringBilling();

        console.log('🕒 Verificando vencimientos de suscripciones...');
        const { SubscriptionNotificationService } = await import('@/lib/billing/subscription-notification-service');
        await SubscriptionNotificationService.checkExpirationsAndNotify();

        console.log('✅ Proceso de facturación completado:', results);

        return NextResponse.json({
            success: true,
            results,
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        console.error('❌ Error en cron de facturación:', error);
        return NextResponse.json(
            { error: 'Error interno procesando facturación', message: error.message },
            { status: 500 }
        );
    }
}
